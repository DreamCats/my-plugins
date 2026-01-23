#!/usr/bin/env python3
"""
火山 LLM 调用模块
支持将画板图片转换为 Mermaid 代码
"""
import base64
import json
import os
from typing import Optional, Dict, Any
import urllib.request
import urllib.error
import datetime


class VolcanoLLMClient:
    """火山 LLM 客户端"""

    def __init__(self, model_id: str, api_key: str, endpoint: str = None):
        """
        初始化客户端

        Args:
            model_id: 模型 ID 或 Endpoint ID
            api_key: API Key
            endpoint: API 端点，默认为北京区域
        """
        self.model_id = model_id
        self.api_key = api_key
        self.endpoint = endpoint or "https://ark.cn-beijing.volces.com/api/v3/chat/completions"

        # 初始化日志目录
        self.log_dir = os.path.expanduser("~/.my-plugins/logs/lark-doc-to-obsidian")
        os.makedirs(self.log_dir, exist_ok=True)

    def _log_response(self, image_path: str, request_data: dict, response_data: dict, mermaid_code: Optional[str]):
        """
        记录 LLM 响应到日志文件

        Args:
            image_path: 图片路径
            request_data: 请求数据
            response_data: 响应数据
            mermaid_code: 提取的 Mermaid 代码（如果有）
        """
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        token = os.path.basename(image_path).replace(".png", "")
        log_file = os.path.join(self.log_dir, f"{timestamp}_{token}.json")

        log_entry = {
            "timestamp": datetime.datetime.now().isoformat(),
            "image_path": image_path,
            "request": {
                "model": request_data.get("model"),
                "messages_count": len(request_data.get("messages", [])),
                "temperature": request_data.get("temperature"),
                "max_tokens": request_data.get("max_tokens")
            },
            "response": {
                "id": response_data.get("id"),
                "model": response_data.get("model"),
                "usage": response_data.get("usage"),
                "finish_reason": response_data.get("choices", [{}])[0].get("finish_reason")
            },
            "content": response_data.get("choices", [{}])[0].get("message", {}).get("content", ""),
            "mermaid_code": mermaid_code
        }

        try:
            with open(log_file, "w", encoding="utf-8") as f:
                json.dump(log_entry, f, ensure_ascii=False, indent=2)
            print(f"[Log] LLM response saved to: {log_file}")
        except Exception as e:
            print(f"[Warning] Failed to save log: {e}")

    def _encode_image(self, image_path: str) -> str:
        """
        将图片编码为 base64

        Args:
            image_path: 图片路径

        Returns:
            base64 编码的图片
        """
        with open(image_path, "rb") as f:
            return base64.b64encode(f.read()).decode("utf-8")

    def _build_request(self, image_base64: str, diagram_type: str = "auto") -> Dict[str, Any]:
        """
        构建请求体

        Args:
            image_base64: base64 编码的图片
            diagram_type: 图表类型（auto, flowchart, sequence, state, er, mindmap）

        Returns:
            请求体字典
        """
        type_hint = ""
        if diagram_type != "auto":
            type_map = {
                "flowchart": "流程图",
                "sequence": "时序图",
                "state": "状态图",
                "er": "ER图",
                "mindmap": "思维导图"
            }
            type_hint = f"这是一张{type_map.get(diagram_type, diagram_type)}，"

        system_prompt = """你是一个专业的图表转换助手，擅长将飞书画板图片转换为 Mermaid 代码。

转换优先级：
1. 架构图/系统图/分层图 → 优先使用 flowchart（即使没有连接线）
2. 时序交互图 → 使用 sequenceDiagram
3. 状态机图 → 使用 stateDiagram-v2
4. 实体关系图 → 使用 erDiagram
5. 项目时间轴/里程碑 → 使用 flowchart + 自定义样式
6. 真正的思维导图（放射状层级）→ 使用 mindmap

转换规则：
- flowchart（流程图/架构图）：使用 graph TD（从上到下）或 graph LR（从左到右）
  - 节点定义：A[节点文本]、B(节点文本)、C{判断节点}
  - 有连接线时：A --> B（严格按照原图的连接关系）
  - 无连接线时：只定义节点，使用 subgraph 分组，不要添加箭头
  - 样式定义：使用 classDef 定义样式，如 classDef default fill:#f9f,stroke:#333,stroke-width:2px
- sequenceDiagram（时序图）：使用 sequenceDiagram
  - 参与者用 participant 定义
  - 消息用 ->> 或 -->> 表示
- stateDiagram-v2（状态图）：使用 stateDiagram-v2
  - 状态转换用 --> 表示
  - [*] 表示开始/结束状态
- erDiagram（ER图）：使用 erDiagram
  - 实体关系用 ||--o{ 或 ||--|| 表示
- mindmap（思维导图）：仅在真正的放射状思维导图时使用
  - 使用缩进表示层级关系

注意事项：
- 只返回 Mermaid 代码，不要任何解释文字
- 节点文字使用中文，保持与原图一致
- 严格遵循原图的连接关系，不要添加原图中没有的箭头或连接
- 如果原图没有连接线，就只列出节点，用 subgraph 分组，不要写 -->
- 如果图表过于复杂无法用 Mermaid 表达，返回 "COMPLEX:原图描述"，其中原图描述简要说明内容

输出格式：
- 如果可转换：直接输出 Mermaid 代码块
- 如果无法转换：输出 COMPLEX: <原因>
"""

        user_prompt = f"""{type_hint}请将其转换为 Mermaid 代码。

如果图表包含：
- 自由绘制、手绘内容 → 返回 COMPLEX: 包含自由绘制内容
- 复杂的图形组合（超过50个节点）→ 返回 COMPLEX: 节点过多
- 非标准图形元素 → 返回 COMPLEX: 包含非标准图形

否则请转换为对应的 Mermaid 代码。"""

        return {
            "model": self.model_id,
            "messages": [
                {
                    "role": "system",
                    "content": system_prompt
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/png;base64,{image_base64}",
                                "detail": "high"
                            }
                        },
                        {
                            "type": "text",
                            "text": user_prompt
                        }
                    ]
                }
            ],
            "temperature": 0.3,
            "max_tokens": 4096,
            "thinking": {
                "type": "disabled"
            }
        }

    def convert_to_mermaid(self, image_path: str, diagram_type: str = "auto") -> Optional[str]:
        """
        将画板图片转换为 Mermaid 代码

        Args:
            image_path: 画板缩略图路径
            diagram_type: 图表类型提示（可选）

        Returns:
            Mermaid 代码字符串，如果失败则返回 None
        """
        try:
            # 检查图片是否存在
            if not os.path.exists(image_path):
                return None

            # 编码图片
            image_base64 = self._encode_image(image_path)

            # 构建请求
            request_data = self._build_request(image_base64, diagram_type)

            # 发送请求
            headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.api_key}"
            }

            print(f"[Info] Sending request to Volcano LLM (timeout: 90s)...")

            req = urllib.request.Request(
                self.endpoint,
                data=json.dumps(request_data).encode("utf-8"),
                headers=headers,
                method="POST"
            )

            with urllib.request.urlopen(req, timeout=90) as response:
                print(f"[Info] Received response from Volcano LLM")
                result = json.loads(response.read().decode("utf-8"))

            # 提取生成的内容
            content = result.get("choices", [{}])[0].get("message", {}).get("content", "")

            if not content:
                # 记录空响应
                self._log_response(image_path, request_data, result, None)
                return None

            # 清理内容
            content = content.strip()

            # 检查是否为复杂图表
            if content.startswith("COMPLEX:"):
                # 记录无法转换的情况
                self._log_response(image_path, request_data, result, None)
                return None  # 返回 None 表示无法转换

            # 移除可能的 markdown 代码块标记
            if content.startswith("```mermaid"):
                content = content[11:]
            elif content.startswith("```"):
                content = content[3:]

            if content.endswith("```"):
                content = content[:-3]

            mermaid_code = content.strip()

            # 记录成功的转换
            self._log_response(image_path, request_data, result, mermaid_code)

            return mermaid_code

        except Exception as e:
            print(f"Warning: Failed to convert {image_path} to mermaid: {e}")
            return None


def load_config() -> Optional[Dict[str, Any]]:
    """
    从用户目录加载配置文件

    Returns:
        配置字典，如果文件不存在则返回 None
    """
    import os
    config_path = os.path.expanduser("~/.my-plugins/lark-doc-to-obsidian.json")

    if not os.path.exists(config_path):
        return None

    try:
        with open(config_path, "r", encoding="utf-8") as f:
            config = json.load(f)
        return config
    except Exception as e:
        print(f"Warning: Failed to load config from {config_path}: {e}")
        return None


def create_client_from_config() -> Optional[VolcanoLLMClient]:
    """
    从配置文件创建客户端

    Returns:
        VolcanoLLMClient 实例，如果配置不全则返回 None
    """
    config = load_config()
    if not config:
        return None

    volcano_config = config.get("volcano", {})
    model_id = volcano_config.get("model_id", "")
    api_key = volcano_config.get("api_key", "")

    if not model_id or not api_key:
        return None

    return VolcanoLLMClient(
        model_id=model_id,
        api_key=api_key,
        endpoint=volcano_config.get("endpoint")
    )
