---
name: feishu-group-summary
description: 当用户要求"拉取飞书群聊"、"查看群消息"、"导出群聊记录"或需要获取飞书群聊历史消息时使用此技能。
---

# 飞书群聊消息拉取

## 概览

搜索飞书群聊,拉取指定时间范围内的历史消息,输出为易读的 Markdown 格式,供 LLM 进一步分析。

## 工作流程

### 步骤 1: 收集用户输入

向用户确认以下信息:

1. **群名称/关键词** (必填): 用于搜索目标群的关键词
   - 示例: "项目群"、"设计群"、"产品团队"

2. **时间范围** (可选,默认近7天): 支持多种格式
   - "近N天" / "最近N天" / "N天内" → 如 "近3天"
   - "近N周" / "最近N周" → 如 "近1周"
   - "本周"、"上周"
   - "YYYY-MM-DD至YYYY-MM-DD" → 如 "2026-01-01至2026-01-07"

3. **输出方式** (可选,默认输出到终端): 可选择保存为文件

### 步骤 2: 搜索群聊

使用命令行脚本搜索匹配的群聊:

```bash
python3 scripts/fetch_chat_messages.py search "关键词"
```

返回群列表后,让用户确认选择哪个群。

### 步骤 3: 拉取消息

使用命令行脚本获取历史消息:

```bash
python3 scripts/fetch_chat_messages.py fetch \
  --chat-id oc_xxxxxxxxxxxxx \
  --chat-name "群名称" \
  --time-range "近3天" \
  --output messages.md
```

脚本会:
- 解析时间范围
- 自动处理分页
- 获取完整消息列表
- 输出为 Markdown 格式

### 步骤 4: LLM 分析 (可选)

拉取到的消息已按时间顺序组织为易读的 Markdown 格式,可以直接:
- 展示给用户查看
- 提供给 Claude 进行总结分析
- 保存为文件供后续使用

## 完整使用示例

**用户**: "帮我拉取项目群最近 3 天的聊天记录"

**Claude** 执行步骤:

1. **确认输入**:
   - 群名称: "项目"
   - 时间范围: "近3天"

2. **搜索群聊**:
   ```bash
   python3 scripts/fetch_chat_messages.py search "项目"
   ```
   返回: 找到 3 个群聊
   - "XX项目开发群" (oc_xxx)
   - "项目沟通群" (oc_yyy)
   - "项目管理群" (oc_zzz)

3. **用户选择**: "XX项目开发群" (chat_id: oc_xxx)

4. **拉取消息**:
   ```bash
   python3 scripts/fetch_chat_messages.py fetch \
     --chat-id oc_xxx \
     --chat-name "XX项目开发群" \
     --time-range "近3天" \
     --output messages.md
   ```

5. **展示结果**: 将消息内容展示给用户,或根据用户需求进行进一步分析

## 脚本使用说明

### fetch_chat_messages.py - 核心脚本

#### 搜索群聊

```bash
python3 scripts/fetch_chat_messages.py search "关键词"
```

#### 拉取消息

```bash
# 使用时间范围描述
python3 scripts/fetch_chat_messages.py fetch \
  --chat-id oc_xxx \
  --chat-name "群名称" \
  --time-range "近3天" \
  --output messages.md

# 使用时间戳
python3 scripts/fetch_chat_messages.py fetch \
  --chat-id oc_xxx \
  --start-time 1642723200 \
  --end-time 1642992000 \
  --output messages.md

# 输出到终端(不保存文件)
python3 scripts/fetch_chat_messages.py fetch \
  --chat-id oc_xxx \
  --time-range "近3天"
```

## 输出格式

拉取的消息会按以下格式组织:

```markdown
# 群名称 - 聊天记录

**时间范围**: 近3天
**时间段**: 2026-01-20 10:00 至 2026-01-23 10:00
**消息总数**: 156 条

---

## 2026-01-23

### 10:30 张三
@李四 你看一下这个 bug

---

### 10:32 李四
好的,我马上处理

---

...
```

## 技术依赖

- **lark-cli**: 全局安装的飞书命令行工具
- **Python 3**: 脚本运行环境

## 注意事项

1. **权限要求**: 需要有权限访问目标群聊
2. **消息限制**: 最多拉取 10,000 条历史消息
3. **时间范围**: 部分群聊可能限制历史消息查看时长
4. **API 限流**: lark-cli 可能存在速率限制,大量消息需分批获取

## 故障排除

### 问题: lark-cli 未找到

**解决**: 确认 lark-cli 已全局安装
```bash
which lark-cli
lark-cli --version
```

### 问题: 权限不足

**解决**: 检查当前用户是否有权限访问该群聊,或联系群管理员

### 问题: 消息拉取不完整

**解决**:
- 检查时间范围是否过大
- 确认群聊历史消息保留时长
- 查看是否有 API 限流
