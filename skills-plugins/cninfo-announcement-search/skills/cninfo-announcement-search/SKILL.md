---
name: cninfo-announcement-search
description: 在巨潮资讯网按日期（今天/昨天/明天或指定日期）和关键词检索深/沪/京公告，结构化返回代码、简称、标题、公告链接，并可下载 PDF 到 /tmp/cninfo-announcement-search/<date>/ 后进行关键词匹配；当需要自动化查询公告并输出结构化结果时使用。
---

# CNINFO Announcement Search

## 概览

该技能用于：
- 按日期（今天/昨天/明天/指定日期）查询巨潮资讯网公告。
- 按标题关键词过滤公告。
- 可选下载 PDF 并在 PDF 内容中做关键词匹配（无三方依赖，尽力而为）。

## 依赖

- Python 3（仅标准库，无第三方依赖）
- 必需：`pdftotext`（PDF 关键词匹配默认必须使用，见 `scripts/dependencies.txt`）

## 脚本用法

注意：
- 不要在技能目录里执行，建议在工作/仓库目录下运行。
- PDF 下载到 `/tmp/cninfo-announcement-search/<date>/`，路径会回写到结构化结果中。

```bash
# 今日公告（深/沪/京），标题包含“回购”，且 PDF 内容也包含“回购”
python3 skills-plugins/cninfo-announcement-search/skills/cninfo-announcement-search/scripts/cninfo_announcement_search.py \
  --when today \
  --title-keywords 回购 \
  --pdf-keywords 回购 \
  --markets sz,sh,bj

# 指定日期，只查深交所，返回 JSON 到文件（自动拉全分页）
python3 skills-plugins/cninfo-announcement-search/skills/cninfo-announcement-search/scripts/cninfo_announcement_search.py \
  --date 2026-01-26 \
  --title-keywords 重大事项 \
  --markets sz \
  --out ./cninfo_2026-01-26.json

# 日期范围查询（仍按公告日期分别落盘 PDF）
python3 skills-plugins/cninfo-announcement-search/skills/cninfo-announcement-search/scripts/cninfo_announcement_search.py \
  --start-date 2026-01-01 \
  --end-date 2026-01-31 \
  --title-keywords 股票激励,回购 \
  --markets sz,sh,bj

# 并发分页加速（默认 6 并发，可省略 --page-workers），并保持 200ms 节奏
python3 skills-plugins/cninfo-announcement-search/skills/cninfo-announcement-search/scripts/cninfo_announcement_search.py \
  --date 2026-01-26 \
  --title-keywords 股票激励 \
  --markets sz,sh,bj \
  --page-workers 6 \
  --page-sleep 0.2

# 使用服务端 searchkey 过滤（可选；如结果为空建议关闭）
python3 skills-plugins/cninfo-announcement-search/skills/cninfo-announcement-search/scripts/cninfo_announcement_search.py \
  --date 2026-01-26 \
  --title-keywords 股票激励 \
  --server-search \
  --markets sh
```

## 关键词 JSON 输入

支持从 JSON 文件读取多个关键词与匹配模式。
当未传入 `--keywords-json` 且未提供关键词参数时，默认读取同级 `keywords.json` 作为兜底配置。
如需修改默认关键词，直接编辑 `skills-plugins/cninfo-announcement-search/skills/cninfo-announcement-search/keywords.json`。

示例（推荐格式）：

```json
{
  "title": {
    "keywords": ["股票激励", "回购"],
    "match": "any"
  },
  "pdf": {
    "keywords": ["激励对象", "授予"],
    "match": "all"
  }
}
```

兼容格式：

```json
{
  "title_keywords": ["股票激励", "回购"],
  "pdf_keywords": ["激励对象", "授予"],
  "title_match": "any",
  "pdf_match": "all"
}
```

使用方式：

```bash
python3 skills-plugins/cninfo-announcement-search/skills/cninfo-announcement-search/scripts/cninfo_announcement_search.py \
  --date 2026-01-26 \
  --keywords-json ./keywords.json \
  --markets sz,sh,bj
```

## 输出字段（核心）

- `secCode`: 证券代码
- `secName`: 证券简称
- `announcementTitle`: 公告标题
- `announcementId`: 公告 ID
- `pdfUrl`: PDF 链接
- `pdfLocalPath`: 本地 PDF 路径（若已下载）
- `titleMatch`: 标题是否命中关键词
- `pdfMatch`: PDF 是否命中关键词（尽力而为）

## 限制与注意事项

- PDF 关键词匹配为“无依赖的最佳努力”：对压缩流/编码文本仅做基础解码，可能存在漏检。
- 若需更高准确度，可在你本地安装 `pdftotext` 等工具后，再扩展脚本逻辑。
- 如果接口策略变化，需更新请求参数或请求头。
- 分页默认自动拉全（`--max-pages <= 0`）。如需限流/加速，可显式指定 `--max-pages`。
- 可用 `--page-workers` 并发拉取分页（默认 6），`--page-sleep` 控制每页请求前的间隔，避免触发限流。
- 若提供 PDF 关键词将自动下载 PDF；如需无关键词也下载，可用 `--download-pdf`。
- 日期范围会按公告日期分目录下载到 `/tmp/cninfo-announcement-search/<date>/`。
- 默认并发下载/解析为 6，可用 `--workers` 调整。
- 已下载的 PDF 会复用本地文件，不重复下载。
