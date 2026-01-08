"""Parse claude CLI output into normalized JSON results."""

from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any, Dict, Iterable, List, Optional

from .stream import parse_stream


SESSION_KEYS = ("session_id", "sessionId", "conversation_id", "conversationId")


@dataclass
class ParsedOutput:
    """Structured output ready to be serialized as JSON."""

    ok: bool
    response_text: str
    response_json: Optional[Any]
    response_events: List[Dict[str, Any]]
    session_id: Optional[str]
    raw: str
    stderr: str
    error: Optional[Dict[str, Any]]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "ok": self.ok,
            "response_text": self.response_text,
            "response_json": self.response_json,
            "response_events": self.response_events,
            "session_id": self.session_id,
            "raw": self.raw,
            "stderr": self.stderr,
            "error": self.error,
        }


def parse_output(
    stdout: str,
    stderr: str,
    output_format: str,
    returncode: int,
) -> ParsedOutput:
    """Parse output by format and normalize errors."""
    output_format = (output_format or "").strip().lower()
    if output_format == "stream-json":
        return _parse_stream_json(stdout, stderr, returncode)
    if output_format == "json":
        return _parse_json(stdout, stderr, returncode)
    return _parse_text(stdout, stderr, returncode)


def error_result(message: str, details: Optional[Dict[str, Any]] = None) -> ParsedOutput:
    """Create a consistent error payload for wrapper-level failures."""
    return ParsedOutput(
        ok=False,
        response_text="",
        response_json=None,
        response_events=[],
        session_id=None,
        raw="",
        stderr="",
        error={"type": "wrapper_error", "message": message, "details": details or {}},
    )


def _parse_text(stdout: str, stderr: str, returncode: int) -> ParsedOutput:
    error = None
    ok = True
    if returncode != 0:
        ok = False
        error = {"type": "cli_error", "message": "non-zero exit", "returncode": returncode}
    return ParsedOutput(
        ok=ok,
        response_text=stdout,
        response_json=None,
        response_events=[],
        session_id=None,
        raw=stdout,
        stderr=stderr,
        error=error,
    )


def _parse_json(stdout: str, stderr: str, returncode: int) -> ParsedOutput:
    ok = True
    error = None
    response_json = None
    response_text = ""
    session_id = None
    if returncode != 0:
        ok = False
        error = {"type": "cli_error", "message": "non-zero exit", "returncode": returncode}
    try:
        response_json = json.loads(stdout) if stdout.strip() else None
        response_text = extract_text(response_json)
        session_id = extract_session_id(response_json)
    except json.JSONDecodeError as exc:
        ok = False
        error = {"type": "parse_error", "message": str(exc)}
    return ParsedOutput(
        ok=ok,
        response_text=response_text,
        response_json=response_json,
        response_events=[],
        session_id=session_id,
        raw=stdout,
        stderr=stderr,
        error=error,
    )


def _parse_stream_json(stdout: str, stderr: str, returncode: int) -> ParsedOutput:
    events, parse_errors = parse_stream(stdout)
    response_text = extract_text(events)
    session_id = extract_session_id(events)
    ok = returncode == 0 and not parse_errors
    error = None
    if returncode != 0:
        error = {"type": "cli_error", "message": "non-zero exit", "returncode": returncode}
    elif parse_errors:
        error = {"type": "parse_error", "message": "stream parse errors", "count": parse_errors}
    return ParsedOutput(
        ok=ok,
        response_text=response_text,
        response_json=None,
        response_events=events,
        session_id=session_id,
        raw=stdout,
        stderr=stderr,
        error=error,
    )


def extract_text(payload: Any) -> str:
    """Extract text content from JSON or stream payloads."""
    chunks: List[str] = []
    for text in _walk_text(payload):
        if text:
            chunks.append(text)
    return "".join(chunks)


def _walk_text(payload: Any) -> Iterable[str]:
    if payload is None:
        return []
    if isinstance(payload, str):
        return [payload]
    if isinstance(payload, dict):
        if isinstance(payload.get("text"), str):
            return [payload["text"]]
        if isinstance(payload.get("delta"), dict) and isinstance(payload["delta"].get("text"), str):
            return [payload["delta"]["text"]]
        if isinstance(payload.get("content"), list):
            return _walk_text(payload["content"])
        return []
    if isinstance(payload, list):
        chunks: List[str] = []
        for item in payload:
            chunks.extend(_walk_text(item))
        return chunks
    return []


def extract_session_id(payload: Any) -> Optional[str]:
    """Find a session identifier in JSON objects or stream event lists."""
    return _find_first_key(payload, SESSION_KEYS)


def _find_first_key(payload: Any, keys: Iterable[str]) -> Optional[str]:
    if payload is None:
        return None
    if isinstance(payload, dict):
        for key in keys:
            value = payload.get(key)
            if isinstance(value, str) and value.strip():
                return value.strip()
        for value in payload.values():
            found = _find_first_key(value, keys)
            if found:
                return found
        return None
    if isinstance(payload, list):
        for item in payload:
            found = _find_first_key(item, keys)
            if found:
                return found
        return None
    return None
