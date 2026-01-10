---
description: 基于 PlanSpec 执行代码变更并验证
allowed-tools: Bash(node:*)
---

# /repo-apply

基于 PlanSpec 执行代码变更，支持验证和回滚。

执行应用脚本：

```bash
node ${CLAUDE_PLUGIN_ROOT}/scripts/repo-apply.js $ARGUMENTS
```

## 用法

```
/repo-apply [plan_id] [选项]
```

## 参数

- `[plan_id]` - 要应用的计划 ID（默认为最新）

## 选项

- `--plan <id>` - 显式指定计划 ID
- `--dry-run` - 显示将要变更的内容但不实际应用
- `--no-verify` - 跳过变更后的验证
- `--verify-mode <smart|full>` - 覆盖验证策略
- `--confirm` - 跳过交互式确认

## 功能说明

1. **计划验证** - 验证 plan_hash 和一致性
2. **预检查** - 确保仓库处于干净状态
3. **变更执行** - 逐任务应用修改
4. **验证** - 按指定运行测试、lint 或构建
5. **回滚支持** - 在需要时提供撤销指令

## 安全特性

- 在进行变更前需要确认（除非使用 `--confirm`）
- 在修改前创建备份快照
- 使用 plan_hash 验证 PlanSpec 完整性
- 检查 tasks.md 一致性
- 失败时提供回滚指令

## 输出

- `apply_report.json` - 执行摘要
- `verify_report.json` - 验证结果
- 更新的 `delta.md` - 实际进行的变更
- 更新的 `tasks.md` - 已完成任务标记

## 试运行模式

使用 `--dry-run` 预览变更而不实际应用：

```
/repo-apply --dry-run
```

这将显示：
- 将要修改的文件
- 将要进行的变更
- 将要运行的验证步骤

## 示例

```
/repo-apply PLAN-20250109-abc123
```

这将应用指定的计划，运行验证，并提供变更摘要。
