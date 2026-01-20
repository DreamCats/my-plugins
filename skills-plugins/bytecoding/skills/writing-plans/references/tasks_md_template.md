# tasks.md 完整结构模板

```markdown
# 任务列表：[变更名称]

**变更 ID**：[change-id]
**创建时间**：[YYYY-MM-DD]
**状态**：pending

---

## 概览

**总任务数**：X
**预计总时间**：X-Y 分钟

**任务分组**：
- 阶段 1: 数据模型 (X 个任务)
- 阶段 2: 服务层 (X 个任务)
- 阶段 3: API 层 (X 个任务)
- 阶段 4: 验证 (X 个任务)

---

## 阶段 1: [阶段名称]

### [任务组名称]

#### 1.1 [任务名称]

**描述**：[任务描述]

**文件**：[仓库相对路径]

**参考**：
- 设计文档：`design.md` - 数据模型定义

**输入**：设计文档中的数据模型定义
**输出**：完整的 TypeORM 模型类

**代码框架**：
```typescript
@Entity('email_verification_tokens')
export class EmailVerificationToken {
  @PrimaryColumn('uuid')
  id: string;

  @Column('varchar')
  email: string;

  @Column('varchar')
  tokenHash: string;

  @Column('timestamp')
  expiresAt: Date;

  @Column('timestamp', { default: () => 'NOW()' })
  createdAt: Date;
}
```

**验证**：

- [ ] 模型类编译通过
- [ ] 字段类型正确
- [ ] 包含必要的装饰器

**预计时间**：3 分钟

---

## 依赖关系图

```
1.1 (创建模型)
  ↓
1.2 (创建迁移)
  ↓
2.1 (生成令牌) ← 1.1, 1.2
  ↓
2.2 (验证令牌) ← 2.1
  ↓
3.1 (API 端点) ← 2.2
```

---

## 完成标准

- [ ] 所有任务完成
- [ ] 验证通过（编译/构建或手动验证）
- [ ] 代码审查通过
- [ ] 设计文档一致性确认

---

## 备注

[任何额外说明、注意事项、依赖关系]
```

**重要**：
- 任务粒度必须控制在 2-5 分钟
- 必须明确标注依赖关系
