"""Request and option parsing for the wrapper."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from .utils import normalize_list, to_bool, to_str


@dataclass(frozen=True)
class RequestOptions:
    """Normalized CLI options for a single Claude invocation."""

    model: Optional[str] = None
    max_turns: Optional[int] = None
    append_system_prompt: Optional[str] = None
    system_prompt: Optional[str] = None
    system_prompt_file: Optional[str] = None
    add_dir: List[str] = field(default_factory=list)
    continue_session: bool = False
    resume: Optional[str] = None
    allowed_tools: List[str] = field(default_factory=list)
    permission_mode: Optional[str] = None
    permission_prompt_tool: Optional[str] = None
    output_format: str = "json"
    include_partial_messages: bool = False
    dangerously_skip_permissions: bool = False

    @classmethod
    def from_dict(cls, data: Optional[Dict[str, Any]]) -> "RequestOptions":
        """Parse the options block from input JSON into normalized fields."""
        data = data or {}
        max_turns = data.get("max_turns")
        max_turns_value = int(max_turns) if max_turns is not None else None
        return cls(
            model=to_str(data.get("model")),
            max_turns=max_turns_value,
            append_system_prompt=to_str(data.get("append_system_prompt")),
            system_prompt=to_str(data.get("system_prompt")),
            system_prompt_file=to_str(data.get("system_prompt_file")),
            add_dir=normalize_list(data.get("add_dir")),
            continue_session=to_bool(data.get("continue"), default=False),
            resume=to_str(data.get("resume")),
            allowed_tools=normalize_list(data.get("allowed_tools")),
            permission_mode=to_str(data.get("permission_mode")),
            permission_prompt_tool=to_str(data.get("permission_prompt_tool")),
            output_format=to_str(data.get("output_format")) or "json",
            include_partial_messages=to_bool(data.get("include_partial_messages"), default=False),
            dangerously_skip_permissions=to_bool(
                data.get("dangerously_skip_permissions"), default=False
            ),
        )

    def validate(self) -> None:
        """Validate option combinations that the CLI treats as mutually exclusive."""
        if self.system_prompt and self.system_prompt_file:
            raise ValueError("system_prompt and system_prompt_file are mutually exclusive")


@dataclass(frozen=True)
class Request:
    """Normalized wrapper request."""

    prompt: Optional[str]
    stdin: Optional[str]
    options: RequestOptions

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "Request":
        """Normalize request fields from input JSON."""
        if not isinstance(data, dict):
            raise ValueError("request payload must be a JSON object")
        options = RequestOptions.from_dict(data.get("options"))
        options.validate()
        prompt = to_str(data.get("prompt"))
        stdin = data.get("stdin")
        stdin_value = None if stdin is None else str(stdin)
        if not prompt and not options.continue_session and not options.resume:
            raise ValueError("prompt is required unless continue or resume is set")
        return cls(prompt=prompt, stdin=stdin_value, options=options)
