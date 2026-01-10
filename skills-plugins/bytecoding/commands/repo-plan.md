---
description: 从需求生成可执行计划（包含 PlanSpec 和任务）
allowed-tools: Bash(node:*)
---

# /repo-plan

从自然语言需求生成可执行计划，产出 PlanSpec、tasks.md 和变更预览。

执行计划生成脚本：

```bash
node ${CLAUDE_PLUGIN_ROOT}/scripts/repo-plan.js $ARGUMENTS
```

## 用法

```
/repo-plan <需求描述> [选项]
```

## 参数

- `<需求描述>` - 用自然语言描述需要完成的任务

## 选项

- `--output <目录>` - 覆盖默认输出目录
- `--prefer-local` - 强制优先本地分析（默认：启用）
- `--no-repotalk` - 禁用 repotalk MCP 查询
- `--interactive` - 允许通过 AskUserQuestion 进行澄清
- `--verify-mode <off|smart|full>` - 验证策略（默认：smart）
- `--format <md|json|both>` - 输出格式（默认：both）

## 功能说明

1. **输入解析** - 解析自然语言需求
2. **任务分解** - 生成初始任务结构
3. **本地分析** - 扫描仓库中的相关文件和符号
4. **Repotalk 查询**（可选）- 从 MCP 获取候选位置
5. **证据链构建** - 合并本地和远程证据链
6. **计划生成** - 创建 PlanSpec.json 和 tasks.md
7. **变更预览** - 生成变更预览

## 输出文件

生成在 `~/.bytecoding/plans/<plan_id>/`：
- `PlanSpec.json` - 机器可读的计划规范
- `tasks.md` - 人工可编辑的任务清单
- `delta.md` - 变更预览和影响摘要
- `history.json` - 计划元数据和血缘
- `summary.json` - 快速概览

## 交互模式

当启用 `--interactive` 时，系统可能会提出 1-3 个澄清问题，如果：
- 目标模块不明确
- 关键接口未知
- 验证方法缺失
- 变更范围过大

## 示例

```
/repo-plan "添加基于 JWT 的用户认证" --interactive
```

这将分析你的代码库，在需要时提出澄清问题，并生成完整的实施计划。
