# -*- coding: utf-8 -*-

import shutil
import subprocess


# 检查 pdftotext 是否可用

def has_pdftotext():
    return shutil.which("pdftotext") is not None


# 使用 pdftotext 提取文本

def extract_text_pdftotext(pdf_path: str):
    if not has_pdftotext():
        return None
    try:
        result = subprocess.run(
            ["pdftotext", "-layout", "-enc", "UTF-8", pdf_path, "-"],
            check=False,
            capture_output=True,
            text=True,
        )
    except Exception:
        return None
    if result.returncode != 0:
        return None
    return result.stdout or ""


# 文本关键词匹配

def match_keywords_in_text(text: str, keywords, match_mode: str):
    if not keywords:
        return True
    hits = [(k in text) for k in keywords]
    if match_mode == "all":
        return all(hits)
    return any(hits)


# PDF 关键词匹配（必须使用 pdftotext）

def pdf_contains_keywords(pdf_path: str, keywords, match_mode: str):
    if not keywords:
        return True
    text = extract_text_pdftotext(pdf_path)
    if text is None:
        raise RuntimeError("pdftotext_not_found")
    return match_keywords_in_text(text, keywords, match_mode)
