"""Shared helpers for input normalization and lightweight validation."""

from __future__ import annotations

from typing import Iterable, List, Optional


TRUE_SET = {"1", "true", "yes", "on"}
FALSE_SET = {"0", "false", "no", "off"}


def to_bool(value: object, default: bool = False) -> bool:
    """Coerce common JSON-ish values into a bool with a safe default."""
    if value is None:
        return default
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        lowered = value.strip().lower()
        if lowered in TRUE_SET:
            return True
        if lowered in FALSE_SET:
            return False
    return bool(value)


def to_str(value: object) -> Optional[str]:
    """Return a trimmed string or None if the value is empty/None."""
    if value is None:
        return None
    if isinstance(value, str):
        trimmed = value.strip()
        return trimmed if trimmed else None
    return str(value)


def normalize_list(value: object) -> List[str]:
    """Normalize a JSON field that may be a string or list into a list of strings."""
    if value is None:
        return []
    if isinstance(value, list):
        return [str(item) for item in value if item is not None]
    if isinstance(value, tuple):
        return [str(item) for item in value if item is not None]
    if isinstance(value, str):
        trimmed = value.strip()
        return [trimmed] if trimmed else []
    return [str(value)]


def join_lines(lines: Iterable[str]) -> str:
    """Join lines with a trailing newline to preserve stream boundaries."""
    return "\n".join(lines)
