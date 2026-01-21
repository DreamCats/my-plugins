#!/usr/bin/env python3
"""
分析飞书群聊消息 (命令行接口)
"""
import argparse
import json
import sys

from message_analyzer import (
    calculate_statistics,
    extract_keywords,
    extract_action_items,
    find_discussion_topics,
)


def main():
    parser = argparse.ArgumentParser(
        description="分析飞书群聊消息",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
  %(prog)s --messages messages.json
  %(prog)s --messages messages.json --top-keywords 30 --output analysis.json
        """
    )

    parser.add_argument(
        "--messages",
        required=True,
        help="消息 JSON 文件路径 (可以通过 get_messages_cli.py 获取)"
    )

    parser.add_argument(
        "--top-keywords",
        type=int,
        default=20,
        help="提取的关键词数量 (默认: 20)"
    )

    parser.add_argument(
        "--output",
        "-o",
        help="输出文件路径 (默认: 输出到 stdout)"
    )

    parser.add_argument(
        "--pretty",
        action="store_true",
        help="格式化 JSON 输出"
    )

    args = parser.parse_args()

    # 读取消息
    print(f"正在读取消息文件: {args.messages}", file=sys.stderr)
    with open(args.messages, "r", encoding="utf-8") as f:
        data = json.load(f)

    messages = data.get("messages", data)  # 支持两种格式

    print(f"✓ 读取到 {len(messages)} 条消息", file=sys.stderr)

    # 统计分析
    print("正在分析消息...", file=sys.stderr)
    statistics = calculate_statistics(messages)
    print(f"  ✓ 消息总数: {statistics['total_messages']}", file=sys.stderr)
    print(f"  ✓ 参与人数: {statistics['unique_users']}", file=sys.stderr)

    # 提取关键词
    keywords = extract_keywords(messages, top_n=args.top_keywords)
    print(f"  ✓ 提取关键词: {len(keywords)} 个", file=sys.stderr)

    # 提取行动项
    action_items = extract_action_items(messages)
    print(f"  ✓ 行动项: {len(action_items)} 个", file=sys.stderr)

    # 识别讨论主题
    topics = find_discussion_topics(messages)
    print(f"  ✓ 讨论主题: {len(topics)} 个", file=sys.stderr)

    # 输出结果
    result = {
        "statistics": statistics,
        "keywords": keywords,
        "action_items": action_items,
        "discussion_topics": topics,
    }

    if args.pretty:
        json_output = json.dumps(result, ensure_ascii=False, indent=2)
    else:
        json_output = json.dumps(result, ensure_ascii=False)

    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            f.write(json_output)
        print(f"✓ 已保存到: {args.output}", file=sys.stderr)
    else:
        print(json_output)


if __name__ == "__main__":
    main()
