"""Load JSON or NDJSON requests for the wrapper."""

from __future__ import annotations

import json
import sys
from dataclasses import dataclass
from typing import Any, Dict, List, Optional


@dataclass(frozen=True)
class InputPayload:
    """Represents parsed requests with a hint about the original format."""

    requests: List[Dict[str, Any]]
    is_ndjson: bool


def _load_text_from_stdin() -> str:
    """Read all stdin content; return empty string when stdin is a TTY."""
    if sys.stdin.isatty():
        return ""
    return sys.stdin.read()


def load_requests(path: Optional[str]) -> InputPayload:
    """Load input JSON from a file path or stdin."""
    if path:
        with open(path, "r", encoding="utf-8") as handle:
            raw = handle.read()
    else:
        raw = _load_text_from_stdin()
    if not raw.strip():
        raise ValueError("no input provided; use --input or pipe JSON into stdin")
    return parse_payload(raw)


def parse_payload(raw: str) -> InputPayload:
    """Parse JSON or NDJSON into a list of request objects."""
    stripped = raw.lstrip("\ufeff").strip()
    try:
        parsed = json.loads(stripped)
        if isinstance(parsed, list):
            requests = [item for item in parsed if item is not None]
            return InputPayload(requests=requests, is_ndjson=False)
        if isinstance(parsed, dict):
            return InputPayload(requests=[parsed], is_ndjson=False)
        raise ValueError("input JSON must be an object or list of objects")
    except json.JSONDecodeError:
        lines = [line for line in stripped.splitlines() if line.strip()]
        requests: List[Dict[str, Any]] = []
        for index, line in enumerate(lines, start=1):
            try:
                parsed_line = json.loads(line)
            except json.JSONDecodeError as exc:
                raise ValueError(f"invalid NDJSON at line {index}: {exc}") from exc
            if not isinstance(parsed_line, dict):
                raise ValueError(f"NDJSON line {index} must be an object")
            requests.append(parsed_line)
        if not requests:
            raise ValueError("no valid NDJSON objects found")
        return InputPayload(requests=requests, is_ndjson=True)
