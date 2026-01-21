#!/usr/bin/env python3
"""
飞书群聊总结 - 完整工作流脚本
一键完成从搜索群聊到生成报告的全流程
"""
import argparse
import json
import os
import sys
import tempfile
from pathlib import Path

# 添加脚本路径到 sys.path
script_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, script_dir)

from chat_operations import search_chats, get_messages, parse_time_range
from message_analyzer import calculate_statistics, extract_keywords, extract_action_items, find_discussion_topics
from report_generator import generate_report, save_report


def select_chat(chats):
    """让用户选择群聊"""
    if not chats:
        print("❌ 未找到匹配的群聊")
        sys.exit(1)

    if len(chats) == 1:
        return chats[0]

    print(f"\n找到 {len(chats)} 个群聊:")
    for i, chat in enumerate(chats, 1):
        name = chat.get("name", "未知")
        description = chat.get("description", "")
        print(f"{i}. {name}")
        if description:
            print(f"   {description}")

    while True:
        try:
            choice = input(f"\n请选择群聊 (1-{len(chats)}): ").strip()
            index = int(choice) - 1
            if 0 <= index < len(chats):
                return chats[index]
            print("❌ 无效的选择,请重新输入")
        except (ValueError, KeyboardInterrupt):
            print("\n❌ 取消")
            sys.exit(1)


def main():
    parser = argparse.ArgumentParser(
        description="飞书群聊总结 - 完整工作流",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
  # 交互式使用
  %(prog)s --query "项目群" --time-range "近3天"

  # 指定 chat_id
  %(prog)s --chat-id oc_xxx --chat-name "项目群" --time-range "近7天"

  # 完整参数
  %(prog)s --chat-id oc_xxx --chat-name "项目群" --time-range "近3天" --output report.md
        """
    )

    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument(
        "--query",
        help="搜索群聊的关键词"
    )
    group.add_argument(
        "--chat-id",
        help="直接指定群聊 ID"
    )

    parser.add_argument(
        "--chat-name",
        help="群聊名称 (使用 --chat-id 时必须提供)"
    )

    parser.add_argument(
        "--time-range",
        default="近7天",
        help="时间范围 (默认: 近7天)"
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
        help="输出报告文件路径 (默认: ./群聊总结_YYYYMMDD_HHMMSS.md)"
    )

    parser.add_argument(
        "--no-llm",
        action="store_true",
        help="跳过 LLM 智能分析 (仅使用统计分析)"
    )

    parser.add_argument(
        "--keep-temp",
        action="store_true",
        help="保留临时文件 (用于调试)"
    )

    args = parser.parse_args()

    # 搜索或确认群聊
    if args.query:
        print(f"🔍 正在搜索群聊: {args.query}")
        chats = search_chats(args.query)
        chat = select_chat(chats)
        chat_id = chat.get("chat_id")
        chat_name = chat.get("name", args.query)
    else:
        if not args.chat_name:
            parser.error("使用 --chat-id 时必须提供 --chat-name")
        chat_id = args.chat_id
        chat_name = args.chat_name

    print(f"\n✓ 选择群聊: {chat_name} ({chat_id})")

    # 解析时间范围
    start_time, end_time = parse_time_range(args.time_range)
    print(f"✓ 时间范围: {args.time_range}")

    # 获取消息
    print(f"\n📨 正在获取消息...")
    messages = get_messages(chat_id, start_time, end_time)
    print(f"✓ 获取到 {len(messages)} 条消息")

    if not messages:
        print("❌ 该时间段内没有消息")
        sys.exit(1)

    # 统计分析
    print(f"\n📊 正在分析消息...")
    statistics = calculate_statistics(messages)
    keywords = extract_keywords(messages, top_n=args.top_keywords)
    action_items = extract_action_items(messages)
    topics = find_discussion_topics(messages)

    print(f"✓ 消息总数: {statistics['total_messages']}")
    print(f"✓ 参与人数: {statistics['unique_users']}")
    print(f"✓ 关键词: {len(keywords)} 个")
    print(f"✓ 行动项: {len(action_items)} 个")
    print(f"✓ 讨论主题: {len(topics)} 个")

    # LLM 分析 (可选)
    llm_analysis = None
    if not args.no_llm:
        print(f"\n🤖 提示: 如需 LLM 深度分析,请在 Claude Code 中调用此技能")
        print(f"   当前模式: 仅统计分析")

    # 生成报告
    print(f"\n📝 正在生成报告...")

    # 确定输出路径
    if args.output:
        output_path = args.output
    else:
        from datetime import datetime
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_path = f"./群聊总结_{timestamp}.md"

    report = generate_report(
        chat_name=chat_name,
        statistics=statistics,
        keywords=keywords,
        discussion_topics=topics,
        action_items=action_items,
        analysis_result=llm_analysis,
    )

    save_report(report, output_path)

    # 清理临时文件
    if not args.keep_temp:
        temp_dir = os.path.join(tempfile.gettempdir(), "feishu_group_summary")
        if os.path.exists(temp_dir):
            import shutil
            shutil.rmtree(temp_dir)

    print(f"\n✅ 完成!")
    print(f"   报告已保存到: {output_path}")


if __name__ == "__main__":
    main()
