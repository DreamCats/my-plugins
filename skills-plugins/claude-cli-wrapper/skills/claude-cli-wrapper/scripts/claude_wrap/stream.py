"""Parse stream-json output from the claude CLI."""

from __future__ import annotations

import json
from typing import Any, Dict, List, Tuple


def parse_stream(raw: str) -> Tuple[List[Dict[str, Any]], int]:
    """Parse newline-delimited JSON events from stdout."""
    events: List[Dict[str, Any]] = []
    errors = 0
    for line in raw.splitlines():
        if not line.strip():
            continue
        try:
            event = json.loads(line)
        except json.JSONDecodeError:
            errors += 1
            continue
        if isinstance(event, dict):
            events.append(event)
        else:
            errors += 1
    return events, errors
