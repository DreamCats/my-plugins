---
description: 归档已完成的变更
argument-hint: [change-id]
allowed-tools: Bash(git*), Bash(mv*), Bash(rm*), Bash(pwd*), Bash(lark-cli*), Bash(python3*), Read, Glob, Grep
---

# /repo-archive 命令

本命令将已完成的变更归档到 archive 目录，并清理 Worktree。

## 参数

- `$1` 或 `$ARGUMENTS` - 变更 ID（如 `change-email-verification-20250112`）

## 步骤 1: 验证变更状态

首先，验证变更是否已完成（项目级）：

```bash
# 从参数获取 change-id
CHANGE_ID="${1:-$ARGUMENTS}"

# 获取当前项目根目录
PROJECT_ROOT=$(pwd)

# 验证目录存在
if [ ! -d "$PROJECT_ROOT/.bytecoding/changes/$CHANGE_ID" ]; then
  echo "错误：变更不存在 - $CHANGE_ID"
  exit 1
fi

# 读取 PlanSpec 状态
STATUS=$(grep "status:" "$PROJECT_ROOT/.bytecoding/changes/$CHANGE_ID/planspec.yaml" | head -1 | cut -d' ' -f2)

if [ "$STATUS" != "completed" ]; then
  echo "警告：变更状态为 '$STATUS'，未标记为 completed"
  echo "请确认所有任务已完成后再归档"
  read -p "是否继续归档？(y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
  fi
fi

echo "✅ 变更状态验证通过"
echo "变更 ID: $CHANGE_ID"
echo "项目目录: $PROJECT_ROOT"
```

## 步骤 2: 检查 Git 状态

确认变更已在主分支合并：

```bash
# 检查 worktree 是否存在
if git worktree list | grep -q "feature-$CHANGE_ID"; then
  echo "检测到 Worktree: feature-$CHANGE_ID"

  # 检查 worktree 中的分支状态
  WORKTREE_PATH=$(git worktree list | grep "feature-$CHANGE_ID" | awk '{print $1}')

  echo "Worktree 路径: $WORKTREE_PATH"
  echo "请在合并后再归档 Worktree"
fi
```

## 步骤 3: 移动变更到归档目录

将变更目录移动到 archive（项目级）：

```bash
# 确保 archive 目录存在
mkdir -p "$PROJECT_ROOT/.bytecoding/changes/archive"

# 移动变更目录
mv "$PROJECT_ROOT/.bytecoding/changes/$CHANGE_ID" "$PROJECT_ROOT/.bytecoding/changes/archive/"

echo "✅ 变更已归档到: .bytecoding/changes/archive/$CHANGE_ID"
```

## 步骤 4: 清理 Worktree（可选）

如果 Worktree 已不再需要，清理它：

```bash
# 检查 worktree 是否存在
if git worktree list | grep -q "feature-$CHANGE_ID"; then
  echo ""
  echo "检测到 Worktree 仍然存在"
  read -p "是否清理 Worktree？(y/n) " -n 1 -r
  echo

  if [[ $REPLY =~ ^[Yy]$ ]]; then
    # 删除 worktree
    git worktree remove "../feature-$CHANGE_ID"

    # 删除分支（可选）
    read -p "是否也删除分支 feature/$CHANGE_ID？(y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      git branch -d "feature/$CHANGE_ID"
      echo "✅ 分支已删除"
    fi

    echo "✅ Worktree 已清理"
  fi
fi
```

## 步骤 5: 更新 PlanSpec 状态

更新归档变更的 PlanSpec：

```bash
# 更新 status 为 archived
sed -i '' 's/status: completed/status: archived/' "$PROJECT_ROOT/.bytecoding/changes/archive/$CHANGE_ID/planspec.yaml"

# 添加归档时间
echo "archived_at: $(date -u +"%Y-%m-%dT%H:%M:%SZ")" >> "$PROJECT_ROOT/.bytecoding/changes/archive/$CHANGE_ID/planspec.yaml"

echo "✅ PlanSpec 已更新"
```

## 步骤 6: 显示归档摘要

显示归档变更的摘要信息：

```bash
echo ""
echo "=========================================="
echo "变更归档摘要"
echo "=========================================="
echo "变更 ID: $CHANGE_ID"
echo "归档时间: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "归档位置: .bytecoding/changes/archive/$CHANGE_ID"
echo ""
echo "文件列表:"
ls -1 "$PROJECT_ROOT/.bytecoding/changes/archive/$CHANGE_ID/"
echo "=========================================="
```

## 步骤 7: 发送飞书摘要（使用 lark-send-msg）

在命令结束后，使用 **lark-send-msg** 技能**生成消息内容并执行发送**（通过 Skill 工具调用 + `lark-cli send-message`）。

**接收人**：使用 SessionStart Hook 展示的 Git 用户邮箱（`user.email`）。  
**如果未配置邮箱**：提示用户补充邮箱后再发送。

**如摘要包含 Markdown 文档**（例如引用归档后的 `proposal.md`/`design.md`/`tasks.md`），先用 **lark-md-to-doc** 转换并拿到文档链接，再发送摘要。

**转换方式**：
1. 通过 `Skill(lark-md-to-doc)` 确认调用方式。
2. 使用脚本渲染（示例）：
```bash
python3 /Users/bytedance/.codex/skills/lark-md-to-doc/scripts/render_lark_doc.py \
  --md "$PROJECT_ROOT/.bytecoding/changes/archive/$CHANGE_ID/proposal.md" \
  --title "[repo-archive] $CHANGE_ID proposal"
```

**摘要内容建议**：
- 变更 ID
- 归档时间
- 归档位置
- 是否清理 Worktree/分支
- 文档链接（如有）

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
- [x] Worktree 已清理（如果用户选择）
- [x] 归档摘要已显示
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
