---
description: 归档已完成的变更
argument-hint: [change-id]
allowed-tools: Bash(bash*), Bash(git*), Bash(mv*), Bash(rm*), Bash(pwd*), Bash(lark-cli*), Bash(python3*), Read, Glob, Grep
---

# /repo-archive 命令

本命令将已完成的变更归档到 archive 目录，并清理 Worktree。

## 工作流程检查清单（强制执行）

**复制或者使用 "TodoWrite" 以下检查清单并跟踪进度：**

```
Repo-Archive Progress:
- [ ] 步骤 1: 运行脚本归档
- [ ] 步骤 2: lark-send-msg - 发送飞书摘要
```

**重要**：完成每个步骤后，更新检查清单。不要跳过任何步骤。

## 参数

- `$1` 或 `$ARGUMENTS` - 变更 ID（如 `change-email-verification-20250112`）

## 步骤 1: 运行脚本归档（推荐）

脚本会完成归档目录移动、PlanSpec 更新与 Worktree 清理：

```bash
CHANGE_ID="${1:-$ARGUMENTS}"
PROJECT_ROOT=$(git rev-parse --show-toplevel)
PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT}"
SCRIPT_DIR="$PLUGIN_ROOT/scripts/bytecoding"
# Some environments set CLAUDE_PLUGIN_ROOT to scripts/bytecoding already.
if [ -x "$PLUGIN_ROOT/repo-archive.sh" ]; then
  SCRIPT_DIR="$PLUGIN_ROOT"
fi
if [ ! -x "$SCRIPT_DIR/repo-archive.sh" ]; then
  echo "错误：找不到插件脚本，请确认插件路径"
  exit 1
fi
# 如需忽略 status 校验，设置 FORCE_FLAG="--force"
FORCE_FLAG=""
bash "$SCRIPT_DIR/repo-archive.sh" --change-id "$CHANGE_ID" $FORCE_FLAG
```

## 步骤 2: 发送飞书摘要（使用 lark-send-msg）

在命令结束后，使用 **lark-send-msg** 技能**生成消息内容并执行发送**（通过 Skill 工具调用 + `lark-cli send-message`）。

**接收人**：使用 SessionStart Hook 展示的 Git 用户邮箱（`user.email`）。  
**如果未配置邮箱**：提示用户补充邮箱后再发送。

**摘要内容建议**：

- 变更 ID
- 归档时间
- 归档位置
- 是否清理 Worktree/分支

**执行方式**：

1. 通过 `Skill(lark-send-msg)` 选择 `msg_type` 并生成单行 `content` JSON。
2. 执行发送（示例）：

```bash
lark-cli send-message --receive-id-type email --msg-type text "$GIT_EMAIL" '{"text":"变更 ID: ...\n归档时间: ...\n归档位置: ...\n清理: worktree/分支已处理"}'
```

如需富文本排版，请使用 `msg_type=post` 并按 `lark-send-msg` 的结构生成 JSON。

## 完成标志

当以下条件满足时，本命令完成：

- [x] 变更目录已移动到 archive/
- [x] PlanSpec 状态已更新为 archived
- [x] Worktree 已清理（如果存在）
- [x] 已执行 `lark-cli send-message` 发送飞书摘要（如 git 邮箱可用）

## 归档目录结构

```
项目根目录/
├── .bytecoding/
│   └── changes/
│       ├── archive/          # 已归档的变更
│       │   ├── change-email-verification-20250112/
│       │   │   ├── planspec.yaml
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
