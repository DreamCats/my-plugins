#!/usr/bin/env python3
"""
报告生成器。
"""

import os
from datetime import datetime
from typing import Dict, List, Optional


def generate_report(
    chat_name: str,
    statistics: Dict,
    keywords: List[Dict],
    discussion_topics: List[Dict],
    action_items: List[Dict],
    analysis_result: Optional[Dict] = None,
    template_path: Optional[str] = None,
) -> str:
    """生成 Markdown 格式的总结报告。

    Args:
        chat_name: 群聊名称
        statistics: 统计数据
        keywords: 关键词列表
        discussion_topics: 讨论主题列表
        action_items: 行动项列表
        analysis_result: LLM 分析结果 (可选)
        template_path: 报告模板路径 (可选)

    Returns:
        Markdown 格式的报告
    """
    # 如果提供了模板路径,读取模板
    template = ""
    if template_path and os.path.exists(template_path):
        with open(template_path, "r", encoding="utf-8") as f:
            template = f.read()

    # 如果有模板,填充模板;否则使用默认格式
    if template:
        report = fill_template(template, {
            "chat_name": chat_name,
            "statistics": statistics,
            "keywords": keywords,
            "discussion_topics": discussion_topics,
            "action_items": action_items,
            "analysis_result": analysis_result,
        })
    else:
        report = generate_default_report(
            chat_name,
            statistics,
            keywords,
            discussion_topics,
            action_items,
            analysis_result,
        )

    return report


def fill_template(template: str, context: Dict) -> str:
    """填充报告模板 (简化版实现)。

    Args:
        template: 模板内容
        context: 上下文数据

    Returns:
        填充后的报告
    """
    # 简化版:直接使用 Python 格式化
    # 实际实现可以使用更复杂的模板引擎 (如 Jinja2)

    report = template

    # 替换基本信息
    report = report.replace("{{CHAT_NAME}}", context.get("chat_name", "未知群聊"))

    # 替换时间范围
    stats = context.get("statistics", {})
    date_range = stats.get("date_range")
    if date_range:
        start = date_range.get("start_formatted", "未知")
        end = date_range.get("end_formatted", "未知")
        report = report.replace("{{TIME_RANGE}}", f"{start} ~ {end}")
    else:
        report = report.replace("{{TIME_RANGE}}", "未知")

    # 替换消息总数
    report = report.replace("{{TOTAL_MESSAGES}}", str(stats.get("total_messages", 0)))

    # 替换参与人数
    report = report.replace("{{UNIQUE_USERS}}", str(stats.get("unique_users", 0)))

    # 这里可以添加更多字段替换...

    return report


def generate_default_report(
    chat_name: str,
    statistics: Dict,
    keywords: List[Dict],
    discussion_topics: List[Dict],
    action_items: List[Dict],
    analysis_result: Optional[Dict] = None,
) -> str:
    """生成默认格式的报告。

    Args:
        chat_name: 群聊名称
        statistics: 统计数据
        keywords: 关键词列表
        discussion_topics: 讨论主题列表
        action_items: 行动项列表
        analysis_result: LLM 分析结果

    Returns:
        Markdown 格式的报告
    """
    lines = []

    # 标题
    lines.append(f"# {chat_name} - 聊天总结报告\n")

    # 基本信息
    lines.append("## 📋 基本信息")
    date_range = statistics.get("date_range")
    if date_range:
        lines.append(f"- **群名称**: {chat_name}")
        lines.append(f"- **分析时间范围**: {date_range.get('start_formatted', '未知')} ~ {date_range.get('end_formatted', '未知')}")
    lines.append(f"- **消息总数**: {statistics.get('total_messages', 0):,} 条")
    lines.append(f"- **参与人数**: {statistics.get('unique_users', 0)} 人\n")

    # 消息统计
    lines.append("## 💬 消息统计")
    lines.append(f"- **消息总量**: {statistics.get('total_messages', 0):,} 条")

    most_active_hour = statistics.get("most_active_hour")
    if most_active_hour:
        hour = most_active_hour[0]
        lines.append(f"- **活跃时段**: {hour:02d}:00-{hour:02d}:59")

    lines.append("- **消息类型分布**:")
    msg_type_dist = statistics.get("msg_type_distribution", {})
    msg_type_names = {
        "text": "文本消息",
        "post": "富文本消息",
        "image": "图片消息",
        "file": "文件消息",
        "audio": "音频消息",
        "video": "视频消息",
        "emotion": "表情回复",
    }
    for msg_type, data in sorted(msg_type_dist.items(), key=lambda x: x[1]["count"], reverse=True):
        count = data["count"]
        percentage = data["percentage"]
        name = msg_type_names.get(msg_type, msg_type)
        lines.append(f"  - {name}: {count} 条 ({percentage}%)")
    lines.append("")

    # 活跃用户排行
    active_users = statistics.get("active_users", [])
    if active_users:
        lines.append("## 👥 活跃用户排行")
        total = statistics.get("total_messages", 1)
        for i, user in enumerate(active_users[:10], 1):
            user_id = user.get("user_id", "未知")
            count = user.get("message_count", 0)
            percentage = round(count / total * 100, 1) if total > 0 else 0
            lines.append(f"{i}. **{user_id}**: {count} 条消息 ({percentage}%)")
        lines.append("")

    # 热门话题关键词
    if keywords:
        lines.append("## 🔥 热门话题关键词")
        for kw in keywords[:15]:
            keyword = kw.get("keyword", "")
            count = kw.get("count", 0)
            lines.append(f"- {keyword}: {count} 次")
        lines.append("")

    # 核心讨论内容总结 (如果有 LLM 分析)
    if analysis_result and analysis_result.get("topics"):
        lines.append("## 📝 核心讨论内容总结")
        topics = analysis_result.get("topics", [])
        for i, topic in enumerate(topics, 1):
            lines.append(f"### 主题 {i}: {topic.get('name', '未命名')}")
            lines.append(f"- **讨论概要**: {topic.get('summary', '无')}")
            lines.append(f"- **主要观点**:")
            for point in topic.get("points", []):
                lines.append(f"  - {point}")
            participants = topic.get("participants", [])
            if participants:
                lines.append(f"- **参与人员**: {', '.join(participants)}")
            lines.append("")

    # 讨论主题 (基于关键词聚类)
    if discussion_topics and not (analysis_result and analysis_result.get("topics")):
        lines.append("## 📝 核心讨论内容总结")
        for i, topic in enumerate(discussion_topics[:5], 1):
            lines.append(f"### 主题 {i}: {topic.get('name', '未命名')}")
            lines.append(f"- **关键词**: {topic.get('keyword', '')}")
            lines.append(f"- **消息数**: {topic.get('message_count', 0)} 条")
            lines.append(f"- **参与人数**: {topic.get('participant_count', 0)} 人")
            lines.append("")

    # 行动项与待办事项
    if action_items:
        lines.append("## ✅ 行动项与待办事项")
        for item in action_items[:10]:
            description = item.get("description", "")
            mentions = item.get("mentions", [])
            time_str = item.get("create_time_formatted", "")
            mentions_str = ", ".join(mentions) if mentions else "无"
            lines.append(f"- [ ] {description} - @{mentions_str} - {time_str}")
        lines.append("")

    # 重要链接
    links = statistics.get("links", [])
    if links:
        lines.append("## 🔗 重要链接与资源")
        for link in links[:10]:
            lines.append(f"- [{link}]({link})")
        lines.append("")

    # 活跃度趋势
    lines.append("## 📊 活跃度趋势")
    total_messages = statistics.get("total_messages", 0)
    date_range = statistics.get("date_range")
    if date_range and total_messages > 0:
        start_ts = date_range.get("start", 0)
        end_ts = date_range.get("end", 0)
        if end_ts > start_ts:
            days = (end_ts - start_ts) / 86400
            if days > 0:
                daily_avg = round(total_messages / days, 1)
                lines.append(f"- **日均消息数**: {daily_avg} 条/天")

    most_active_day = statistics.get("most_active_day")
    if most_active_day:
        day = most_active_day[0]
        count = most_active_day[1]
        lines.append(f"- **最活跃的一天**: {day} ({count} 条消息)")
    lines.append("")

    # 报告生成时间
    lines.append("---\n")
    lines.append(f"**报告生成时间**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    lines.append("**数据来源**: Lark API via lark-cli")

    return "\n".join(lines)


def save_report(report: str, output_path: str) -> None:
    """保存报告到文件。

    Args:
        report: 报告内容
        output_path: 输出文件路径
    """
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(report)
    print(f"报告已保存到: {output_path}")


if __name__ == "__main__":
    # 测试代码
    test_stats = {
        "total_messages": 1234,
        "unique_users": 15,
        "msg_type_distribution": {
            "text": {"count": 987, "percentage": 80.0},
            "image": {"count": 155, "percentage": 12.5},
            "file": {"count": 62, "percentage": 5.0},
        },
        "active_users": [
            {"user_id": "user_1", "message_count": 234},
            {"user_id": "user_2", "message_count": 187},
        ],
        "most_active_hour": (10, 150),
        "most_active_day": ("2026-01-20", 500),
        "date_range": {
            "start": 1642723200,
            "end": 1642992000,
            "start_formatted": "2026-01-21 00:00:00",
            "end_formatted": "2026-01-24 00:00:00",
        },
        "links": ["https://example.com/doc1", "https://example.com/doc2"],
    }

    test_keywords = [
        {"keyword": "API", "count": 45},
        {"keyword": "性能优化", "count": 38},
        {"keyword": "上线", "count": 32},
    ]

    test_topics = [
        {
            "name": "关于'API'的讨论",
            "keyword": "API",
            "message_count": 45,
            "participant_count": 8,
        },
        {
            "name": "关于'性能优化'的讨论",
            "keyword": "性能优化",
            "message_count": 38,
            "participant_count": 6,
        },
    ]

    test_action_items = [
        {
            "description": "完成缓存方案设计",
            "mentions": ["张三"],
            "create_time_formatted": "2026-01-21 10:30:00",
        },
        {
            "description": "执行性能测试",
            "mentions": ["李四"],
            "create_time_formatted": "2026-01-21 11:00:00",
        },
    ]

    report = generate_default_report(
        "测试群",
        test_stats,
        test_keywords,
        test_topics,
        test_action_items,
    )

    print(report)
