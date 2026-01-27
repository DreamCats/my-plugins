---
description: 需求分析与任务生成
argument-hint: [变更描述 或 飞书文档链接]
allowed-tools: Bash(bash*), Bash(node*), Bash(mkdir*), Bash(git*), Bash(pwd*), Bash(lark-cli*), Read, Write, Edit, Glob, Grep
---

# /plan 命令

将明确的需求描述转化为可执行的任务列表。

## 工作流程

```
/plan "需求描述"
  │
  ├─ Step 0: 检测飞书链接（如果是）
  │    └─ 转换为 Markdown → 继续处理
  ├─ Step 1: 初始化 planspec.yaml
  ├─ Step 2: 多源搜索分析
  │    ├─ Repotalk 跨仓库搜索（可选）
  │    ├─ bcindex 语义搜索
  │    ├─ LSP 符号定位
  │    └─ Glob/Grep 兜底
  ├─ Step 3: 生成 tasks.md
  ├─ Step 4: 飞书通知
  │
  └─► 提示用户：是否执行 /bytecoding:apply？
```

## Step 0: 检测飞书链接

检查 `$ARGUMENTS` 是否为飞书/Lark 文档链接：

**链接特征**：
- 包含 `feishu.cn`、`larksuite.com`、`larkoffice.com` 等
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
```

4. 读取导入的 Markdown 文件，提取需求描述，继续 Step 1

**如果不是飞书链接**：直接进入 Step 1。

## Step 1: 初始化

运行脚本创建 planspec.yaml：

```bash
PROJECT_ROOT=$(git rev-parse --show-toplevel)
PLUGIN_ROOT="${CLAUDE_PLUGIN_ROOT}"
SCRIPT_DIR="$PLUGIN_ROOT/scripts/bytecoding"
if [ -f "$PLUGIN_ROOT/plan.js" ]; then
  SCRIPT_DIR="$PLUGIN_ROOT"
fi
node "$SCRIPT_DIR/plan.js" --desc "$ARGUMENTS"
```

记录输出的 `change-id` 和 `change-dir`，后续步骤使用。

## Step 2: 多源搜索分析

**目标**：快速定位需求涉及的代码范围，收集实现参考。

**搜索优先级（按顺序尝试，聚焦快速定位）**：

1. **Repotalk MCP** - 跨仓库搜索
   - 适用：需要参考其他项目的实现方式
   - 需求简单明确时可跳过
   - 示例：搜索字节内部类似功能的最佳实践

2. **bcindex MCP** - 语义搜索
   - 适用：自然语言定位代码，术语不确定时
   - 示例："处理用户认证的代码"、"数据库连接池配置"

3. **byte-lsp MCP** - 符号定位
   - 适用：符号名明确，查找定义、引用、实现
   - 工具：`go_to_definition`、`find_references`、`search_symbols`
   - 示例：查找 `IUserHandler` 接口的实现类

4. **Glob/Grep/Read** - 兜底
   - 适用：MCP 不可用或需要精确文本匹配

### RPC 依赖查询（重要）

当需要查看 RPC 入参/出参定义时，**必须优先使用 byte-lsp MCP**：

**byte-lsp MCP 工具**：
- `go_to_definition` - 跳转到定义（支持外部依赖）
- `get_hover` - 获取类型签名和注释
- `find_references` - 查找所有引用
- `search_symbols` - 符号搜索（`include_external: true` 可搜外部依赖）

**使用示例**：
```
场景：调用下游 RPC，需要了解 Request/Response 结构
代码：resp, err := rpc.GetUserInfo(ctx, &userpb.GetUserInfoRequest{UserID: id})

方式 A（推荐）- 按符号名查询：
  go_to_definition:
    file_path: "handler/user.go"
    symbol: "GetUserInfoRequest"
    use_disk: true

方式 B - 按行列号查询：
  go_to_definition:
    file_path: "handler/user.go"
    line: 42
    col: 35
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
- ❌ 手动拼接版本号路径

**原因**：RPC 依赖通常在外部仓库（`$GOPATH/pkg/mod/...`），路径包含版本号，Grep 搜索效率极低且容易出错。LSP 能直接解析 import 路径并跳转。

**注意**：`/plan` 聚焦快速定位，不需要深度探索。如果需求不清晰，先用 `/bytecoding:design` 探索。

**产出**：
- 需要修改的文件列表
- 参考实现位置
- RPC 依赖的入参/出参结构（通过 LSP 获取）
- 实现思路

## Step 3: 生成 tasks.md

基于搜索分析结果，生成任务列表。

**写入文件**：`.bytecoding/changes/$CHANGE_ID/tasks.md`

**格式要求**：

```markdown
# 任务列表：[需求描述]

## 概述
[简要说明实现思路，2-3 句话]

## 涉及文件
- path/to/file1.go（修改/新增）
- path/to/file2.go（修改）

## 任务

### Task 1: [任务标题]
- **文件**: path/to/file.go
- **内容**: [具体做什么]
- **验证**: [如何验证完成]

### Task 2: [任务标题]
- **文件**: path/to/file.go
- **内容**: [具体做什么]
- **验证**: [如何验证完成]

## 验证标准
- [ ] 编译通过：go build ./path/to/changed/package/...
- [ ] 代码格式：go fmt
```

**任务粒度**：2-5 分钟可完成

## Step 4: 飞书通知

读取 planspec.yaml 中的 lark_email，发送通知：

```bash
CHANGE_DIR=".bytecoding/changes/$CHANGE_ID"
lark_email=$(grep 'lark_email' "${CHANGE_DIR}/planspec.yaml" | awk '{print $2}' | tr -d '"')

if [ -n "$lark_email" ]; then
  lark-cli send-message \
    --receive-id "$lark_email" \
    --receive-id-type email \
    --msg-type text \
    --content "{\"text\":\"Plan 已生成\\n\\n变更ID：$CHANGE_ID\\n描述：$ARGUMENTS\\n\\n下一步：/apply $CHANGE_ID\"}"
fi
```

## 完成标志

- [x] planspec.yaml 已创建
- [x] tasks.md 已生成
- [x] 飞书通知已发送（如有 lark_email）

## 下一步

提示用户：

```
Plan 已完成！

变更目录：.bytecoding/changes/$CHANGE_ID/
任务文件：tasks.md

下一步：/bytecoding:apply $CHANGE_ID
```
