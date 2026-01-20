# 本地搜索策略模板

## 工具选择优先级

| 用户需求示例 | 使用工具 | 原因 |
|------------|---------|------|
| "FindAllReferences 在哪里被调用？" | serena/LSP | 精确引用链 |
| "IUserHandler 接口有哪些实现？" | serena/LSP | 符号/实现关系 |
| "所有叫 `HandleUpdate` 的函数" | serena/LSP | 符号搜索，更快更准 |
| "查找处理用户认证的代码" | bcindex | 自然语言语义检索 |
| "这个项目有哪些 HTTP handler？" | bcindex | 按职责定位模块 |
| "xxx.go 文件里的具体实现" | Read | 已知具体路径 |
| "所有包含 'update' 关键词的代码" | Grep | 泛化关键词搜索 |

**优先级**：serena/LSP（符号/引用链清晰） > bcindex（语义定位） > Glob/Grep/Read（兜底）

## 搜索策略

**先收敛范围**（优先使用候选路径/模块名）：

```bash
# 在候选目录内列出 handler 文件
Glob: "path/to/candidate/dir/**/*handler*.go"
```

**再做定向搜索**（只在候选范围内）：

```bash
# 在候选范围内搜索方法或路由
Grep: "Update.*Promotion" path/to/candidate/dir
Grep: "Register.*Handler" path/to/candidate/dir
```

## 范围约束

- 用户需求限定在 handler 时，优先在 `handler/` 或 `handlers/` 目录内搜索
- 未经用户确认，不要扩展到 service/biz 层
- 禁止全仓库泛化关键词搜索
