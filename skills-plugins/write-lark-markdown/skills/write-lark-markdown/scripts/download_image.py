#!/usr/bin/env python3

import argparse
import os
import sys
import time
import urllib.parse
import urllib.request


def guess_name(url: str) -> str:
    parsed = urllib.parse.urlparse(url)
    base = os.path.basename(parsed.path)
    if base:
        return base
    return f"ai-image-{int(time.time())}.jpeg"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", required=True)
    parser.add_argument("--doc-dir", default=".")
    parser.add_argument("--assets-dir", default="assets")
    parser.add_argument("--name")
    args = parser.parse_args()

    url = args.url.strip()
    if not url:
        print("error: empty --url", file=sys.stderr)
        return 2

    name = (args.name or guess_name(url)).strip()
    if not name:
        print("error: empty output name", file=sys.stderr)
        return 2

    doc_dir = os.path.abspath(args.doc_dir)
    assets_dir = os.path.join(doc_dir, args.assets_dir)
    os.makedirs(assets_dir, exist_ok=True)

    abs_path = os.path.join(assets_dir, name)

    req = urllib.request.Request(url, headers={"User-Agent": "curl/8"})
    with urllib.request.urlopen(req) as resp:
        data = resp.read()

    with open(abs_path, "wb") as f:
        f.write(data)

    rel_path = os.path.join("./", args.assets_dir, name).replace("\\", "/")

    print(f"saved: {abs_path}")
    print(f"markdown: ![Executive visual]({rel_path})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
