# My Claude Code Plugins

这是我的 Claude Code 插件集合，包含各种实用技能和工具，专为提升开发效率和团队协作而设计。

## 🚀 插件列表

### 🎨 图像生成
- **[ark-generate-image](./skills-plugins/ark-generate-image)** - 使用 ark-cli generate 根据文本提示生成图片并获取返回 URL，支持指定尺寸和格式输出
- **[polish-image-prompt](./skills-plugins/polish-image-prompt)** - 图片提示词优化工具，用于改进和优化AI图像生成的提示词

### 💻 开发工具
- **[live_rd](./skills-plugins/live_rd)** - Go 项目的 AI Review 与 AI Commit Message 规范化工具（含 commands/skills/hooks 兜底）
- **[byted-codebase](./skills-plugins/byted-codebase)** - 字节代码库相关工具，提供代码分析和处理功能
- **[byted-logid](./skills-plugins/byted-logid)** - 字节日志ID处理工具，用于日志追踪和分析

### 🎨 设计工具
- **[figma-mcp](./skills-plugins/figma-mcp)** - Figma集成工具，支持设计文件操作和组件管理

### 💬 通信工具
- **[gcmsg](./skills-plugins/gcmsg)** - 消息处理工具，提供消息格式化和处理功能
- **[gcmsge](./skills-plugins/gcmsge)** - 增强版消息处理工具，扩展了gcmsg的功能
- **[lark-send-msg](./skills-plugins/lark-send-msg)** - 使用 lark-cli send-message 向飞书用户或群聊发送消息，自动判断消息类型并构造content JSON

### 📈 生产力工具
- **[lark-add-permission](./skills-plugins/lark-add-permission)** - 飞书权限管理工具，用于添加和管理用户权限
- **[lark-create-plantuml](./skills-plugins/lark-create-plantuml)** - 飞书PlantUML图表创建工具，支持在飞书中生成UML图表
- **[write-lark-markdown](./skills-plugins/write-lark-markdown)** - 结构化 Markdown 写作规范（tech-design/howto/research/proposal），强制 PlantUML-only 图表 + callout 高亮块
- **[lark-doc-to-md](./skills-plugins/lark-doc-to-md)** - 飞书文档转Markdown工具，将飞书文档转换为Markdown格式
- **[lark-md-to-doc](./skills-plugins/lark-md-to-doc)** - Markdown转飞书文档工具，将Markdown内容转换为飞书文档格式
- **[docshub](./skills-plugins/docshub)** - Docshub MCP integration，提供文档中心集成功能
- **[lark-to-debug-doc](./skills-plugins/lark-to-debug-doc)** - 根据用户输入生成标准化的联调文档（Markdown），支持推送到飞书
- **[cninfo-announcement-search](./skills-plugins/cninfo-announcement-search)** - 巨潮资讯网公告查询与结构化输出工具，支持关键词过滤与 PDF 内容匹配

## 📋 分类总览

| 分类 | 插件数量 | 描述 |
|------|---------|------|
| 图像生成 | 2 | AI图像生成和优化相关工具 |
| 开发工具 | 3 | 代码分析和日志处理工具 |
| 设计工具 | 1 | Figma设计集成工具 |
| 通信工具 | 3 | 消息处理和飞书消息发送工具 |
| 生产力工具 | 8 | 飞书生态系统的各种效率工具和文档中心集成 |

## 🛠️ 安装和使用

### 1. 克隆此仓库
```bash
git clone git@github.com:DreamCats/my-plugins.git
```

### 2. 在 Claude Code 中安装 Marketplace

#### 方法一：通过 marketplace.json 安装（推荐）
1. 打开 Claude Code
2. 使用命令添加 marketplace：
```bash
/marketplace add /path/to/my-plugins/.claude-plugin/marketplace.json
```
3. 或者将 marketplace.json 文件拖入 Claude Code 界面

#### 方法二：手动安装单个插件
1. 进入 Claude Code 设置
2. 找到 "Plugins" 或 "Skills" 选项
3. 点击 "Add Plugin" 或 "Install from local"
4. 选择插件目录下的 `.claude-plugin/plugin.json` 文件

### 3. 启用插件

安装 marketplace 后：
1. 在 Claude Code 插件市场中浏览可用插件
2. 点击插件名称查看详情
3. 点击 "Enable" 或 "Install" 按钮启用插件
4. 插件启用后即可在对话中使用相关技能

### 4. 使用插件

启用插件后，你可以：
- 直接在对话中调用插件功能
- 使用 `/skills` 命令查看已启用的技能
- 使用 `/help <skill-name>` 查看特定技能的使用帮助

### 5. 更新插件

当插件有更新时：
1. 拉取最新代码：`git pull`
2. 在 Claude Code 中重新加载插件配置
3. 或者重启 Claude Code 以应用更新

## 📖 详细文档

每个插件都包含详细的 SKILL.md 文档，说明：
- 使用场景
- 命令参数
- 输入输出格式
- 使用示例
- 注意事项

请查看各插件目录下的 SKILL.md 文件获取详细信息。

## ⚠️ 重要说明

> **注意**：本项目已更新目录结构，插件已从 `skills` 目录迁移到 `skills-plugins` 目录。请确保使用最新的路径配置。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进这些插件。

### 贡献指南
1. Fork 本仓库
2. 创建你的特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交你的更改 (`git commit -m '✨ feat: 添加新功能'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 打开一个 Pull Request

## 📄 许可证

MIT License

## 📞 联系

- 作者：DreamCats (买峰)
- 邮箱：maifeng@bytedance.com
- GitHub：https://github.com/DreamCats

---

⭐ 如果这个项目对你有帮助，请给个 Star 支持一下！
