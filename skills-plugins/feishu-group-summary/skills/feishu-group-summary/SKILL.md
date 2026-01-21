---
name: feishu-group-summary
description: 当用户要求"总结飞书群聊"、"分析群消息"、"群聊回顾报告"或需要分析飞书群聊历史消息并生成结构化报告时使用此技能。
---

# 飞书群聊消息总结

## 概览

自动搜索飞书群聊,获取指定时间范围内的历史消息,进行智能分析,并生成结构化的总结报告。

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

3. **报告语言** (可选,默认中文): 中文或英文

### 步骤 2: 搜索群聊

使用命令行脚本搜索匹配的群聊:

```bash
python3 scripts/chat_operations.py search "关键词"
```

返回群列表后,让用户确认选择哪个群。

### 步骤 3: 获取消息

使用命令行脚本获取历史消息:

```bash
python3 scripts/get_messages_cli.py \
  --chat-id oc_xxxxxxxxxxxxx \
  --time-range "近3天" \
  --output messages.json
```

脚本会:
- 解析时间范围
- 自动处理分页
- 获取完整消息列表
- 保存为 JSON 格式

### 步骤 4: 统计分析

使用命令行脚本进行统计分析:

```bash
python3 scripts/analyze_messages_cli.py \
  --messages messages.json \
  --top-keywords 20 \
  --output analysis.json
```

统计内容包括:
- 消息总数、参与人数
- 消息类型分布
- 活跃用户排行
- 热门关键词
- 时间分布
- 行动项
- 讨论主题

### 步骤 5: LLM 智能分析 (关键步骤)

将消息内容发送给 Claude 进行深度分析:

**提示词模板**:

```
请分析以下飞书群聊消息,提取关键信息:

群聊名称: {群名称}
时间范围: {时间范围}
消息总数: {消息数}

消息内容:
{消息内容列表(按时间分组)}

请提取:
1. 核心讨论主题 (至少3个)
   - 主题名称
   - 讨论概要
   - 主要观点 (2-3个)
   - 参与人员

2. 重要行动项
   - 行动描述
   - 相关人员 (@mentions)
   - 时间背景

3. 关键决策或共识

请以 JSON 格式返回:
{
  "topics": [...],
  "action_items": [...],
  "decisions": [...]
}
```

**注意事项**:
- 消息太多时,按时间段分批分析
- 每批不超过 50 条消息
- 汇总各批次的分析结果

### 步骤 6: 生成报告

使用命令行脚本生成最终报告:

```bash
python3 scripts/generate_report_cli.py \
  --chat-name "群名称" \
  --statistics analysis.json \
  --output report.md
```

如果包含 LLM 分析结果:

```bash
python3 scripts/generate_report_cli.py \
  --chat-name "群名称" \
  --statistics analysis.json \
  --analysis llm_analysis.json \
  --output report.md
```

## 一键生成报告 (推荐)

使用完整工作流脚本,一键完成所有步骤:

```bash
python3 scripts/summary_chat.py \
  --query "项目群" \
  --time-range "近3天" \
  --output report.md
```

或者指定 chat_id:

```bash
python3 scripts/summary_chat.py \
  --chat-id oc_xxxxxxxxxxxxx \
  --chat-name "项目群" \
  --time-range "近7天" \
  --output report.md
```

## 脚本使用说明

### 命令行脚本 (推荐)

#### get_messages_cli.py - 获取消息

```bash
# 使用时间范围描述
python3 scripts/get_messages_cli.py \
  --chat-id oc_xxx \
  --time-range "近3天" \
  --output messages.json

# 使用时间戳
python3 scripts/get_messages_cli.py \
  --chat-id oc_xxx \
  --start-time 1642723200 \
  --end-time 1642992000 \
  --output messages.json
```

#### analyze_messages_cli.py - 分析消息

```bash
python3 scripts/analyze_messages_cli.py \
  --messages messages.json \
  --top-keywords 20 \
  --output analysis.json
```

#### generate_report_cli.py - 生成报告

```bash
# 基础报告
python3 scripts/generate_report_cli.py \
  --chat-name "项目群" \
  --statistics analysis.json \
  --output report.md

# 包含 LLM 分析
python3 scripts/generate_report_cli.py \
  --chat-name "项目群" \
  --statistics analysis.json \
  --analysis llm_analysis.json \
  --output report.md
```

#### summary_chat.py - 完整工作流 (一键生成)

```bash
# 交互式搜索群聊
python3 scripts/summary_chat.py \
  --query "项目群" \
  --time-range "近3天" \
  --output report.md

# 直接指定群聊
python3 scripts/summary_chat.py \
  --chat-id oc_xxx \
  --chat-name "项目群" \
  --time-range "近7天" \
  --output report.md

# 跳过 LLM 分析
python3 scripts/summary_chat.py \
  --chat-id oc_xxx \
  --chat-name "项目群" \
  --no-llm \
  --output report.md
```

## 完整使用示例

**用户**: "帮我总结项目群最近 3 天的讨论"

**Claude** 执行步骤:

1. **确认输入**:
   - 群名称: "项目"
   - 时间范围: "近3天"
   - 语言: "中文"

2. **搜索群聊**:
   ```bash
   python3 scripts/chat_operations.py search "项目"
   ```
   返回: 找到 3 个群聊
   - "XX项目开发群" (oc_xxx)
   - "项目沟通群" (oc_yyy)
   - "项目管理群" (oc_zzz)

3. **用户选择**: "XX项目开发群" (chat_id: oc_xxx)

4. **获取消息**:
   ```bash
   python3 scripts/get_messages_cli.py \
     --chat-id oc_xxx \
     --time-range "近3天" \
     --output messages.json
   ```

5. **统计分析**:
   ```bash
   python3 scripts/analyze_messages_cli.py \
     --messages messages.json \
     --output analysis.json
   ```

6. **LLM 分析**: 将消息内容分批发送给 Claude,获取深度分析

7. **生成报告**:
   ```bash
   python3 scripts/generate_report_cli.py \
     --chat-name "XX项目开发群" \
     --statistics analysis.json \
     --output ./群聊总结报告.md
   ```

8. **输出报告**: 显示报告内容,并保存到文件

## 技术依赖

- **lark-cli**: 全局安装的飞书命令行工具
- **Python 3**: 脚本运行环境
- **Claude Code**: LLM 智能分析

## 注意事项

1. **权限要求**: 需要有权限访问目标群聊
2. **消息限制**: 最多拉取 10,000 条历史消息
3. **时间范围**: 部分群聊可能限制历史消息查看时长
4. **API 限流**: lark-cli 可能存在速率限制,大量消息需分批获取
5. **工作目录**: 所有脚本必须在技能目录外的工作目录执行

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

### 问题: LLM 分析超时

**解决**:
- 减少单批次消息数量 (建议 30-50 条)
- 分多个时间段分别分析
- 汇总各批次结果
