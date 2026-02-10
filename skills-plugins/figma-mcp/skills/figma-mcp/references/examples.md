# Figma MCP 示例

## 1. 从 URL 查看设计稿（最常用）

用户给了 URL：`https://www.figma.com/design/1Dtd6zlbn9TQpF7E9LoMTO/名称?node-id=113-25054`

```bash
# 第一步：浅层获取，了解结构
python3 ${CLAUDE_PLUGIN_ROOT}/scripts/figma_mcp.py call --name get_figma_data \
  --args '{"fileKey":"1Dtd6zlbn9TQpF7E9LoMTO", "nodeId":"113:25054", "depth": 1}' 2>&1 | tail -200

# 第二步：深入某个子节点
python3 ${CLAUDE_PLUGIN_ROOT}/scripts/figma_mcp.py call --name get_figma_data \
  --args '{"fileKey":"1Dtd6zlbn9TQpF7E9LoMTO", "nodeId":"113:25108"}' 2>&1 | head -500
```

## 2. 获取文件顶层信息

```bash
python3 ${CLAUDE_PLUGIN_ROOT}/scripts/figma_mcp.py call --name get_figma_data \
  --args '{"fileKey":"AbCdEf123456"}' 2>&1 | head -200
```

## 3. 下载图片

推荐使用 args-file 方式，避免命令行太长：

```bash
# 创建参数文件
cat > /tmp/figma_images.json << 'EOF'
{
  "fileKey": "AbCdEf123456",
  "localPath": ".figma/assets",
  "nodes": [
    {"nodeId": "1234:5678", "fileName": "icon_login.svg"},
    {
      "nodeId": "2345:6789",
      "imageRef": "5d0ede3d922ee47d08d911e45cf4d084def7e21e",
      "fileName": "hero_banner.png"
    }
  ],
  "pngScale": 2
}
EOF

# 执行下载
python3 ${CLAUDE_PLUGIN_ROOT}/scripts/figma_mcp.py call --name download_figma_images \
  --args-file /tmp/figma_images.json 2>&1
```

## 4. 列出所有可用工具

```bash
python3 ${CLAUDE_PLUGIN_ROOT}/scripts/figma_mcp.py list-tools --pretty 2>&1
```

## 5. 排查技巧

- **提示缺少参数**：检查 `inputSchema.required` 字段
- **JSON 格式报错**：用 `--args-file` 代替 `--args` 传参
- **临时更换密钥**：`FIGMA_API_KEY=xxx python3 ${CLAUDE_PLUGIN_ROOT}/scripts/figma_mcp.py ...`
- **超时**：用 `--timeout 120` 增加超时时间
- **输出过大**：用 `| head -N` / `| tail -N` 截取，或用 `depth: 1` 限制深度
