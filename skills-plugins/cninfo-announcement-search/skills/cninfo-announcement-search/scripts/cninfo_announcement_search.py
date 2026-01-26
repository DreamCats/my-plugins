#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import argparse
import os
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

from cninfo_client import (
    build_headers,
    build_pdf_url,
    dedupe_announcements,
    download_pdf,
    fetch_announcements,
    format_publish_time,
    normalize_markets,
)
from date_utils import parse_when_or_date, resolve_date_range, in_date_range
from keywords import load_keywords_json, normalize_keywords, split_keywords
from pdf_search import has_pdftotext, pdf_contains_keywords

DEFAULT_DOWNLOAD_ROOT = "/tmp/cninfo-announcement-search"
DEFAULT_KEYWORDS_JSON = Path(__file__).resolve().parent.parent / "keywords.json"
DEFAULT_WORKERS = 6


# 标题关键词匹配

def title_match(title: str, keywords, match_mode: str):
    if not keywords:
        return True
    hits = [(k in title) for k in keywords]
    if match_mode == "all":
        return all(hits)
    return any(hits)


# 下载并匹配 PDF

def process_pdf_item(item, publish_date: str, pdf_keywords, pdf_match_mode: str, download_root: str, timeout: int):
    announcement_id = str(item.get("announcementId", ""))
    adjunct_url = item.get("adjunctUrl", "")
    pdf_url = build_pdf_url(adjunct_url, announcement_id)
    if not pdf_url:
        return ("", "", None, f"pdf_url_empty[{announcement_id}]")

    out_dir = Path(download_root) / publish_date
    filename = os.path.basename(adjunct_url) if adjunct_url else f"{announcement_id}.PDF"
    if not filename.lower().endswith(".pdf"):
        filename = f"{filename}.PDF"

    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / filename
    try:
        if out_path.exists() and out_path.stat().st_size > 0:
            pdf_local_path = str(out_path)
        else:
            pdf_local_path = download_pdf(pdf_url, out_dir, filename, timeout)
        pdf_match = pdf_contains_keywords(pdf_local_path, pdf_keywords, pdf_match_mode)
        return (pdf_url, pdf_local_path, pdf_match, None)
    except Exception as exc:
        return (pdf_url, "", False, f"pdf_failed[{announcement_id}]: {exc}")


# 构建结构化结果

def build_result_items(raw_items, start_date: str, end_date: str, title_keywords, title_match_mode: str, pdf_keywords, pdf_match_mode: str, download_root: str, timeout: int, download_pdf: bool, workers: int):
    results = []
    errors = []

    filtered = []
    for a in raw_items:
        publish_time = format_publish_time(a.get("announcementTime") or a.get("publishTime"))
        publish_date = publish_time.split(" ")[0] if publish_time else ""
        if publish_date and not in_date_range(publish_date, start_date, end_date):
            continue

        title = a.get("announcementTitle", "")
        if not title_match(title, title_keywords, title_match_mode):
            continue

        filtered.append((a, publish_date or start_date, publish_time))

    if download_pdf:
        with ThreadPoolExecutor(max_workers=workers) as executor:
            futures = {}
            for item, publish_date, publish_time in filtered:
                futures[executor.submit(
                    process_pdf_item,
                    item,
                    publish_date,
                    pdf_keywords,
                    pdf_match_mode,
                    download_root,
                    timeout,
                )] = (item, publish_date, publish_time)

            for fut in as_completed(futures):
                item, publish_date, publish_time = futures[fut]
                pdf_url, pdf_local_path, pdf_match, err = fut.result()
                if err:
                    errors.append(err)

                results.append({
                    "secCode": item.get("secCode") or item.get("secid") or "",
                    "secName": item.get("secName") or item.get("secname") or "",
                    "announcementTitle": item.get("announcementTitle", ""),
                    "announcementId": str(item.get("announcementId", "")),
                    "publishTime": publish_time,
                    "pdfUrl": pdf_url,
                    "pdfLocalPath": pdf_local_path,
                    "titleMatch": True,
                    "pdfMatch": pdf_match,
                })
    else:
        for item, publish_date, publish_time in filtered:
            results.append({
                "secCode": item.get("secCode") or item.get("secid") or "",
                "secName": item.get("secName") or item.get("secname") or "",
                "announcementTitle": item.get("announcementTitle", ""),
                "announcementId": str(item.get("announcementId", "")),
                "publishTime": publish_time,
                "pdfUrl": build_pdf_url(item.get("adjunctUrl", ""), str(item.get("announcementId", ""))),
                "pdfLocalPath": "",
                "titleMatch": True,
                "pdfMatch": None,
            })

    return results, errors


# 解析关键词配置

def resolve_keywords(args):
    keywords_path = args.keywords_json
    if not keywords_path and DEFAULT_KEYWORDS_JSON.exists():
        keywords_path = str(DEFAULT_KEYWORDS_JSON)
    cfg = load_keywords_json(keywords_path)

    title_keywords = cfg.get("title_keywords", [])
    pdf_keywords = cfg.get("pdf_keywords", [])
    title_match_mode = cfg.get("title_match", "any")
    pdf_match_mode = cfg.get("pdf_match", "any")

    if args.title_keywords:
        title_keywords = normalize_keywords(args.title_keywords)
    if args.pdf_keywords:
        pdf_keywords = normalize_keywords(args.pdf_keywords)

    if args.keyword:
        if not args.title_keywords:
            title_keywords = split_keywords(args.keyword)
        if not args.pdf_keywords:
            pdf_keywords = split_keywords(args.keyword)

    if args.title_match:
        title_match_mode = args.title_match
    if args.pdf_match:
        pdf_match_mode = args.pdf_match

    return title_keywords, pdf_keywords, title_match_mode, pdf_match_mode


# 输出 JSON（UTF-8）

def json_dumps(obj):
    import json
    return json.dumps(obj, ensure_ascii=False, indent=2)


def main():
    parser = argparse.ArgumentParser(description="Search CNINFO announcements by date/keyword with optional PDF matching.")
    parser.add_argument("--when", choices=["today", "yesterday", "tomorrow"], default="today", help="Relative date.")
    parser.add_argument("--date", default="", help="Absolute date: YYYY-MM-DD. Overrides --when.")
    parser.add_argument("--start-date", default="", help="Range start date: YYYY-MM-DD.")
    parser.add_argument("--end-date", default="", help="Range end date: YYYY-MM-DD.")
    parser.add_argument("--keyword", default="", help="Keyword used for both title and PDF search.")
    parser.add_argument("--keywords-json", default="", help="Path to keywords JSON config.")
    parser.add_argument("--title-keywords", "--title-keyword", default="", help="Comma-separated title keywords.")
    parser.add_argument("--pdf-keywords", "--pdf-keyword", default="", help="Comma-separated PDF keywords.")
    parser.add_argument("--title-match", choices=["any", "all"], default=None, help="Title keyword match mode.")
    parser.add_argument("--pdf-match", choices=["any", "all"], default=None, help="PDF keyword match mode.")
    parser.add_argument("--markets", default="sz,sh,bj", help="Comma-separated markets: sz,sh,bj,szse,sse,bse,all")
    parser.add_argument("--page-size", type=int, default=30, help="Page size for query.")
    parser.add_argument("--max-pages", type=int, default=1, help="Max pages to query per market.")
    parser.add_argument("--download-root", default=DEFAULT_DOWNLOAD_ROOT, help="PDF download root directory.")
    parser.add_argument("--timeout", type=int, default=20, help="Timeout seconds.")
    parser.add_argument("--cookie", default="", help="Optional cookie for cninfo requests.")
    parser.add_argument("--user-agent", default="Mozilla/5.0", help="User-Agent header.")
    parser.add_argument("--skip-pdf", action="store_true", help="Skip PDF download and content search.")
    parser.add_argument("--download-pdf", action="store_true", help="Download PDF even without PDF keywords.")
    parser.add_argument("--server-search", action="store_true", help="Send keyword to server searchkey for server-side filtering.")
    parser.add_argument("--workers", type=int, default=DEFAULT_WORKERS, help="Concurrent download/parse workers.")
    parser.add_argument("--out", default="", help="Write JSON output to file.")

    args = parser.parse_args()

    date_str = parse_when_or_date(args.when, args.date)
    start_date, end_date = resolve_date_range(args.when, args.date, args.start_date, args.end_date)
    title_keywords, pdf_keywords, title_match_mode, pdf_match_mode = resolve_keywords(args)
    markets = normalize_markets(args.markets)

    headers = build_headers(args.cookie, args.user_agent)

    all_items = []
    errors = []

    server_search_keyword = " ".join(title_keywords) if title_keywords else ""
    date_range = f"{start_date}~{end_date}"

    for market in markets:
        raw_items, errs = fetch_announcements(
            date_range=date_range,
            keyword=server_search_keyword,
            market=market,
            page_size=args.page_size,
            max_pages=args.max_pages,
            headers=headers,
            timeout=args.timeout,
            server_search=args.server_search,
        )
        errors.extend(errs)
        all_items.extend(raw_items)

    all_items = dedupe_announcements(all_items)

    if pdf_keywords and args.skip_pdf:
        errors.append("pdf_keywords_provided_but_skip_pdf=true")

    download_pdf_flag = (not args.skip_pdf) and (args.download_pdf or bool(pdf_keywords))
    if download_pdf_flag and not has_pdftotext():
        output = {
            "date": date_str,
            "startDate": start_date,
            "endDate": end_date,
            "titleKeywords": title_keywords,
            "pdfKeywords": pdf_keywords,
            "titleMatchMode": title_match_mode,
            "pdfMatchMode": pdf_match_mode,
            "markets": markets,
            "count": 0,
            "items": [],
            "errors": [
                "pdftotext_not_found: 安装方式 - macOS: brew install poppler; Linux: apt/yum/pacman 安装 poppler-utils"
            ],
        }
        print(json_dumps(output))
        sys.exit(2)

    results, pdf_errors = build_result_items(
        raw_items=all_items,
        start_date=start_date,
        end_date=end_date,
        title_keywords=title_keywords,
        title_match_mode=title_match_mode,
        pdf_keywords=pdf_keywords,
        pdf_match_mode=pdf_match_mode,
        download_root=args.download_root,
        timeout=args.timeout,
        download_pdf=download_pdf_flag,
        workers=args.workers,
    )
    errors.extend(pdf_errors)

    if pdf_keywords and download_pdf_flag:
        results = [r for r in results if r.get("pdfMatch")]

    output = {
        "date": date_str,
        "startDate": start_date,
        "endDate": end_date,
        "titleKeywords": title_keywords,
        "pdfKeywords": pdf_keywords,
        "titleMatchMode": title_match_mode,
        "pdfMatchMode": pdf_match_mode,
        "markets": markets,
        "count": len(results),
        "items": results,
        "errors": errors,
    }

    text = json_dumps(output)

    if args.out:
        Path(args.out).write_text(text, encoding="utf-8")

    print(text)


if __name__ == "__main__":
    main()
