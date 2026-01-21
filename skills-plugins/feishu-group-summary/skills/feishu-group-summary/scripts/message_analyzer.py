#!/usr/bin/env python3
"""
飞书消息统计分析。
"""

import re
from collections import Counter
from datetime import datetime
from typing import Dict, List


def calculate_statistics(messages: List[Dict]) -> Dict:
    """计算消息统计数据。

    Args:
        messages: 消息列表

    Returns:
        包含统计数据的字典
    """
    if not messages:
        return {
            "total_messages": 0,
            "unique_users": 0,
            "msg_type_distribution": {},
            "active_users": [],
            "hourly_distribution": {},
            "daily_distribution": {},
            "date_range": None,
        }

    # 基础统计
    total_messages = len(messages)
    unique_senders = set()

    # 消息类型分布
    msg_type_counter = Counter()

    # 用户消息数统计
    user_message_count = Counter()

    # 时间分布 (按小时)
    hourly_distribution = Counter()

    # 时间分布 (按天)
    daily_distribution = Counter()

    # 提取的链接
    links = []

    # 提取的 @mentions
    mentions = []

    # 时间范围
    timestamps = []

    for msg in messages:
        # 发送者信息
        sender = msg.get("sender", {})
        sender_id = sender.get("id")
        if sender_id:
            unique_senders.add(sender_id)
            user_message_count[sender_id] += 1

        # 消息类型
        msg_type = msg.get("msg_type", "unknown")
        msg_type_counter[msg_type] += 1

        # 时间戳
        create_time = msg.get("create_time")
        if create_time:
            # 转换为整数（可能是字符串格式）
            if isinstance(create_time, str):
                create_time = int(create_time)
            # 如果是毫秒级时间戳，转换为秒
            if create_time > 1e12:
                create_time = create_time / 1000
            timestamps.append(create_time)
            dt = datetime.fromtimestamp(create_time)
            hourly_distribution[dt.hour] += 1
            daily_distribution[dt.strftime("%Y-%m-%d")] += 1

        # 提取链接
        body = msg.get("body", {})
        content = body.get("content", "")
        if content:
            # 简单的URL提取
            urls = re.findall(r'https?://[^\s<>"]+', content)
            links.extend(urls)

        # 提取 @mentions
        msg_mentions = msg.get("mentions", [])
        if msg_mentions:
            mentions.extend(msg_mentions)

    # 计算时间范围
    date_range = None
    if timestamps:
        min_time = min(timestamps)
        max_time = max(timestamps)
        date_range = {
            "start": min_time,
            "end": max_time,
            "start_formatted": datetime.fromtimestamp(min_time).strftime("%Y-%m-%d %H:%M:%S"),
            "end_formatted": datetime.fromtimestamp(max_time).strftime("%Y-%m-%d %H:%M:%S"),
        }

    # 活跃用户排行
    active_users = [
        {"user_id": user_id, "message_count": count}
        for user_id, count in user_message_count.most_common(10)
    ]

    # 消息类型分布百分比
    msg_type_distribution = {
        msg_type: {
            "count": count,
            "percentage": round(count / total_messages * 100, 2)
        }
        for msg_type, count in msg_type_counter.items()
    }

    # 活跃时段
    most_active_hour = hourly_distribution.most_common(1)[0] if hourly_distribution else None
    most_active_day = daily_distribution.most_common(1)[0] if daily_distribution else None

    return {
        "total_messages": total_messages,
        "unique_users": len(unique_senders),
        "msg_type_distribution": msg_type_distribution,
        "active_users": active_users,
        "hourly_distribution": dict(hourly_distribution),
        "daily_distribution": dict(daily_distribution),
        "most_active_hour": most_active_hour,
        "most_active_day": most_active_day,
        "date_range": date_range,
        "links": links,
        "mentions": mentions,
    }


def extract_keywords(messages: List[Dict], top_n: int = 20) -> List[Dict]:
    """提取热门关键词。

    Args:
        messages: 消息列表
        top_n: 返回前N个关键词

    Returns:
        关键词列表,每个元素包含 keyword 和 count
    """
    # 中文分词使用简单的正则表达式
    # 实际使用时可以考虑 jieba 等分词库

    # 过滤词表
    stop_words = {
        "的", "了", "是", "在", "我", "有", "和", "就", "不", "人", "都", "一", "一个",
        "上", "也", "很", "到", "说", "要", "去", "你", "会", "着", "没有", "看", "好",
        "自己", "这", "那", "这个", "那个", "什么", "可以", "这个", "那个", "吗", "呢", "吧",
        "啊", "哦", "嗯", "哈", "呀", "哪", "怎么", "为什么", "因为", "所以", "但是", "然后",
        "我们", "你们", "他们", "它们", "咱们", "大家", "各位", "或者", "还是", "虽然", "让",
        "给", "对", "把", "被", "从", "向", "以", "为", "把", "比", "跟", "与", "及", "而",
        "http", "https", "com", "cn", "www", "org", "net", "edu",
    }

    word_counter = Counter()

    for msg in messages:
        body = msg.get("body", {})
        content = body.get("content", "")

        if not content:
            continue

        # 提取中文词组 (2-4个字符)
        chinese_words = re.findall(r'[\u4e00-\u9fa5]{2,4}', content)

        # 提取英文单词 (2个字母以上)
        english_words = re.findall(r'\b[a-zA-Z]{2,}\b', content)

        words = chinese_words + english_words

        # 过滤停用词
        filtered_words = [w for w in words if w.lower() not in stop_words]

        word_counter.update(filtered_words)

    # 返回前N个关键词
    top_keywords = [
        {"keyword": word, "count": count}
        for word, count in word_counter.most_common(top_n)
    ]

    return top_keywords


def extract_action_items(messages: List[Dict]) -> List[Dict]:
    """提取行动项和待办事项。

    基于简单的关键词匹配:
    - 包含"待办"、"TODO"、"需要"、"要"等词
    - 包含 @mentions

    Args:
        messages: 消息列表

    Returns:
        行动项列表
    """
    action_keywords = [
        "待办", "TODO", "todo", "需要", "要", "记得", "别忘了",
        "安排", "计划", "准备", "处理", "完成", "跟进", "检查",
        "review", "fix", "implement", "add", "create", "update"
    ]

    action_items = []

    for msg in messages:
        body = msg.get("body", {})
        content = body.get("content", "")

        if not content:
            continue

        # 检查是否包含行动关键词
        has_action_keyword = any(
            keyword.lower() in content.lower()
            for keyword in action_keywords
        )

        # 提取 @mentions
        msg_mentions = msg.get("mentions", [])

        # 如果包含行动关键词或 @mentions,可能是行动项
        if has_action_keyword or msg_mentions:
            sender = msg.get("sender", {})
            create_time = msg.get("create_time")

            # 转换为整数（可能是字符串格式）
            if isinstance(create_time, str):
                create_time = int(create_time)
            # 如果是毫秒级时间戳，转换为秒
            if create_time > 1e12:
                create_time = create_time / 1000

            # 提取行动项描述 (简化版:取消息内容的前100字符)
            description = content[:100] + "..." if len(content) > 100 else content

            action_item = {
                "description": description,
                "sender_id": sender.get("id"),
                "mentions": [m.get("name") for m in msg_mentions],
                "create_time": create_time,
                "create_time_formatted": datetime.fromtimestamp(create_time).strftime("%Y-%m-%d %H:%M:%S") if create_time else None,
            }
            action_items.append(action_item)

    return action_items


def find_discussion_topics(messages: List[Dict]) -> List[Dict]:
    """识别讨论主题 (基于关键词聚类)。

    简化版实现:基于关键词频率聚类

    Args:
        messages: 消息列表

    Returns:
        主题列表
    """
    # 获取热门关键词
    keywords = extract_keywords(messages, top_n=10)

    # 为每个关键词提取相关消息
    topics = []

    for kw_item in keywords[:5]:  # 只取前5个关键词作为主题
        keyword = kw_item["keyword"]
        count = kw_item["count"]

        # 查找包含该关键词的消息
        related_messages = []
        for msg in messages:
            body = msg.get("body", {})
            content = body.get("content", "")
            if keyword in content:
                related_messages.append(msg)

        if len(related_messages) >= 3:  # 至少3条相关消息才认为是主题
            # 提取参与人员
            participants = set()
            for msg in related_messages:
                sender = msg.get("sender", {})
                sender_id = sender.get("id")
                if sender_id:
                    participants.add(sender_id)

            # 简单的主题描述
            topic = {
                "name": f"关于'{keyword}'的讨论",
                "keyword": keyword,
                "message_count": len(related_messages),
                "participant_count": len(participants),
                "participant_ids": list(participants),
                "sample_messages": related_messages[:3],  # 前3条作为样例
            }
            topics.append(topic)

    # 按消息数排序
    topics.sort(key=lambda x: x["message_count"], reverse=True)

    return topics
