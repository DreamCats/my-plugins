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
  ├─ Step 2: 快速定位相关代码（MCP/LSP/本地搜索）
  ├─ Step 3: 执行改动
  │    └─ 子代理内部自审（规范+质量）
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

## Step 2: 快速定位代码

**搜索优先级**（快速定位，不深度探索）：

1. **bcindex MCP** - 语义搜索，自然语言定位
2. **byte-lsp MCP** - 符号定位，查找定义/引用
3. **Glob/Grep/Read** - 兜底

### RPC 依赖查询（重要）

当需要查看 RPC 入参/出参定义时，**必须优先使用 byte-lsp MCP**：

**byte-lsp MCP 工具**：
- `go_to_definition` - 跳转到定义（支持外部依赖）
- `get_hover` - 获取类型签名和注释
- `find_references` - 查找所有引用

**使用示例**：
```
场景：调用下游 RPC，需要了解 Request/Response 结构

方式 A（推荐）- 按符号名查询：
  go_to_definition:
    file_path: "handler/user.go"
    symbol: "GetUserInfoRequest"
    use_disk: true

快速查看类型信息：
  get_hover:
    file_path: "handler/user.go"
    symbol: "GetUserInfoRequest"
    use_disk: true
```

**错误做法（低效）**：
- ❌ 在 $GOPATH/pkg/mod 下 Grep 搜索
- ❌ 猜测 proto 文件路径

**原因**：RPC 依赖通常在外部仓库（`$GOPATH/pkg/mod/...`），路径包含版本号，Grep 搜索效率极低。LSP 直接解析 import 并跳转。

**注意**：`/do` 聚焦快速执行，搜索只为定位，不做深度分析。

## Step 3: 执行改动

在当前分支直接修改代码：

- 遵循现有代码风格
- 完成后进行自审：
  1. **规范符合性**：是否按需求实现
  2. **代码质量**：格式、命名、错误处理

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
  /bytecoding:code-simplifier

确认无误后提交：
  /bytecoding:gcmsg
```

## 与其他命令的关系

```
不确定怎么做？
  └─► /bytecoding:design 探索交流

需求明确，需要搜索分析？
  └─► /bytecoding:plan → /bytecoding:apply

需求明确，直接干？
  └─► /bytecoding:do（本命令）
```
