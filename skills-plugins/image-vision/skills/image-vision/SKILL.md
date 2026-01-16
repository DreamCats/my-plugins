---
name: image-vision
description: 此技能用于图片理解和分析。当用户需要"分析图片"、"理解图片内容"、"识别图片中的信息"、或任何涉及图片理解和描述的任务时，应该调用此技能。支持本地图片路径、Base64 编码和 HTTPS URL。
---

# Image Vision - 图片理解技能

这个技能帮助你使用火山引擎 Ark API 进行图片理解和分析。支持多种图片输入方式，包括本地文件路径、Base64 编码和 HTTPS URL。

## 使用场景

当用户请求以下任务时，应该使用此技能：

- 分析图片内容（描述图片中的元素、场景、对象等）
- 识别图片中的文字（OCR）
- 理解图片的情感或氛围
- 提取图片中的关键信息
- 回答关于图片的问题
- 对图片进行分类或标记
- 生成图片的详细描述

## 支持的输入格式

### 1. 本地文件路径
```
/Users/bytedance/Pictures/photo.jpg
./images/screenshot.png
```

### 2. HTTPS URL
```
https://example.com/image.jpg
https://cdn.example.com/photos/img.png
```

### 3. Base64 编码
```
data:image/jpeg;base64,/9j/4AAQSkZJRgABA...
(纯 Base64 字符串也可以，会自动添加前缀)
```

## 配置要求

### 首次使用配置

插件会在会话启动时自动检查配置。如果配置不存在或未完成，会提示你进行配置。

配置文件位置：`~/.byted-cli/image/config.json`

### 配置内容

```json
{
  "ark_api_key": "你的火山引擎 API Key",
  "model_id": "doubao-1-5-vision-pro-32k-250115"
}
```

### 获取 API Key 和 Model ID

1. 访问 [火山引擎 Ark 控制台](https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey)
2. 创建或获取你的 API Key
3. 在[模型列表](https://www.volcengine.com/docs/82379/1330310)中查看可用的视觉模型 ID

### 配置方法

使用 Bash 工具直接编辑配置文件：

```bash
# 创建配置目录
mkdir -p ~/.byted-cli/image

# 编辑配置文件
vi ~/.byted-cli/image/config.json
```

或者使用命令覆盖配置：

```bash
echo '{"ark_api_key": "你的key", "model_id": "模型ID"}' > ~/.byted-cli/image/config.json
```

## 使用流程

1. **识别图片输入类型**
   - 判断用户提供的是本地路径、URL 还是 Base64
   - 确认输入格式正确

2. **构建提示词**
   - 根据用户的问题构建合适的提示词
   - 提示词应该清晰、具体

3. **调用 Python 脚本**
   - 使用 Bash 工具执行 vision_api.py
   - 传入图片输入和提示词

4. **处理返回结果**
   - 解析 API 返回的 JSON 结果
   - 将内容呈现给用户

## Python 脚本使用

### 脚本位置
```
${CLAUDE_PLUGIN_ROOT}/scripts/vision_api.py
```

### 命令格式
```bash
python3 ${CLAUDE_PLUGIN_ROOT}/scripts/vision_api.py <图片> <提示词> [--api-key <key>] [--model-id <model>]
```

### 参数说明
- `image`: 图片输入（必需）- 支持路径、URL 或 Base64
- `prompt`: 对图片的提问或指令（必需）
- `--api-key`: API Key（可选，默认从配置读取）
- `--model-id`: 模型 ID（可选，默认从配置读取）

### 使用示例

**分析本地图片：**
```bash
python3 ${CLAUDE_PLUGIN_ROOT}/scripts/vision_api.py "/Users/xxx/photo.jpg" "描述这张图片的内容"
```

**分析网络图片：**
```bash
python3 ${CLAUDE_PLUGIN_ROOT}/scripts/vision_api.py "https://example.com/image.jpg" "这张图片的主要颜色是什么？"
```

**使用 Base64：**
```bash
python3 ${CLAUDE_PLUGIN_ROOT}/scripts/vision_api.py "data:image/jpeg;base64,/9j/4AAQ..." "图片中有几个人？"
```

**指定 API Key 和 Model：**
```bash
python3 ${CLAUDE_PLUGIN_ROOT}/scripts/vision_api.py "/path/to/image.jpg" "分析图片" --api-key "your-key" --model-id "custom-model"
```

## 返回结果格式

成功时：
```json
{
  "success": true,
  "content": "图片分析的详细内容...",
  "usage": {
    "prompt_tokens": 521,
    "completion_tokens": 85,
    "total_tokens": 606
  }
}
```

失败时：
```json
{
  "success": false,
  "error": "错误信息描述"
}
```

## 最佳实践

### 提示词设计
- **具体明确**: "描述图片中的所有元素" 比 "这是什么" 更好
- **关注重点**: "图片中的文字内容是什么" 比 "告诉我所有信息" 更高效
- **结构化输出**: 可以要求模型按特定格式输出，如"用列表列出所有物品"

### 错误处理
常见错误及解决方案：

1. **API Key 未配置**
   - 检查 `~/.byted-cli/image/config.json` 是否存在且包含 `ark_api_key`

2. **Model ID 未配置**
   - 确认配置文件中包含有效的 `model_id`

3. **图片文件不存在**
   - 验证本地文件路径是否正确
   - 对于 URL，确保网络可访问

4. **API 调用失败**
   - 检查 API Key 是否有效
   - 确认账户余额充足
   - 检查网络连接

## 示例对话

**示例 1：描述图片内容**
```
用户: 分析这张图片 /Users/xxx/sunset.jpg
AI: 让我来帮你分析这张图片。
[调用 Python 脚本]
这张图片展示了日落时分的美丽景色，天空呈现橙红色渐变...
```

**示例 2：识别文字**
```
用户: 这个截图 https://example.com/screenshot.png 里有错误信息吗？
AI: 我来查看这张截图。
[调用 Python 脚本]
是的，我看到了错误信息： "Error: Connection timeout" 出现在...
```

**示例 3：理解复杂场景**
```
用户: 这张照片的构图如何？(base64: iVBORw0KG...)
AI: 让我分析这张照片的构图。
[调用 Python 脚本]
这张照片采用了三分法构图，主体位于右侧三分之一处...
```

## 高级用法

### 批量分析
如果用户有多张图片需要分析，可以依次处理每张图片。

### 对比分析
可以分别分析两张图片，然后进行比较。

### 结构化输出
可以在提示词中要求特定格式输出：
- "用 JSON 格式列出图片中所有物体"
- "用表格对比图片中的不同元素"

## 参考资源

- [火山引擎 Ark API 文档](https://www.volcengine.com/docs/82379/1362931)
- [视觉理解模型列表](https://www.volcengine.com/docs/82379/1330310)
- [API Key 管理](https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey)
