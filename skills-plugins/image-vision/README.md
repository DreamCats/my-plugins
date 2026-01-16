# Image Vision Plugin

基于火山引擎 Ark API 的图片理解和分析插件。

## 功能特性

- 支持多种图片输入格式：
  - 本地文件路径
  - HTTPS URL
  - Base64 编码
- 自动配置检查和管理
- 会话启动时显示配置状态
- 灵活的 API 调用方式

## 目录结构

```
image-vision/
├── .claude-plugin/
│   └── plugin.json          # 插件配置
├── skills/
│   └── image-vision/
│       └── SKILL.md         # 技能文档
├── scripts/
│   ├── vision_api.py        # Python API 调用脚本
│   └── session-start-hook.js # 会话启动 Hook
└── README.md                # 本文件
```

## 安装配置

### 1. 首次使用

插件会在会话启动时自动检查配置。如需手动配置：

```bash
# 创建配置目录
mkdir -p ~/.byted-cli/image

# 创建配置文件
cat > ~/.byted-cli/image/config.json << 'EOF'
{
  "ark_api_key": "你的火山引擎 API Key",
  "model_id": "doubao-1-5-vision-pro-32k-250115"
}
EOF
```

### 2. 获取 API Key

1. 访问 [火山引擎控制台](https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey)
2. 创建或获取 API Key

### 3. 可用模型

查看[模型列表](https://www.volcengine.com/docs/82379/1330310)获取最新可用的视觉模型。

## 使用方法

### 方式 1：通过 Claude Code 对话

```
用户: 分析这张图片 /path/to/image.jpg
用户: 这张图片有什么内容？https://example.com/photo.jpg
用户: 识别截图中的文字 (base64: iVBORw0KG...)
```

### 方式 2：直接调用 Python 脚本

```bash
# 分析本地图片
python3 scripts/vision_api.py "/path/to/image.jpg" "描述图片内容"

# 分析网络图片
python3 scripts/vision_api.py "https://example.com/image.jpg" "主要颜色是什么？"

# 使用 Base64
python3 scripts/vision_api.py "data:image/jpeg;base64,..." "图片中有几个物体？"

# 指定 API Key 和 Model
python3 scripts/vision_api.py "/path/to/image.jpg" "分析图片" \
  --api-key "your-key" \
  --model-id "custom-model"
```

## API 参考

### 请求格式

```json
POST https://ark.cn-beijing.volces.com/api/v3/chat/completions
Authorization: Bearer <ark_api_key>
Content-Type: application/json

{
  "model": "<model_id>",
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "image_url",
          "image_url": {
            "url": "图片URL或Base64"
          }
        },
        {
          "type": "text",
          "text": "你的问题"
        }
      ]
    }
  ]
}
```

### 返回格式

成功：
```json
{
  "success": true,
  "content": "图片分析结果...",
  "usage": {
    "prompt_tokens": 521,
    "completion_tokens": 85,
    "total_tokens": 606
  }
}
```

失败：
```json
{
  "success": false,
  "error": "错误信息"
}
```

## 开发说明

### 更新配置

使用 Bash 工具更新配置：

```bash
# 编辑配置
vi ~/.byted-cli/image/config.json

# 或覆盖配置
echo '{"ark_api_key": "新key", "model_id": "新model"}' > ~/.byted-cli/image/config.json
```

### 调试

查看当前配置状态：

```bash
cat ~/.byted-cli/image/config.json
```

测试 API 调用：

```bash
python3 scripts/vision_api.py "test-image.jpg" "这是什么？"
```

## 常见问题

**Q: API Key 在哪里配置？**
A: 在 `~/.byted-cli/image/config.json` 文件中配置。

**Q: 支持哪些图片格式？**
A: 支持常见的图片格式如 JPG、PNG、GIF 等。

**Q: 图片大小有限制吗？**
A: 是的，API 对图片大小有限制，建议使用优化后的图片。

**Q: 如何更改模型？**
A: 编辑配置文件中的 `model_id` 字段。

## 相关链接

- [火山引擎 Ark API 文档](https://www.volcengine.com/docs/82379/1362931)
- [视觉理解模型说明](https://www.volcengine.com/docs/82379/1362931)
- [API Key 管理](https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey)

## 许可证

MIT License

## 作者

DreamCats <maifeng@bytedance.com>
