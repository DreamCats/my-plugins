# 飞书群聊消息总结 (feishu-group-summary)

自动搜索飞书群聊,获取指定时间范围内的历史消息,进行智能分析,并生成结构化的总结报告。

## 功能特性

- 🔍 **智能搜索**: 通过关键词搜索飞书群聊
- 📊 **消息统计**: 自动统计消息数、参与人数、消息类型分布
- 👥 **用户排行**: 识别活跃用户 Top 10
- 🔥 **关键词提取**: 提取热门讨论关键词
- 🤖 **LLM 分析**: 使用 Claude 深度分析讨论内容和主题
- 📝 **结构化报告**: 生成包含多个维度的 Markdown 报告

## 安装

### 1. 确保已安装 lark-cli

```bash
# 检查 lark-cli 是否已安装
lark-cli --version

# 如果未安装,请先安装
# (安装方式请参考 lark-cli 文档)
```

### 2. 安装插件

在 Claude Code 中:

```bash
/marketplace add /Users/bytedance/Demo/my-plugins/.claude-plugin/marketplace.json
```

或者直接将 `marketplace.json` 拖入 Claude Code 界面。

## 使用方法

### 基本用法

在 Claude Code 中直接说出你的需求:

```
帮我总结项目群最近3天的讨论
```

```
分析产品团队群上周的消息
```

```
生成设计群本周的聊天总结报告
```

### 完整工作流

1. **收集输入**
   - 群名称/关键词
   - 时间范围 (默认近7天)
   - 报告语言 (默认中文)

2. **搜索群聊**
   - 根据关键词搜索匹配的群
   - 用户确认选择目标群

3. **获取消息**
   - 自动解析时间范围
   - 处理分页,获取完整历史

4. **统计分析**
   - 消息数、用户数、类型分布
   - 活跃用户排行
   - 关键词提取

5. **LLM 深度分析**
   - 识别讨论主题
   - 提取核心观点
   - 识别行动项

6. **生成报告**
   - 填充报告模板
   - 输出 Markdown 格式

## 报告内容

生成的报告包含以下部分:

- 📋 **基本信息**: 群名称、时间范围、消息数、参与人数
- 💬 **消息统计**: 消息总量、活跃时段、类型分布
- 👥 **活跃用户排行**: Top 10 活跃用户
- 🔥 **热门话题关键词**: Top 15 关键词
- 📝 **核心讨论内容总结**: 主题分析 (LLM 生成)
- ✅ **行动项与待办事项**: 提取的行动项
- 🔗 **重要链接与资源**: 消息中的链接
- 📊 **活跃度趋势**: 日均消息数、最活跃的一天

## 脚本说明

### chat_operations.py

群聊搜索和消息获取。

```python
from chat_operations import search_chats, get_messages, parse_time_range

# 搜索群聊
chats = search_chats("项目")

# 获取消息
start_time, end_time = parse_time_range("近3天")
messages = get_messages(chat_id, start_time, end_time)
```

### message_analyzer.py

消息统计分析。

```python
from message_analyzer import (
    calculate_statistics,
    extract_keywords,
    extract_action_items,
)

statistics = calculate_statistics(messages)
keywords = extract_keywords(messages, top_n=20)
action_items = extract_action_items(messages)
```

### report_generator.py

报告生成。

```python
from report_generator import generate_report, save_report

report = generate_report(
    chat_name="群名称",
    statistics=statistics,
    keywords=keywords,
    discussion_topics=topics,
    action_items=action_items,
    analysis_result=llm_analysis,
)
save_report(report, "output.md")
```

## 技术架构

- **语言**: Python 3
- **依赖**: lark-cli (全局安装)
- **AI 分析**: Claude Code (当前会话)
- **输出格式**: Markdown

## 限制与注意事项

1. **权限要求**: 需要有权限访问目标群聊
2. **消息限制**: 最多拉取 10,000 条历史消息
3. **时间范围**: 部分群聊可能限制历史消息查看时长
4. **API 限流**: lark-cli 可能存在速率限制

## 测试

运行测试脚本验证功能:

```bash
cd /tmp
python3 /path/to/feishu-group-summary/scripts/test_skill.py
```

## 目录结构

```
feishu-group-summary/
├── .claude-plugin/
│   └── plugin.json                    # 插件配置
└── skills/
    └── feishu-group-summary/
        ├── SKILL.md                    # 技能文档
        ├── scripts/
        │   ├── lark_cli.py            # lark-cli 封装
        │   ├── chat_operations.py     # 群聊操作
        │   ├── message_analyzer.py    # 消息分析
        │   ├── report_generator.py    # 报告生成
        │   └── test_skill.py         # 测试脚本
        └── references/
            └── report_template.md     # 报告模板
```

## 作者

- 买峰 (maifeng@bytedance.com)
- DreamCats (https://github.com/DreamCats)

## 许可证

MIT License
