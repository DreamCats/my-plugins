---
description: 查看 live_rd Review 与提交兜底状态
allowed-tools:
  - Bash(git status:*)
  - Bash(git diff:*)
  - Bash(python3:*)
---

## Context
- 暂存区状态: !`git status --porcelain`
- 暂存区差异: !`git diff --cached`
- Review 标记: !`python3 -c "import json, os; p='.claude/live_rd_review.json'; print(open(p).read() if os.path.exists(p) else 'no review stamp')"`
- 最近报告: !`python3 -c "import os, glob; d='.claude/live_rd/reports'; files=glob.glob(os.path.join(d,'review_*.*')); files=[f for f in files if f.endswith('.md')]; print(max(files, key=os.path.getmtime) if files else 'no report')"`
- 当前暂存区 hash: !`python3 -c "import hashlib, subprocess; data=subprocess.check_output(['git','diff','--cached']); print(hashlib.sha256(data).hexdigest())"`

## Your task
1. 判断 Review 标记是否存在且与当前暂存区一致。
2. 给出下一步建议：需要先 `/live_rd:review` 还是可以 `/live_rd:commit`。
