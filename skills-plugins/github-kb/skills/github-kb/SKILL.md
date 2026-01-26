---
name: github-kb
description: 管理本地 GitHub 知识库（/Users/bytedance/Work/github）。当用户需要搜索 GitHub 仓库/PR/Issue、克隆项目到本地、查看或删除本地已有项目时使用此 skill。通过 gh CLI 操作 GitHub，用 CLAUDE.md 维护项目目录。
---

# GitHub Knowledge Base

知识库目录：`/Users/bytedance/Work/github`

目录文件：`/Users/bytedance/Work/github/CLAUDE.md`

## 核心操作

### 搜索 GitHub

使用 `gh search repos/issues/prs` 命令搜索，支持 `--language`、`--sort=stars` 等参数。

### 克隆项目

1. `gh repo clone <owner/repo>` 到知识库目录
2. `gh repo view <owner/repo> --json description` 获取描述
3. 更新 CLAUDE.md，添加记录

### 查看本地项目

读取 CLAUDE.md 或 `ls` 知识库目录。

### 删除项目

1. `rm -rf` 删除目录
2. 更新 CLAUDE.md，移除记录

## CLAUDE.md 格式

```markdown
# GitHub Knowledge Base

| 项目名 | 来源 | 描述 | 添加日期 |
|--------|------|------|----------|
| gin | gin-gonic/gin | Go Web 框架 | 2025-01-26 |
```
