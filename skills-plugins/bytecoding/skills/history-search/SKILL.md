---
name: history-search
description: "当用户想查找历史改动记录时触发 - 包括「上次改 xxx」「之前加了 xxx」「改过 xxx 文件」「我之前在这个文件改了什么」「这个文件什么时候加的 xxx」「我什么时候改过 xxx」等表达。使用 git log -S 搜索代码变更历史。"
---

# History Search

用自然语言查找代码改动历史。

## 触发场景

| 表达方式 | 示例 |
|---------|------|
| 上次改 xxx | "我上次改 user.go 是什么时候？" |
| 之前加了 xxx | "之前加了 GetUserByID 接口" |
| 改过 xxx 文件 | "我改过 handler/user.go 吗？" |
| 什么时候加的 xxx | "这个文件什么时候加的 xxx 字段？" |
| 查历史记录 | "我什么时候改过这个文件？" |

## 执行逻辑

1. 从用户描述中提取搜索关键词（文件名、函数名、类名、变量名等）
2. 执行 `git log -S"<关键词>" --oneline --since="6 months ago"`
3. 返回最近 5 条相关 commits（如果用户没指定时间范围）

## 输出格式

```
找到 N 条相关记录：

<HASH> <emoji> <type>: <subject>
  Date: <date>
  Files: <changed files>
  Diff: +<added lines> -<removed lines>

... (最多 5 条)

想查看详细 diff？
  git show <HASH>
```

## 示例

**用户**："我上次改 user.go 是什么时候？"

**执行**：
```bash
git log -S"handler/user.go" --oneline --since="6 months ago" -5
```

**输出**：
```
找到 3 条相关记录：

a1b2c3d ✨ feat: 新增 GetUserByID 接口
  Date: 2026-02-01 14:30:00
  Files: handler/user.go, service/user.go
  Diff: +120 -5

e5f6g7h 🐛 fix: 修复 user.go 字段校验
  Date: 2026-01-28 10:15:00
  Files: handler/user.go
  Diff: +15 -8

i9j0k1l ♻️ refactor: 简化 user 结构
  Date: 2026-01-15 09:00:00
  Files: models/user.go
  Diff: +45 -30

想查看详细 diff？
  git show a1b2c3d
```

## 搜索技巧

| 搜索内容 | 命令 |
|---------|------|
| 精确文件名 | `git log -S"handler/user.go" --oneline` |
| 函数名 | `git log -S"GetUserByID" --oneline` |
| 变量名 | `git log -S"UserID" --oneline` |
| 只看某个文件 | `git log -p -- "handler/user.go"` |

## 注意事项

- 优先使用用户提到的具体名称（文件名 > 函数名 > 变量名）
- 如果结果为空，扩大搜索范围或提醒用户换关键词
- 最多返回 5 条，太多结果用户看不完
