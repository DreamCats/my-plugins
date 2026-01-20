# 输出格式示例

## 技能完成时的输出应包括

1. **工作流程检查清单**（所有项目已勾选）
2. **设计文档分析摘要**
3. **任务拆分摘要**
4. **生成的文档路径**：`tasks.md`

## 示例输出

```markdown
## Writing Plans 技能完成

### 工作流程

✓ 所有 4 个步骤已完成

### 设计文档分析

- 架构：服务层 + 数据层 + API 层
- 数据模型：EmailVerificationToken
- API 端点：POST /api/auth/verify-email

### 任务拆分

- 总任务数：18
- 预计时间：45-60 分钟
- 任务分组：数据模型(4) + 服务层(6) + API 层(4) + 验证(4)

### 生成的文档

- tasks.md: .bytecoding/changes/change-email-verification/tasks.md

下一步：若任务可并行，先使用 dispatching-parallel-agents；否则使用 subagent-driven-development 执行任务
```
