#!/usr/bin/env python3
"""
Image Vision API - 调用火山引擎 Ark API 进行图片理解
支持本地图片路径、Base64 编码和 HTTPS URL
"""

import sys
import json
import os
import base64
import argparse
import urllib.request
from pathlib import Path

# 配置文件路径
CONFIG_DIR = Path.home() / ".byted-cli" / "image"
CONFIG_FILE = CONFIG_DIR / "config.json"


def load_config():
    """加载配置文件"""
    if not CONFIG_FILE.exists():
        return None

    try:
        with open(CONFIG_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading config: {e}", file=sys.stderr)
        return None


def save_config(config):
    """保存配置文件"""
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)

    try:
        with open(CONFIG_FILE, "w", encoding="utf-8") as f:
            json.dump(config, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"Error saving config: {e}", file=sys.stderr)
        return False


def image_to_base64(image_path):
    """将本地图片转换为 Base64 编码"""
    try:
        with open(image_path, "rb") as f:
            image_data = f.read()
            return base64.b64encode(image_data).decode("utf-8")
    except Exception as e:
        print(f"Error reading image file: {e}", file=sys.stderr)
        return None


def is_valid_url(url):
    """检查是否是有效的 HTTPS URL"""
    return url.startswith("https://")


def get_image_url(image_input):
    """
    获取图片 URL 或 Base64 编码
    支持三种输入：
    1. 本地文件路径 -> 转换为 Base64
    2. Base64 编码 -> 直接返回（需要 data:image/ 前缀或纯 base64）
    3. HTTPS URL -> 直接返回
    """
    # 检查是否是 URL
    if is_valid_url(image_input):
        return image_input

    # 检查是否已经是 data URL 格式的 Base64
    if image_input.startswith("data:image/"):
        return image_input

    # 检查是否是纯 Base64 字符串（简单判断）
    if len(image_input) > 100 and not image_input.startswith("/"):
        try:
            # 尝试解码验证是否是有效的 base64
            base64.b64decode(image_input, validate=True)
            # 添加 data URL 前缀
            return f"data:image/jpeg;base64,{image_input}"
        except Exception:
            pass

    # 检查是否是本地文件路径
    image_path = Path(image_input)
    if image_path.exists():
        base64_data = image_to_base64(image_path)
        if base64_data:
            return f"data:image/jpeg;base64,{base64_data}"

    return None


def call_vision_api(api_key, model_id, image_url, prompt):
    """调用火山引擎 Vision API"""
    url = "https://ark.cn-beijing.volces.com/api/v3/chat/completions"

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}"
    }

    payload = {
        "model": model_id,
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": image_url
                        }
                    },
                    {
                        "type": "text",
                        "text": prompt
                    }
                ]
            }
        ]
    }

    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers=headers,
            method="POST"
        )

        with urllib.request.urlopen(req, timeout=30) as response:
            response_data = json.loads(response.read().decode("utf-8"))

            if "choices" in response_data and len(response_data["choices"]) > 0:
                content = response_data["choices"][0]["message"]["content"]
                return {
                    "success": True,
                    "content": content,
                    "usage": response_data.get("usage", {})
                }
            else:
                return {
                    "success": False,
                    "error": "No content in response"
                }

    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8")
        try:
            error_json = json.loads(error_body)
            error_msg = error_json.get("error", {}).get("message", error_body)
        except:
            error_msg = error_body
        return {
            "success": False,
            "error": f"HTTP Error {e.code}: {error_msg}"
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


def main():
    parser = argparse.ArgumentParser(
        description="调用火山引擎 Ark API 进行图片理解"
    )
    parser.add_argument(
        "image",
        help="图片输入：本地路径、Base64 编码或 HTTPS URL"
    )
    parser.add_argument(
        "prompt",
        help="对图片的提问或指令"
    )
    parser.add_argument(
        "--api-key",
        help="火山引擎 API Key（可选，默认从配置文件读取）"
    )
    parser.add_argument(
        "--model-id",
        help="模型 ID（可选，默认从配置文件读取）"
    )

    args = parser.parse_args()

    # 加载配置
    config = load_config()

    # 获取 API Key
    api_key = args.api_key or (config.get("ark_api_key") if config else None)
    if not api_key:
        print(json.dumps({
            "success": False,
            "error": "ARK_API_KEY not configured. Please set it in config or use --api-key parameter."
        }, ensure_ascii=False))
        sys.exit(1)

    # 获取 Model ID
    model_id = args.model_id or (config.get("model_id") if config else None)
    if not model_id:
        print(json.dumps({
            "success": False,
            "error": "MODEL_ID not configured. Please set it in config or use --model-id parameter."
        }, ensure_ascii=False))
        sys.exit(1)

    # 处理图片输入
    image_url = get_image_url(args.image)
    if not image_url:
        print(json.dumps({
            "success": False,
            "error": f"Invalid image input: {args.image}. Please provide a valid local path, Base64 string, or HTTPS URL."
        }, ensure_ascii=False))
        sys.exit(1)

    # 调用 API
    result = call_vision_api(api_key, model_id, image_url, args.prompt)
    print(json.dumps(result, ensure_ascii=False, indent=2))

    # 返回退出码
    sys.exit(0 if result["success"] else 1)


if __name__ == "__main__":
    main()
