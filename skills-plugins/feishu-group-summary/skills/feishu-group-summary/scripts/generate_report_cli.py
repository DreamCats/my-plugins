#!/usr/bin/env python3
"""
生成飞书群聊总结报告 (命令行接口)
"""
import argparse
import json
import sys

from report_generator import generate_report, save_report


def main():
    parser = argparse.ArgumentParser(
        description="生成飞书群聊总结报告",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
  %(prog)s --chat-name "项目群" --statistics analysis.json --output report.md
  %(prog)s --chat-name "项目群" --statistics analysis.json --analysis llm_analysis.json --output report.md
  %(prog)s --template report_template.md --chat-name "项目群" --statistics analysis.json --output report.md
        """
    )

    parser.add_argument(
        "--chat-name",
        required=True,
        help="群聊名称"
    )

    parser.add_argument(
        "--statistics",
        required=True,
        help="统计分析 JSON 文件路径 (由 analyze_messages_cli.py 生成)"
    )

    parser.add_argument(
        "--analysis",
        help="LLM 分析结果 JSON 文件路径 (可选)"
    )

    parser.add_argument(
        "--template",
        help="报告模板文件路径 (可选)"
    )

    parser.add_argument(
        "--output",
        "-o",
        required=True,
        help="输出 Markdown 文件路径"
    )

    args = parser.parse_args()

    # 读取统计数据
    print(f"正在读取统计数据: {args.statistics}", file=sys.stderr)
    with open(args.statistics, "r", encoding="utf-8") as f:
        analysis_data = json.load(f)

    statistics = analysis_data.get("statistics", {})
    keywords = analysis_data.get("keywords", [])
    discussion_topics = analysis_data.get("discussion_topics", [])
    action_items = analysis_data.get("action_items", [])

    print(f"  ✓ 消息总数: {statistics.get('total_messages', 0)}", file=sys.stderr)
    print(f"  ✓ 关键词: {len(keywords)} 个", file=sys.stderr)
    print(f"  ✓ 讨论主题: {len(discussion_topics)} 个", file=sys.stderr)
    print(f"  ✓ 行动项: {len(action_items)} 个", file=sys.stderr)

    # 读取 LLM 分析结果 (如果提供)
    llm_analysis = None
    if args.analysis:
        print(f"正在读取 LLM 分析: {args.analysis}", file=sys.stderr)
        with open(args.analysis, "r", encoding="utf-8") as f:
            llm_analysis = json.load(f)
        print(f"  ✓ LLM 主题: {len(llm_analysis.get('topics', []))} 个", file=sys.stderr)

    # 生成报告
    print("正在生成报告...", file=sys.stderr)
    report = generate_report(
        chat_name=args.chat_name,
        statistics=statistics,
        keywords=keywords,
        discussion_topics=discussion_topics,
        action_items=action_items,
        analysis_result=llm_analysis,
        template_path=args.template,
    )

    # 保存报告
    save_report(report, args.output)

    print(f"✓ 报告生成完成!", file=sys.stderr)


if __name__ == "__main__":
    main()
