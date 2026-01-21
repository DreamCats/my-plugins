#!/usr/bin/env python3
"""
飞书群聊总结 - 测试脚本
用于验证各个模块的功能
"""

import json
import sys
from chat_operations import search_chats, parse_time_range, format_timestamp
from message_analyzer import calculate_statistics, extract_keywords
from report_generator import generate_default_report


def test_search_chats():
    """测试群聊搜索"""
    print("=" * 50)
    print("测试 1: 搜索群聊")
    print("=" * 50)

    query = input("请输入搜索关键词 (留空跳过): ").strip()
    if not query:
        print("跳过群聊搜索测试\n")
        return None

    try:
        chats = search_chats(query)
        print(f"\n找到 {len(chats)} 个群聊:\n")

        for i, chat in enumerate(chats, 1):
            name = chat.get("name", "未知群名")
            chat_id = chat.get("chat_id", "未知ID")
            description = chat.get("description", "")
            print(f"{i}. {name}")
            print(f"   ID: {chat_id}")
            if description:
                print(f"   描述: {description}")
            print()

        if chats:
            choice = input(f"请选择群聊 (1-{len(chats)}, 0=跳过): ").strip()
            if choice.isdigit() and 1 <= int(choice) <= len(chats):
                selected = chats[int(choice) - 1]
                print(f"\n已选择: {selected.get('name')}")
                return selected.get("chat_id"), selected.get("name")

        return None
    except Exception as e:
        print(f"错误: {e}\n")
        return None


def test_time_parsing():
    """测试时间解析"""
    print("=" * 50)
    print("测试 2: 时间范围解析")
    print("=" * 50)

    test_cases = [
        "近3天",
        "近1周",
        "上周",
        "本周",
        "2026-01-01至2026-01-07",
    ]

    for desc in test_cases:
        start, end = parse_time_range(desc)
        print(f"\n输入: {desc}")
        print(f"  起始: {format_timestamp(start)}")
        print(f"  结束: {format_timestamp(end)}")

    print()


def test_message_analysis(messages):
    """测试消息分析"""
    print("=" * 50)
    print("测试 3: 消息分析")
    print("=" * 50)

    if not messages:
        print("没有消息可供分析,使用模拟数据...")

        # 模拟消息数据
        messages = [
            {
                "msg_type": "text",
                "create_time": 1642723200,
                "sender": {"id": "user_1"},
                "body": {"content": "大家看一下 API 文档"},
                "mentions": []
            },
            {
                "msg_type": "text",
                "create_time": 1642723260,
                "sender": {"id": "user_2"},
                "body": {"content": "好的,我来处理 API 性能优化问题"},
                "mentions": []
            },
            {
                "msg_type": "image",
                "create_time": 1642723320,
                "sender": {"id": "user_1"},
                "body": {"content": "截图 https://example.com/screenshot.png"},
                "mentions": []
            },
        ]

    try:
        # 统计分析
        stats = calculate_statistics(messages)
        print(f"\n✓ 统计分析完成:")
        print(f"  - 消息总数: {stats['total_messages']}")
        print(f"  - 参与人数: {stats['unique_users']}")
        print(f"  - 消息类型: {list(stats['msg_type_distribution'].keys())}")

        # 关键词提取
        keywords = extract_keywords(messages, top_n=10)
        print(f"\n✓ 关键词提取完成:")
        for kw in keywords[:5]:
            print(f"  - {kw['keyword']}: {kw['count']} 次")

        return stats, keywords

    except Exception as e:
        print(f"错误: {e}\n")
        return None, None


def test_report_generation():
    """测试报告生成"""
    print("=" * 50)
    print("测试 4: 报告生成")
    print("=" * 50)

    # 模拟数据
    stats = {
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

    keywords = [
        {"keyword": "API", "count": 45},
        {"keyword": "性能优化", "count": 38},
        {"keyword": "上线", "count": 32},
    ]

    topics = [
        {
            "name": "关于'API'的讨论",
            "keyword": "API",
            "message_count": 45,
            "participant_count": 8,
        },
    ]

    action_items = [
        {
            "description": "完成缓存方案设计",
            "mentions": ["张三"],
            "create_time_formatted": "2026-01-21 10:30:00",
        },
    ]

    try:
        report = generate_default_report(
            "测试群",
            stats,
            keywords,
            topics,
            action_items,
        )

        print("\n✓ 报告生成成功!\n")
        print("报告预览 (前 500 字符):")
        print("-" * 50)
        print(report[:500] + "...")
        print("-" * 50)

        # 保存报告
        output_path = "./test_report.md"
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(report)
        print(f"\n✓ 报告已保存到: {output_path}\n")

    except Exception as e:
        print(f"错误: {e}\n")


def main():
    """主测试流程"""
    print("\n" + "=" * 50)
    print("飞书群聊总结 - 功能测试")
    print("=" * 50 + "\n")

    # 测试 1: 搜索群聊
    chat_info = test_search_chats()

    # 测试 2: 时间解析
    test_time_parsing()

    # 测试 3: 消息分析
    stats, keywords = test_message_analysis(None)

    # 测试 4: 报告生成
    test_report_generation()

    print("=" * 50)
    print("测试完成!")
    print("=" * 50 + "\n")


if __name__ == "__main__":
    main()
