---
description: 运行 Go Review 并输出 AI 评审结论
allowed-tools:
  - Bash(git status:*)
  - Bash(git diff:*)
  - Bash(git branch:*)
  - Bash(python3:*)
  - Bash(go:*)
  - Bash(gofmt:*)
  - Bash(goimports:*)
  - Bash(golangci-lint:*)
---

## Context
- 当前分支: !`git branch --show-current`
- 暂存区状态: !`git status --porcelain`
- 暂存区差异: !`git diff --cached`
- Review 运行结果: !`python3 "${CLAUDE_PLUGIN_ROOT}/skills/live_rd/scripts/live_rd_review.py" --scope staged --module-mode module --lint-mode incremental`
- 最新报告路径: !`python3 -c "import os, glob; d='.claude/live_rd/reports'; files=glob.glob(os.path.join(d,'review_*.md')); print(max(files, key=os.path.getmtime) if files else 'no report')"`
- 提交人邮箱: !`git config user.email`

## Your task
1. 如果 Review 命令失败，说明失败原因与修复建议。
2. 输出 AI Review 总结，按以下模板组织：
   - 明显缺陷：列出会导致错误或不正确行为的问题
   - 风险点：可能导致线上风险的问题
   - 建议修改：低风险但建议优化的点
   - 并发专项：goroutine 泄漏、锁/通道误用、竞态风险
   - 事务专项：事务边界、回滚/提交、幂等性
   - 错误处理专项：错误吞没、上下文超时、返回值一致性
3. 简要说明是否可以提交（基于 Review 结果）。
4. 将 AI Review 写回最新报告，使用下面的 JSON 模板（内容需替换）：
```
python3 "${CLAUDE_PLUGIN_ROOT}/skills/live_rd/scripts/live_rd_update_report.py" <<'EOF'
{
  "summary": "总体结论",
  "defects": ["缺陷1", "缺陷2"],
  "risks": ["风险1"],
  "suggestions": ["建议1"],
  "concurrency": ["并发专项发现"],
  "transaction": ["事务专项发现"],
  "error_handling": ["错误处理专项发现"]
}
EOF
```
5. 运行 `/live_rd:publish`，启动 Task 任务把报告发布到飞书并通知提交人。
6. 提示报告位置：`.claude/live_rd/reports/review_<branch>_<timestamp>.{md,json}`。
