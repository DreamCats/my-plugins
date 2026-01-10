---
description: 归档已完成的计划及所有产物用于审计
allowed-tools: Bash(node:*)
---

# /repo-archive

归档已完成的计划及所有产物，用于审计和参考。

执行归档脚本：

```bash
node ${CLAUDE_PLUGIN_ROOT}/scripts/repo-archive.js $ARGUMENTS
```

## 用法

```
/repo-archive [plan_id] [选项]
```

## 参数

- `[plan_id]` - 要归档的计划 ID（默认为最新）

## 选项

- `--plan <id>` - 显式指定计划 ID
- `--dest <目录>` - 归档目标位置（默认：`~/.bytecoding/archive/`）
- `--include-logs` - 在归档中包含执行日志

## 功能说明

1. **收集产物** - 收集所有计划相关文件
   - PlanSpec.json
   - tasks.md
   - delta.md
   - apply_report.json
   - verify_report.json
   - history.json

2. **生成归档报告** - 创建包含以下内容的摘要：
   - 计划元数据
   - 执行结果
   - 文件校验和
   - 时间戳信息

3. **移动到归档** - 重新定位到归档目录
   - 按日期和计划 ID 组织
   - 保留所有原始文件
   - 更新索引以便搜索

## 输出

- `archive_report.json` - 归档元数据和摘要
- 终端摘要显示归档位置

## 归档结构

```
~/.bytecoding/archive/
  <plan_id>/
    PlanSpec.json
    tasks.md
    delta.md
    apply_report.json
    verify_report.json
    history.json
    archive_report.json
```

## 示例

```
/repo-archive PLAN-20250109-abc123 --include-logs
```

这将归档指定的计划及所有产物和执行日志。
