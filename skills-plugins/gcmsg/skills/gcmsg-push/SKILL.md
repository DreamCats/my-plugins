---
name: gcmsg-push
description: This skill should be used when the user asks to "gcmsg-push", "推送代码", "自动推送", "push code", or wants to push commits to remote repository.
---

此技能帮助您自动推送本地提交到远程仓库。

## 执行流程:

1. 运行 `git status --porcelain` 检查工作区状态。
2. 若存在未提交的改动（已暂存或未暂存），执行以下自动提交流程：
   - 若暂存区为空，自动执行 `git add -A` 将所有新增与修改加入暂存区。
   - 运行 `git diff --cached` 获取本次提交差异。
   - 解析差异，统计文件路径、变更行数、关键字（新增函数、修复 BUG、文档段落等）。
   - 若用户未提供前缀，则按以下规则生成提交信息：
     - 若仅修改文档 → `docs: 更新文档`
     - 若仅修改测试 → `test: 补充测试`
     - 若含 `fix` / `bug` / `修复` 关键字 → `fix: 修复问题`
     - 若含 `feat` / `feature` / `新增` 关键字 → `feat: 新增功能`
     - 若仅格式化或注释调整 → `style: 调整格式`
     - 若重构无行为变更 → `refactor: 重构代码`
     - 若性能优化 → `perf: 性能优化`
     - 其他 → `chore: 代码维护`
   - 若检测到一次提交包含多种类型变更，提示用户拆分为多次提交；用户确认后循环执行拆分流程。
   - 通过 `git config user.email` 和 `git config user.name` 获取当前用户信息，在 commit 信息中添加：
     - `Generated with: [<git user.name>](<git user.email>)`
     - `Co-Authored-By: <git user.name> <<git user.email>>`
   - 最终执行 `git commit -m "<生成信息>"` 完成提交。
3. 检查远程仓库配置：
   - 运行 `git remote -v` 查看是否配置了远程仓库。
   - 若未配置远程仓库，提示用户先添加远程仓库（如 `git remote add origin <url>`）。
4. 获取当前分支名称：
   - 运行 `git rev-parse --abbrev-ref HEAD` 获取当前分支。
5. 检查本地与远程的差异：
   - 运行 `git log @{u}..HEAD` 查看待推送的提交。
   - 若无待推送的提交，提示用户当前已是最新，无需推送。
6. 确认推送信息：
   - 显示待推送的提交数量及简要信息。
   - 执行 `git push` 推送到远程仓库的当前分支。
7. 输出推送结果：
   - 成功：显示推送的提交数和分支信息。
   - 失败：显示错误信息并给出解决建议（如权限问题、冲突处理等）。

## 示例:

- 推送当前分支的提交到远程仓库
  `/gcmsg-push`
  结果：`git push` 推送当前分支到远程

- 推送并设置上游分支
  `/gcmsg-push -u`
  结果：`git push -u origin <current-branch>` 设置上游并推送

- 推送到指定远程和分支
  `/gcmsg-push origin main`
  结果：`git push origin main`

## 注意事项:

- 推送前会自动检查并提交未提交的改动，避免遗漏。
- 提交前请确保代码已编译、测试通过，避免将错误代码带入历史。
- 自动推断仅覆盖常见场景，复杂业务建议手动给出前缀。
- 若仓库为首次提交且缺少 `.gitignore`，命令会提示先创建忽略文件再提交。
- 生成信息遵循"中文陈述句、句尾无句号、首字母小写"风格，保持统一。
- 若检测到敏感文件（私钥、大文件等）被暂存，将中断提交并给出警告。
- 禁止使用"Generated with [Claude Code](https://claude.com/claude-code)"，以及 commit 的信息中禁止出现"🤖"这个图标。
- 若远程有新提交而本地未拉取，推送将被拒绝，需先 `git pull` 合并远程改动。
- 推送受保护分支可能需要权限或 Pull Request，请根据项目规则操作。
- 推送大量提交前建议先 `git fetch` 了解远程状态，避免冲突。
- 若使用 SSH 密钥认证，请确保密钥已添加到 ssh-agent。
- 若使用 HTTPS 认证，可能需要输入凭据或配置 Personal Access Token。
- 推送成功后显示简短确认信息，不包含多余装饰性内容。
