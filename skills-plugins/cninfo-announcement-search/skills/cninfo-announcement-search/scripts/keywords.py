# -*- coding: utf-8 -*-

import json


# 拆分关键词字符串

def split_keywords(text: str):
    if not text:
        return []
    text = text.replace("，", ",").replace(";", ",")
    parts = [p.strip() for p in text.split(",")]
    return [p for p in parts if p]


# 规范化关键词列表

def normalize_keywords(value):
    if value is None:
        return []
    if isinstance(value, list):
        out = []
        for v in value:
            if v is None:
                continue
            s = str(v).strip()
            if s:
                out.append(s)
        return out
    if isinstance(value, str):
        return split_keywords(value)
    return [str(value).strip()]


# 读取关键词 JSON

def load_keywords_json(path: str):
    if not path:
        return {
            "title_keywords": [],
            "pdf_keywords": [],
            "title_match": "any",
            "pdf_match": "any",
        }
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    title_keywords = []
    pdf_keywords = []
    title_match = "any"
    pdf_match = "any"

    if isinstance(data, dict):
        if "title" in data or "pdf" in data:
            title = data.get("title") or {}
            pdf = data.get("pdf") or {}
            title_keywords = normalize_keywords(title.get("keywords"))
            pdf_keywords = normalize_keywords(pdf.get("keywords"))
            title_match = str(title.get("match", "any")).lower()
            pdf_match = str(pdf.get("match", "any")).lower()
        else:
            title_keywords = normalize_keywords(data.get("title_keywords"))
            pdf_keywords = normalize_keywords(data.get("pdf_keywords"))
            title_match = str(data.get("title_match", "any")).lower()
            pdf_match = str(data.get("pdf_match", "any")).lower()

    return {
        "title_keywords": title_keywords,
        "pdf_keywords": pdf_keywords,
        "title_match": title_match if title_match in ("any", "all") else "any",
        "pdf_match": pdf_match if pdf_match in ("any", "all") else "any",
    }
