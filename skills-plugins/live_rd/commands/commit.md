---
description: 生成并提交符合 live_rd 规范的提交信息
allowed-tools:
  - Bash(git status:*)
  - Bash(git diff:*)
  - Bash(git add:*)
  - Bash(git config:*)
  - Bash(git commit:*)
---

## Context
- 暂存区状态: !`git status --porcelain`
- 暂存区差异: !`git diff --cached`
- Git 用户名: !`git config user.name`
- Git 邮箱: !`git config user.email`

## Your task
1. 若暂存区为空，提示用户先 `git add`。
2. 基于暂存区差异生成提交信息，格式必须是：`type(scope): subject` + 列表正文。
   - `type` 必须是：feat/fix/docs/refactor/test/chore/perf/style/build/ci
   - `scope` 必须是小写 kebab-case（2-20 字符）
   - `subject` 必须中文，50 字以内，不要句号或表情
   - 正文必须是 3-8 条列表项，每行以 `- ` 开头
3. Footer 必须包含且顺序固定：
   - `Generated-By: live_rd`
   - `Co-Authored-By: <name> <email>`（用上面的 Git 用户名/邮箱）
4. 执行提交命令（使用 `git commit -m` 组合，确保 footer 生效）。

示例命令（仅供参考，需替换实际内容）：
```
git commit -m "feat(auth): 增加登录校验" \\
  -m "- 新增登录校验逻辑" \\
  -m "- 补充校验失败日志" \\
  -m "- 更新相关配置默认值" \\
  -m "Generated-By: live_rd" \\
  -m "Co-Authored-By: 张三 <zhangsan@bytedance.com>"
```
