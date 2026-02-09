---
name: do
description: "当用户有明确的代码改动需求时触发 - 包括「帮我实现xxx」「添加一个xxx功能」「修改这个xxx」「修复 bug」「加个方法」「新增接口」「改一下」「优化这段代码」「重构」等。执行样例驱动的代码改动流程。"
---

# /do 技能

**样例驱动**：每个仓库模式不同，务必先找样例学习模式，再写代码。

## 核心流程

```
用户描述改动需求
      │
      ├─ Step 0: 检测飞书链接（如果是）
      │    └─ 转换为 Markdown → 继续处理
      │
      ├─ Step 1: 找样例 + 理解需求
      │    └─ 判断类型 → 找相似实现 → 提取模式
      │
      ├─ Step 2: 确认方案
      │    └─ 输出方案 → 用户确认
      │
      ├─ Step 3: 执行改动 + 编译验证
      │    └─ 按方案执行 → 只编译改动的小包
      │
      └─► 提示 review + commit
```

**渐进式确认**：方案确认后用户确认再执行，方向错了可以提前纠正。

## Step 0: 检测飞书链接

检查 `$ARGUMENTS` 是否为飞书/Lark 文档链接：

**链接特征**：
- 包含 `feishu.cn` 或 `larksuite.com`
- 路径包含 `/docx/`、`/docs/`、`/wiki/` 等

**如果是飞书链接**：

```bash
node "$CLAUDE_PLUGIN_ROOT/scripts/livecoding/lark-import.js" \
  --url "$ARGUMENTS" \
  --project-root "$(git rev-parse --show-toplevel)"
```

继续 Step 1，基于导入的文档内容理解需求。

## Step 1: 找样例 + 理解需求

**参考**：[搜索样例](references/search-sample.md)、[提取模式](references/pattern-extract.md)

判断任务类型 → 找 1-2 个相似样例 → 提取项目模式。

## Step 2: 确认方案

**必须输出方案确认**：

```
📐 实现方案确认

参考样例：[样例文件路径]

我将按以下模式实现：

1. 文件位置：xxx/yyy.go
2. 函数签名：xxx
3. 调用链路：handler → service → repository
4. 错误处理：errno.ErrXxx + errors.Wrap
5. 日志模式：log.WithContext(ctx).Info(...)
6. 参数校验：handler 层用 validate 库

预计改动文件：
- [ ] handler/xxx.go
- [ ] service/xxx.go
- [ ] repository/xxx.go

确认？我开始写代码。
```

用户确认后再执行。

## Step 3: 执行改动 + 编译验证

**参考**：[编译验证](references/verification.md)

- 严格按照确认的方案执行
- **不要「创新」，照着样例写**
- 每个文件改完后简要说明
- 只编译改动的包，禁止 `go build ./...`

## 完成

提示用户：

```
改动已完成！

请 review 代码变更：
  git diff

可选：/livecoding:gcmsg 提交代码
```

## 与其他技能的关系

```
不确定怎么做？
  └─► /livecoding:brainstorming 探索交流 → /do

需求明确？
  └─► /do（本技能）
```
