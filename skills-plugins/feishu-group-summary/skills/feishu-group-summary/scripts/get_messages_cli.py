#!/usr/bin/env python3
"""
获取飞书群聊历史消息 (命令行接口)
"""
import argparse
import json
import sys

# 导入模块函数
from chat_operations import get_messages, parse_time_range


def main():
    parser = argparse.ArgumentParser(
        description="获取飞书群聊历史消息",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
  %(prog)s --chat-id oc_xxx --time-range "近3天"
  %(prog)s --chat-id oc_xxx --start-time 1642723200 --end-time 1642992000
  %(prog)s --chat-id oc_xxx --time-range "近7天" --output messages.json
        """
    )

    parser.add_argument(
        "--chat-id",
        required=True,
        help="群聊 ID"
    )

    group = parser.add_mutually_exclusive_group()
    group.add_argument(
        "--time-range",
        default="近7天",
        help="时间范围描述 (如: '近3天', '上周', 'YYYY-MM-DD至YYYY-MM-DD')"
    )
    group.add_argument(
        "--start-time",
        type=int,
        help="起始时间 (秒级时间戳)"
    )

    parser.add_argument(
        "--end-time",
        type=int,
        help="结束时间 (秒级时间戳)"
    )

    parser.add_argument(
        "--max-messages",
        type=int,
        default=10000,
        help="最大消息数 (默认: 10000)"
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

    # 解析时间范围
    if args.start_time:
        start_time = args.start_time
        end_time = args.end_time or int(time.time())
    else:
        start_time, end_time = parse_time_range(args.time_range)

    # 获取消息
    print(f"正在获取群聊消息...", file=sys.stderr)
    print(f"  Chat ID: {args.chat_id}", file=sys.stderr)
    print(f"  时间范围: {start_time} - {end_time}", file=sys.stderr)
    print(f"  最大消息数: {args.max_messages}", file=sys.stderr)

    messages = get_messages(
        args.chat_id,
        start_time,
        end_time,
        max_messages=args.max_messages
    )

    print(f"✓ 获取到 {len(messages)} 条消息", file=sys.stderr)

    # 输出结果
    result = {
        "chat_id": args.chat_id,
        "start_time": start_time,
        "end_time": end_time,
        "total_messages": len(messages),
        "messages": messages,
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
    import time
    main()
