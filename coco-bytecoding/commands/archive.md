---
description: 归档已完成的变更
argument-hint: [change-id]
allowed-tools: Bash(bash*), Bash(node*), Bash(git*), Bash(mv*), Bash(rm*), Bash(pwd*), Bash(lark-cli*), Read, Glob, Grep
---

# /archive 命令

本命令将已完成的变更归档到 archive 目录，并清理 Worktree。

## 工作流程检查清单（强制执行）

**复制或者使用 "TodoWrite" 以下检查清单并跟踪进度：**

```
Repo-Archive Progress:
- [ ] 步骤 1: 运行脚本归档 + 生成总结 + 发送飞书摘要
```

**重要**：完成每个步骤后，更新检查清单。不要跳过任何步骤。

## 参数

- `$1` 或 `$ARGUMENTS` - 变更 ID（如 `change-email-verification-20250112`）

## 步骤 1: 运行脚本归档（推荐）

脚本会完成归档目录移动、PlanSpec 更新、生成 `archive-summary.md`、发送飞书摘要与 Worktree 清理：

```bash
CHANGE_ID="${1:-$ARGUMENTS}"
PROJECT_ROOT=$(git rev-parse --show-toplevel)
PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT}"
SCRIPT_DIR="$PLUGIN_ROOT/scripts/bytecoding"
# Some environments set CLAUDE_PLUGIN_ROOT to scripts/bytecoding already.
if [ -f "$PLUGIN_ROOT/repo-archive.js" ]; then
  SCRIPT_DIR="$PLUGIN_ROOT"
fi
# 如需忽略 status 校验，设置 FORCE_FLAG="--force"
FORCE_FLAG=""
node "$SCRIPT_DIR/repo-archive.js" \
  --change-id "$CHANGE_ID" \
  --verify "go build ./...: pass" \
  --verify "e2e: pass" \
  $FORCE_FLAG
```

**说明**：脚本默认会基于 `planspec.yaml` 的 `lark_docs` / `mr_url` / `lark_email` 组装消息并发送；如需跳过发送，传 `--no-lark`。

## 完成标志

当以下条件满足时，本命令完成：

- [x] 变更目录已移动到 archive/
- [x] PlanSpec 状态已更新为 archived
- [x] 已生成 `archive-summary.md`
- [x] Worktree 已清理（如果存在）
- [x] 已执行 `lark-cli send-message` 发送飞书摘要（如 lark_email 可用）

## 归档目录结构

```
项目根目录/
├── .bytecoding/
│   └── changes/
│       ├── archive/          # 已归档的变更
│       │   ├── change-email-verification-20250112/
│       │   │   ├── planspec.yaml
│       │   │   ├── archive-summary.md
│       │   │   ├── proposal.md
│       │   │   ├── design.md
│       │   │   └── tasks.md
│       │   └── change-user-profile-20250115/
│       │       ├── planspec.yaml
│       │       ├── proposal.md
│       │       ├── design.md
│       │       └── tasks.md
│       └── (活跃变更在这里)
└── ...
```

## 查看已归档变更

```bash
# 列出所有归档变更
ls -1 "$PROJECT_ROOT/.bytecoding/changes/archive/"

# 查看特定归档变更
cat "$PROJECT_ROOT/.bytecoding/changes/archive/$CHANGE_ID/proposal.md"
```

## 恢复已归档变更

如果需要从归档恢复变更：

```bash
# 移回活跃目录
mv "$PROJECT_ROOT/.bytecoding/changes/archive/$CHANGE_ID" "$PROJECT_ROOT/.bytecoding/changes/"

# 更新 PlanSpec 状态
sed -i '' 's/status: archived/status: pending/' "$PROJECT_ROOT/.bytecoding/changes/$CHANGE_ID/planspec.yaml"
```
