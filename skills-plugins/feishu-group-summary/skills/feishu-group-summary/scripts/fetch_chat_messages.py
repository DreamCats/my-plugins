#!/usr/bin/env python3
"""
飞书群聊消息拉取工具 - 简化版
核心功能: 搜索群聊并拉取消息,输出为 Markdown 格式
"""

import argparse
import sys
from datetime import datetime, timedelta
from typing import Optional

from lark_cli import run_lark_cli


def search_chats(query: str, page_size: int = 20) -> list[dict]:
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


def parse_time_range(description: str) -> tuple[Optional[int], Optional[int]]:
    """解析时间范围描述为时间戳。

    支持格式:
    - "近3天"/"最近3天"/"3天内"
    - "近1周"/"最近1周"
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
        格式化的时间字符串,如 "2026-01-21 14:30"
    """
    return datetime.fromtimestamp(timestamp).strftime("%Y-%m-%d %H:%M")


def get_messages(
    chat_id: str,
    start_time: Optional[int] = None,
    end_time: Optional[int] = None,
    max_messages: int = 10000,
) -> list[dict]:
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


def format_message(msg: dict) -> str:
    """格式化单条消息为 Markdown。

    Args:
        msg: 消息对象

    Returns:
        Markdown 格式的消息文本
    """
    # 获取发送者信息
    sender_name = msg.get("sender", {}).get("name", "未知用户")

    # 获取消息内容
    msg_type = msg.get("msg_type", "text")
    body = msg.get("body", {})

    content_text = ""

    if msg_type == "text":
        # 文本消息
        content_text = body.get("content", "").strip()

    elif msg_type == "post":
        # 富文本消息
        post_content = body.get("content", {})
        if isinstance(post_content, str):
            import json
            post_content = json.loads(post_content)

        # 提取所有文本段落
        for post in post_content:
            for line in post:
                if line.get("tag") == "text":
                    content_text += line.get("text", "")
                elif line.get("tag") == "a":
                    # 链接
                    content_text += f"[{line.get('text', '链接')}]({line.get('href', '')})"
                elif line.get("tag") == "at":
                    # @提及
                    content_text += f"@{line.get('user_name', line.get('id', ''))}"
                elif line.get("tag") == "img":
                    # 图片
                    content_text += f"[图片: {line.get('image_key', '')}]"
                content_text += " "
        content_text = content_text.strip()

    elif msg_type == "image":
        # 图片消息
        image_key = body.get("content", {}).get("image_key", "")
        content_text = f"[发送了一张图片: {image_key}]"

    elif msg_type == "audio":
        # 音频消息
        content_text = "[发送了一条语音消息]"

    elif msg_type == "video":
        # 视频消息
        content_text = "[发送了一个视频]"

    elif msg_type == "file":
        # 文件消息
        file_name = body.get("content", {}).get("file_name", "未知文件")
        content_text = f"[发送了一个文件: {file_name}]"

    elif msg_type == "card":
        # 卡片消息
        content_text = "[发送了一个卡片/小程序消息]"

    else:
        # 其他类型
        content_text = f"[未支持的消息类型: {msg_type}]"

    # 如果内容为空,返回占位符
    if not content_text:
        content_text = "[空消息]"

    return content_text


def messages_to_markdown(
    chat_name: str,
    messages: list[dict],
    time_range_desc: str,
    start_time: int,
    end_time: int,
) -> str:
    """将消息列表转换为 Markdown 格式。

    Args:
        chat_name: 群聊名称
        messages: 消息列表
        time_range_desc: 时间范围描述
        start_time: 起始时间戳
        end_time: 结束时间戳

    Returns:
        Markdown 格式的文本
    """
    lines = []

    # 标题
    lines.append(f"# {chat_name} - 聊天记录")
    lines.append("")
    lines.append(f"**时间范围**: {time_range_desc}")
    lines.append(f"**时间段**: {format_timestamp(start_time)} 至 {format_timestamp(end_time)}")
    lines.append(f"**消息总数**: {len(messages)} 条")
    lines.append("")
    lines.append("---")
    lines.append("")

    if not messages:
        lines.append("*该时间段内暂无消息*")
        return "\n".join(lines)

    # 按日期分组
    from collections import defaultdict

    messages_by_date = defaultdict(list)

    # 消息是倒序的,先转为正序
    for msg in reversed(messages):
        timestamp = msg.get("create_time", 0)
        date_str = datetime.fromtimestamp(timestamp).strftime("%Y-%m-%d")
        messages_by_date[date_str].append(msg)

    # 按日期输出
    for date_str in sorted(messages_by_date.keys()):
        lines.append(f"## {date_str}")
        lines.append("")

        for msg in messages_by_date[date_str]:
            timestamp = msg.get("create_time", 0)
            time_str = datetime.fromtimestamp(timestamp).strftime("%H:%M")
            sender_name = msg.get("sender", {}).get("name", "未知用户")
            content = format_message(msg)

            lines.append(f"### {time_str} {sender_name}")
            lines.append("")
            lines.append(content)
            lines.append("")
            lines.append("---")
            lines.append("")

    return "\n".join(lines)


def main():
    parser = argparse.ArgumentParser(
        description="飞书群聊消息拉取工具",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
  # 搜索群聊
  python fetch_chat_messages.py search "项目群"

  # 拉取消息(使用 chat_id)
  python fetch_chat_messages.py fetch oc_xxxxxxxxxxxxx --time-range "近3天" --output messages.md

  # 拉取消息(使用时间戳)
  python fetch_chat_messages.py fetch oc_xxxxxxxxxxxxx --start-time 1642723200 --end-time 1642992000 --output messages.md
        """
    )

    subparsers = parser.add_subparsers(dest="command", help="子命令")

    # search 子命令
    search_parser = subparsers.add_parser("search", help="搜索群聊")
    search_parser.add_argument("query", help="搜索关键词")

    # fetch 子命令
    fetch_parser = subparsers.add_parser("fetch", help="拉取群聊消息")
    fetch_parser.add_argument("chat_id", help="群聊ID (如 oc_xxxxxxxxxxxxx)")
    fetch_parser.add_argument("--chat-name", help="群聊名称(用于报告标题)", default="未知群聊")
    fetch_parser.add_argument("--time-range", help="时间范围描述(如'近3天'、'上周')", default="近7天")
    fetch_parser.add_argument("--start-time", type=int, help="起始时间(秒级时间戳)")
    fetch_parser.add_argument("--end-time", type=int, help="结束时间(秒级时间戳)")
    fetch_parser.add_argument("--max-messages", type=int, default=10000, help="最大消息数")
    fetch_parser.add_argument("--output", "-o", help="输出文件路径(默认输出到stdout)")

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(1)

    if args.command == "search":
        # 搜索群聊
        chats = search_chats(args.query)

        if not chats:
            print(f"未找到匹配 '{args.query}' 的群聊")
            sys.exit(1)

        print(f"找到 {len(chats)} 个群聊:")
        for i, chat in enumerate(chats, 1):
            chat_id = chat.get("chat_id", "")
            name = chat.get("name", "未命名群聊")
            description = chat.get("description", "")
            print(f"\n{i}. {name}")
            print(f"   Chat ID: {chat_id}")
            if description:
                print(f"   描述: {description}")

    elif args.command == "fetch":
        # 拉取消息
        chat_id = args.chat_id

        # 解析时间范围
        if args.start_time and args.end_time:
            start_time, end_time = args.start_time, args.end_time
            time_range_desc = f"{args.start_time} 至 {args.end_time}"
        else:
            start_time, end_time = parse_time_range(args.time_range)
            time_range_desc = args.time_range

        print(f"正在拉取群聊消息 (Chat ID: {chat_id})...", file=sys.stderr)
        print(f"时间范围: {time_range_desc}", file=sys.stderr)

        messages = get_messages(chat_id, start_time, end_time, args.max_messages)

        print(f"成功拉取 {len(messages)} 条消息", file=sys.stderr)

        # 转换为 Markdown
        markdown = messages_to_markdown(
            chat_name=args.chat_name,
            messages=messages,
            time_range_desc=time_range_desc,
            start_time=start_time,
            end_time=end_time,
        )

        # 输出
        if args.output:
            with open(args.output, "w", encoding="utf-8") as f:
                f.write(markdown)
            print(f"已保存到: {args.output}", file=sys.stderr)
        else:
            print(markdown)


if __name__ == "__main__":
    main()
