"""Build the claude CLI command from normalized options."""

from __future__ import annotations

from typing import List, Optional

from .options import RequestOptions


def build_command(
    claude_bin: str,
    prompt: Optional[str],
    options: RequestOptions,
) -> List[str]:
    """Translate request options into a claude CLI argument list."""
    command: List[str] = [claude_bin, "-p"]

    if options.continue_session:
        command.append("--continue")
    if options.resume:
        command.extend(["--resume", options.resume])

    if options.model:
        command.extend(["--model", options.model])
    if options.max_turns is not None:
        command.extend(["--max-turns", str(options.max_turns)])

    if options.system_prompt:
        command.extend(["--system-prompt", options.system_prompt])
    if options.system_prompt_file:
        command.extend(["--system-prompt-file", options.system_prompt_file])
    if options.append_system_prompt:
        command.extend(["--append-system-prompt", options.append_system_prompt])

    for path in options.add_dir:
        command.extend(["--add-dir", path])
    for tool in options.allowed_tools:
        command.extend(["--allowedTools", tool])

    if options.permission_mode:
        command.extend(["--permission-mode", options.permission_mode])
    if options.permission_prompt_tool:
        command.extend(["--permission-prompt-tool", options.permission_prompt_tool])
    if options.dangerously_skip_permissions:
        command.append("--dangerously-skip-permissions")

    if options.output_format:
        command.extend(["--output-format", options.output_format])
        if options.output_format.strip().lower() == "stream-json":
            # Claude CLI requires --verbose for stream-json in print mode.
            command.append("--verbose")
    if options.include_partial_messages:
        command.append("--include-partial-messages")

    if prompt:
        command.append(prompt)

    return command
