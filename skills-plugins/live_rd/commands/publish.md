---
description: 将最新 Review 报告发布到飞书并通知提交人
allowed-tools:
  - Bash(git config:*)
  - Bash(python3:*)
---

## Context
- 提交人邮箱: !`git config user.email`
- 最新报告路径: !`python3 -c "import os, glob; d='.claude/live_rd/reports'; files=glob.glob(os.path.join(d,'review_*.md')); print(max(files, key=os.path.getmtime) if files else 'no report')"`

## Your task
使用 Task 工具执行以下步骤（不要在主线程直接执行）：
1. 使用 `lark-md-to-doc` 技能，把最新报告渲染成飞书文档。
   - 使用绝对路径：`python3 /Users/bytedance/.codex/skills/lark-md-to-doc/scripts/render_lark_doc.py --md <REPORT_MD> --title "live_rd Review" [--folder-token <token>]`
   - 捕获输出中的 `doc_id` 与 `url`。
2. 使用 `lark-add-permission` 技能，给提交人邮箱开通编辑权限。
   - `doc-type` 使用 `docx`，`member-type` 使用 `email`，`perm` 使用 `edit`。
3. 使用 `lark-send-msg` 技能，把飞书文档链接发给提交人（receive-id-type 使用 `email`）。
   - 优先使用 `url`，若无 url 则发送 `doc_id` 作为提示。
