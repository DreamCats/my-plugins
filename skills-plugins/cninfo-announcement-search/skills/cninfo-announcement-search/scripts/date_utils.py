# -*- coding: utf-8 -*-

import datetime as _dt


# 解析相对/绝对日期

def parse_when_or_date(when: str, date_str: str) -> str:
    if date_str:
        return date_str
    base = _dt.date.today()
    if when == "today":
        d = base
    elif when == "yesterday":
        d = base - _dt.timedelta(days=1)
    elif when == "tomorrow":
        d = base + _dt.timedelta(days=1)
    else:
        d = base
    return d.strftime("%Y-%m-%d")


# 构建日期范围

def resolve_date_range(when: str, date_str: str, start_date: str, end_date: str):
    if start_date and end_date:
        return start_date, end_date
    if start_date and not end_date:
        return start_date, start_date
    if end_date and not start_date:
        return end_date, end_date
    single = parse_when_or_date(when, date_str)
    return single, single


# 判定公告日期是否落在范围内

def in_date_range(date_str: str, start_date: str, end_date: str):
    try:
        d = _dt.datetime.strptime(date_str, "%Y-%m-%d").date()
        s = _dt.datetime.strptime(start_date, "%Y-%m-%d").date()
        e = _dt.datetime.strptime(end_date, "%Y-%m-%d").date()
    except Exception:
        return False
    return s <= d <= e
