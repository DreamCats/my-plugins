---
name: live_rd
description: 用于 Go 项目的 AI Review 与 AI Commit Message 规范化。用户提到“代码评审/AI Review/提交信息/commit message/提交代码/live_rd”时触发。
---

# live_rd（Go 项目 AI Review + AI Commit）

## 目标

- 前置解决代码风格与明显缺陷，形成可追溯的 Review 结果。
- 100% 接入 AI Commit Message（不带 emoji，带固定顺序 footer）。

## 推荐使用方式

1. 主动命令：
   - `/live_rd:review`：运行 Go 代码检查并输出 Review 结论。
   - `/live_rd:commit`：基于暂存区生成规范提交信息并提交。
   - `/live_rd:status`：检查当前暂存区与 Review 兜底状态。
   - `/live_rd:publish`：发布最新 Review 报告到飞书并通知提交人（Task 任务）。
2. Hook 兜底：
   - `UserPromptSubmit`：上下文过大时提示使用 `/compact`（默认软拦截 400000 字节，硬拦截 600000 字节，可配置阈值）。
   - `SessionStart`：会话启动时提示 live_rd 已就绪与可用指令。
2. 被动触发：当用户提出“评审/提交信息/commit message/提交代码”时，按本规范执行。
3. hooks 兜底：插件 hooks 会在 `git commit` 时做格式校验与 Review 兜底提示。

## AI Review 流程（Go）

- 对暂存区 Go 文件执行：`gofmt`，若有 `goimports` 则一并执行。
- 运行：`go vet`、`golangci-lint run`（若已安装）。
- 默认按模块定位 `go.mod`，并基于变更包目录执行（`--target-mode package`），使用增量 lint（相对 `HEAD`）。
- 如需全量模块扫描：设置 `LIVE_RD_REVIEW_TARGET_MODE=module` 或使用 `--module-mode repo --lint-mode full`。
- 产出 Review 结论：风险点、明显缺陷、可改进建议、必要时给出补丁建议。
- 执行成功后写入 Review 标记（供 hooks 校验）。
- 自动生成报告（默认保留最近 10 份，可用 `LIVE_RD_REPORT_KEEP` 调整），路径：`.claude/live_rd/reports/review_<branch>_<timestamp>.{md,json}`。
- Review 完成后需把 AI 结论写回报告（见 `/live_rd:review` 命令模板）。

## Review 模板（专项）

输出 Review 时请至少覆盖以下专项：

- 并发专项：goroutine 泄漏、锁/通道误用、竞态风险
- 事务专项：事务边界、回滚/提交、幂等性
- 错误处理专项：错误吞没、上下文超时、返回值一致性
  详细模板见 `assets/review_templates.md`。

## Commit Message 规范（必须）

**格式**：`<type>(<scope>): <subject>` + 列表正文

- `type`（必填）：`feat`、`fix`、`docs`、`refactor`、`test`、`chore`、`perf`、`style`、`build`、`ci`
- `scope`（必填）：kebab-case，小写，2-20 个字符（示例：`auth`、`http-client`）
- `subject`（必填）：中文动词短语，50 字以内，不要句号或表情
- 正文（必填）：3-8 条列表项，每行以 `- ` 开头

**Footer（必填，且顺序固定）**：

1. `Generated-By: live_rd`
2. `Co-Authored-By: <name> <email>`

## 生成提交信息的步骤

1. 获取暂存区差异：`git diff --cached`。
2. 根据差异内容选择 `type` 和 `scope`，用中文生成 `subject`。
3. 输出完整提交信息，并执行 `git commit`。

## 失败处理

- 若 go 工具缺失（如 `golangci-lint`/`goimports`），提示安装方式并继续执行其余步骤。
- 若 Review 未通过或未执行，提示先运行 `/live_rd:review`。
- 若提交信息不符合规范，要求修正后再提交。
