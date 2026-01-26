# -*- coding: utf-8 -*-

import json
import time
import urllib.parse
import urllib.request
from datetime import datetime

CNINFO_QUERY_URL = "https://www.cninfo.com.cn/new/hisAnnouncement/query"
CNINFO_PDF_BASE = "https://static.cninfo.com.cn/"

MARKET_MAP = {
    "sz": "szse",
    "sh": "sse",
    "bj": "bse",
    "szse": "szse",
    "sse": "sse",
    "bse": "bse",
    "all": "all",
}


# 规范化市场输入

def normalize_markets(markets_raw: str):
    if not markets_raw:
        return ["szse", "sse", "bse"]
    parts = [p.strip().lower() for p in markets_raw.split(",") if p.strip()]
    out = []
    for p in parts:
        mapped = MARKET_MAP.get(p)
        if not mapped:
            out.append(p)
        elif mapped == "all":
            out.extend(["szse", "sse", "bse"])
        else:
            out.append(mapped)
    seen = set()
    uniq = []
    for m in out:
        if m not in seen:
            seen.add(m)
            uniq.append(m)
    return uniq


# 构建请求头

def build_headers(cookie: str, user_agent: str):
    headers = {
        "Accept": "*/*",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "Origin": "https://www.cninfo.com.cn",
        "Referer": "https://www.cninfo.com.cn/new/commonUrl/pageOfSearch?url=disclosure/list/search&lastPage=index",
        "X-Requested-With": "XMLHttpRequest",
        "User-Agent": user_agent,
    }
    if cookie:
        headers["Cookie"] = cookie
    return headers


# 发起查询请求

def post_query(params: dict, headers: dict, timeout: int):
    data = urllib.parse.urlencode(params).encode("utf-8")
    req = urllib.request.Request(CNINFO_QUERY_URL, data=data, headers=headers, method="POST")
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        raw = resp.read()
    try:
        return json.loads(raw.decode("utf-8"))
    except json.JSONDecodeError:
        return json.loads(raw)


# 拉取公告列表（支持分页）

def fetch_announcements(date_range: str, keyword: str, market: str, page_size: int, max_pages: int, headers: dict, timeout: int, server_search: bool):
    items = []
    errors = []
    for page_num in range(1, max_pages + 1):
        params = {
            "pageNum": page_num,
            "pageSize": page_size,
            "column": market,
            "tabName": "fulltext",
            "plate": "",
            "stock": "",
            "searchkey": keyword if server_search else "",
            "secid": "",
            "category": "",
            "trade": "",
            "seDate": date_range,
            "sortName": "",
            "sortType": "",
            "isHLtitle": "true",
        }
        try:
            data = post_query(params, headers, timeout)
        except Exception as exc:
            errors.append(f"query_failed[{market}][page={page_num}]: {exc}")
            break

        announcements = data.get("announcements") or data.get("announcement") or []
        if not announcements:
            break

        items.extend(announcements)

        if len(announcements) < page_size:
            break

        time.sleep(0.2)

    return items, errors


# 生成 PDF 链接

def build_pdf_url(adjunct_url: str, announcement_id: str):
    if adjunct_url:
        if adjunct_url.startswith("http://") or adjunct_url.startswith("https://"):
            return adjunct_url
        return CNINFO_PDF_BASE + adjunct_url.lstrip("/")
    if announcement_id:
        return CNINFO_PDF_BASE + f"finalpage/{announcement_id}.PDF"
    return ""


# 下载 PDF 到指定目录

def download_pdf(pdf_url: str, out_dir, filename: str, timeout: int):
    if not pdf_url:
        return ""
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / filename
    req = urllib.request.Request(pdf_url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=timeout) as resp, open(out_path, "wb") as f:
        f.write(resp.read())
    return str(out_path)


# 解析发布时间

def format_publish_time(raw):
    if raw is None:
        return ""
    if isinstance(raw, (int, float)):
        ts = int(raw)
        if ts > 10_000_000_000:
            ts = ts // 1000
        try:
            return datetime.fromtimestamp(ts).strftime("%Y-%m-%d %H:%M:%S")
        except Exception:
            return str(raw)
    return str(raw)


# 公告去重

def dedupe_announcements(items):
    uniq = {}
    for a in items:
        aid = str(a.get("announcementId", "")) if a.get("announcementId") is not None else ""
        if aid:
            if aid not in uniq:
                uniq[aid] = a
            continue
        key = (
            str(a.get("secCode", "")),
            str(a.get("announcementTitle", "")),
            str(a.get("adjunctUrl", "")),
            str(a.get("announcementTime", "")),
        )
        if key not in uniq:
            uniq[key] = a
    return list(uniq.values())
