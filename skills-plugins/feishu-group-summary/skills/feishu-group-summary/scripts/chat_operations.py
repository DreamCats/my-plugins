#!/usr/bin/env python3
"""
飞书群聊搜索与消息获取操作。
"""

import sys
from datetime import datetime, timedelta
from typing import Dict, List, Optional

from lark_cli import run_lark_cli


def search_chats(query: str, page_size: int = 20) -> List[Dict]:
    """搜索群聊。

    Args:
        query: 搜索关键词
        page_size: 分页大小,默认20

    Returns:
        群聊列表,每个元素包含 chat_id, name, description 等字段
    """
    args = ["search-chats", "--query", query, "--page-size", str(page_size)]
    data = run_lark_cli(args, want_json=True)
    return data.get("items", [])


def get_messages(
    chat_id: str,
    start_time: Optional[int] = None,
    end_time: Optional[int] = None,
    max_messages: int = 10000,
) -> List[Dict]:
    """获取群聊历史消息(自动处理分页)。

    Args:
        chat_id: 群聊ID
        start_time: 起始时间(秒级时间戳)
        end_time: 结束时间(秒级时间戳)
        max_messages: 最大消息数,默认10000

    Returns:
        消息列表,按时间倒序排列
    """
    all_messages = []
    page_token = None

    args = ["get-message-history", "--container-id-type", "chat", "--container-id", chat_id]

    if start_time:
        args.extend(["--start-time", str(start_time)])
    if end_time:
        args.extend(["--end-time", str(end_time)])

    while len(all_messages) < max_messages:
        current_args = args.copy()
        if page_token:
            current_args.extend(["--page-token", page_token])

        data = run_lark_cli(current_args, want_json=True)
        items = data.get("items", [])

        if not items:
            break

        all_messages.extend(items)

        if not data.get("has_more"):
            break

        page_token = data.get("page_token")

    return all_messages[:max_messages]


def parse_time_range(description: str) -> tuple[Optional[int], Optional[int]]:
    """解析时间范围描述为时间戳。

    支持格式:
    - "近3天"/"最近3天"/"3天内"
    - "近1周"/"最近1周"/"1周内"
    - "上周"/"本周"
    - "YYYY-MM-DD至YYYY-MM-DD"

    Args:
        description: 时间范围描述

    Returns:
        (start_time, end_time) 元组,秒级时间戳
    """
    now = datetime.now()
    description = description.strip().lower()

    # 近N天
    if "近" in description or "最近" in description or "天内" in description:
        import re
        match = re.search(r'(\d+)', description)
        if match:
            days = int(match.group(1))
            start = now - timedelta(days=days)
            return int(start.timestamp()), int(now.timestamp())

    # 近N周
    if "周" in description:
        import re
        match = re.search(r'(\d+)', description)
        if match:
            weeks = int(match.group(1))
            start = now - timedelta(weeks=weeks)
            return int(start.timestamp()), int(now.timestamp())

    # 上周
    if "上周" in description:
        # 计算上周一到上周日
        days_since_monday = now.weekday()
        this_monday = now - timedelta(days=days_since_monday)
        last_monday = this_monday - timedelta(weeks=1)
        last_sunday = last_monday + timedelta(days=6)
        last_sunday = last_sunday.replace(hour=23, minute=59, second=59)
        return int(last_monday.timestamp()), int(last_sunday.timestamp())

    # 本周
    if "本周" in description:
        days_since_monday = now.weekday()
        this_monday = now - timedelta(days=days_since_monday)
        this_monday = this_monday.replace(hour=0, minute=0, second=0)
        return int(this_monday.timestamp()), int(now.timestamp())

    # YYYY-MM-DD至YYYY-MM-DD
    if "至" in description or "到" in description:
        import re
        match = re.search(r'(\d{4}-\d{2}-\d{2})[至到](\d{4}-\d{2}-\d{2})', description)
        if match:
            start_str, end_str = match.groups()
            start_dt = datetime.fromisoformat(start_str)
            end_dt = datetime.fromisoformat(end_str)
            end_dt = end_dt.replace(hour=23, minute=59, second=59)
            return int(start_dt.timestamp()), int(end_dt.timestamp())

    # 默认:近7天
    start = now - timedelta(days=7)
    return int(start.timestamp()), int(now.timestamp())


def format_timestamp(timestamp: int) -> str:
    """格式化时间戳为可读字符串。

    Args:
        timestamp: 秒级时间戳

    Returns:
        格式化的时间字符串,如 "2026-01-21 14:30:00"
    """
    return datetime.fromtimestamp(timestamp).strftime("%Y-%m-%d %H:%M:%S")


def get_user_info(user_id: str, user_id_type: str = "open_id") -> Optional[Dict]:
    """获取用户信息。

    Args:
        user_id: 用户ID
        user_id_type: 用户ID类型,默认open_id

    Returns:
        用户信息字典,包含 name 等字段
    """
    try:
        args = ["get-user-info", "--user-id", user_id, "--user-id-type", user_id_type]
        data = run_lark_cli(args, want_json=True)
        return data
    except Exception:
        return None


if __name__ == "__main__":
    # 测试代码
    import json

    # 测试搜索群聊
    if len(sys.argv) > 1 and sys.argv[1] == "search":
        query = sys.argv[2] if len(sys.argv) > 2 else ""
        chats = search_chats(query)
        print(f"找到 {len(chats)} 个群聊:")
        for chat in chats:
            print(f"  - {chat.get('name')} ({chat.get('chat_id')})")

    # 测试时间解析
    if len(sys.argv) > 1 and sys.argv[1] == "time":
        desc = sys.argv[2] if len(sys.argv) > 2 else "近7天"
        start, end = parse_time_range(desc)
        print(f"时间范围: {desc}")
        print(f"  起始: {format_timestamp(start)}")
        print(f"  结束: {format_timestamp(end)}")
