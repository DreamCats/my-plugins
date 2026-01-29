---
description: 直接执行明确的改动
argument-hint: [改动描述 或 飞书文档链接]
allowed-tools: Bash(bash*), Bash(node*), Bash(go*), Bash(git*), Bash(pwd*), Bash(lark-cli*), Read, Write, Edit, Glob, Grep, Task
---

# /do 命令

需求足够明确时，跳过规划阶段，直接执行改动。

## 适用场景

- 用户已明确描述具体改动点
- 不需要搜索分析，直接实现
- 小范围修改、bug 修复、简单功能
- **飞书文档导入**：输入飞书链接，自动转换为 Markdown

## 工作流程

```
/do "改动描述"
  │
  ├─ Step 0: 检测飞书链接（如果是）
  │    └─ 转换为 Markdown → 继续处理
  ├─ Step 1: 理解改动需求
  ├─ Step 2: 样例学习（核心）
  │    └─ 找相似实现 → 提取模式 → 确认理解
  ├─ Step 3: 执行改动
  │    └─ 基于样例模式生成代码
  ├─ Step 4: 编译验证
  │
  └─► 提示用户 review + commit
```

## Step 0: 检测飞书链接

检查 `$ARGUMENTS` 是否为飞书/Lark 文档链接：

**链接特征**：

- 包含 `feishu.cn` 或 `larksuite.com`
- 路径包含 `/docx/`、`/docs/`、`/wiki/` 等

**如果是飞书链接**：

1. 调用转换脚本：

```bash
node "$CLAUDE_PLUGIN_ROOT/scripts/bytecoding/lark-import.js" \
  --url "$ARGUMENTS" \
  --project-root "$(git rev-parse --show-toplevel)"
```

2. 脚本会：
   - 提取文档 ID
   - 获取文档内容
   - 下载图片到 `assets/` 目录
   - 生成 Markdown 文件到 `.bytecoding/imports/YYYY-MM-DD-<标题>.md`

3. 输出导入结果：

```
飞书文档已导入！

文档：<标题>
路径：.bytecoding/imports/YYYY-MM-DD-xxx.md

文档内容摘要：
<前几行内容>

下一步：
- 阅读文档内容，理解需求
- 基于文档执行改动
```

4. 继续 Step 1，基于导入的文档内容理解需求

**如果不是飞书链接**：直接进入 Step 1。

## Step 1: 理解改动需求

直接基于用户描述 `$ARGUMENTS` 理解需求，无需生成 tasks.md。

如有不明确的地方，使用 AskUserQuestion 快速澄清（最多 1 轮）。

## Step 2: 样例学习（核心）

**目标**：找到项目中的相似实现，学习其模式，确保生成的代码符合项目规范。

### 2.1 判断任务类型

根据用户需求判断类型：

- RPC/API 接口
- CRUD 操作
- 工具函数
- 配置修改
- Bug 修复
- 其他

### 2.2 搜索相似样例

**搜索策略（按优先级）**：

1. **同目录/同模块优先**
   - 如果需求涉及 `handler/user.go`，先看 `handler/` 下的其他文件

2. **相似类型优先**
   - 新增 `GetXxx` 接口 → 找现有的 `GetXxx` 实现
   - 新增 `CreateXxx` 接口 → 找现有的 `CreateXxx` 实现

3. **最新代码优先**

   ```bash
   # 找最近 3 个月修改过的相关文件
   git log --since="3 months ago" --name-only --pretty=format: -- "*.go" | sort | uniq -c | sort -rn
   ```

4. **兜底：全局搜索**
   - 使用 MCP 工具搜索关键词

**搜索数量**：找 1-2 个最相关的样例即可，不要贪多。

### 2.3 提取模式

分析样例代码，提取：

- **目录结构**：文件放在哪里
- **分层调用**：handler → service → repo？
- **错误处理**：用什么错误码，怎么包装错误
- **日志模式**：怎么打日志，带什么字段
- **命名风格**：函数名、变量名的命名习惯
- **参数校验**：用什么库，怎么校验

### 2.4 确认理解

**必须输出理解确认**：

```
我参考了 [样例文件路径]，总结出以下模式：

1. 目录结构：新接口放在 handler/xxx.go
2. 分层调用：handler → service → repository
3. 错误处理：使用 errno.ErrXxx，用 errors.Wrap 包装
4. 日志：使用 log.WithContext(ctx).Info()
5. 参数校验：在 handler 层用 validate 库

我会按这个模式实现，对吗？
```

用户确认后再进入 Step 3。

## Step 3: 执行改动

**基于样例模式**生成代码：

- 严格遵循 Step 2 提取的模式
- 不要「创新」，照着样例写
- 完成后自审：
  1. **模式一致性**：是否和样例的模式一致
  2. **规范符合性**：是否按需求实现
  3. **代码质量**：格式、命名、错误处理

## Step 4: 编译验证

执行最小范围编译：

```bash
# 只编译改动的包
go build ./path/to/changed/package/...
```

**禁止**：`go build ./...` 全量编译

如果编译失败，尝试修复后重新验证。

## 完成标志

- [x] 改动已完成
- [x] 编译验证通过

## 下一步

提示用户：

```
改动已完成！

请 review 代码变更：
  git diff

可选：优化代码质量
  bytecoding:code-reviewer

确认无误后提交：
  /bytecoding:gcmsg
```

## 与其他命令的关系

```
不确定怎么做？
  └─► /bytecoding:design 探索交流 → /bytecoding:do

需求明确？
  └─► /bytecoding:do（本命令）
```
