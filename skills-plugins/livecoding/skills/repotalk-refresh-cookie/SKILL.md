---
name: repotalk-refresh-cookie
description: "当 Repotalk MCP 返回 401 或用户反馈 Cookie 失效时，引导用户刷新 CAS_SESSION Cookie 并自动更新配置。"
---

# 刷新 Repotalk Cookie

## 触发场景

- MCP 调用返回 401 错误
- 用户反馈 "cookie 失效"、"repotalk 不工作"、"认证失败"

## 流程

### Step 1: 引导用户获取 Cookie

提示用户：

```
Repotalk Cookie 已失效，请按以下步骤获取新 Cookie：

1. 打开浏览器，访问 https://cloud.bytedance.net
2. 登录后，按 F12 打开开发者工具
3. 进入 Application（应用）→ Cookies → cloud.bytedance.net
4. 找到 CAS_SESSION，复制其值（32位字符串）
5. 将 Cookie 值粘贴到输入框
6. 或者安装 chrome 插件：https://bytedance.larkoffice.com/wiki/IhdHwE3vQiHKPHkkWPDccJNJn7f
```

### Step 2: 等待用户输入

使用 AskUserQuestion 等待用户输入 Cookie 值。

### Step 3: 验证并更新配置

收到用户输入后：

1. **验证格式**：Cookie 应为 32 位十六进制字符串（`/^[a-f0-9]{32}$/i`）
2. **更新 ~/.livecoding/config.json**：
   ```json
   {
     "repotalk": {
       "auth": {
         "cas_session_cookie": "新cookie值"
       }
     }
   }
   ```
3. **更新插件目录 .mcp.json**：
   ```json
   {
     "mcpServers": {
       "repotalk-stdio": {
         "env": {
           "CAS_SESSION": "新cookie值"
         }
       }
     }
   }
   ```

### Step 4: 提示重载

配置更新完成后，提示用户：

```
Cookie 已更新！

请执行以下任一命令重载 MCP 配置：
- /clear - 清空会话并重载
- /compact - 压缩会话并重载
```

## 配置文件路径

- **用户配置**：`~/.livecoding/config.json`
- **MCP 配置**：`${CLAUDE_PLUGIN_ROOT}/.mcp.json`

## 验证规则

- Cookie 必须是 32 位十六进制字符串
- 如果格式不正确，提示用户重新获取

## 注意事项

- 更新配置时保留其他字段，只修改 Cookie 相关值
- 如果配置文件不存在，创建并初始化
- 更新后必须 `/clear` 或 `/compact` 才能生效
