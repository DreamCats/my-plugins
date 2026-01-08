"""Non-interactive JSON wrapper around the local claude CLI."""

from __future__ import annotations

import argparse
import json
import sys
from typing import Any, Dict, Optional

from claude_wrap import command, input_loader, options, output, runner


def parse_args() -> argparse.Namespace:
    """Parse CLI arguments for the wrapper entrypoint."""
    parser = argparse.ArgumentParser(description="JSON wrapper for the local claude CLI")
    parser.add_argument(
        "--input",
        help="Path to a JSON/NDJSON request file (defaults to stdin)",
    )
    parser.add_argument(
        "--claude-bin",
        default="claude",
        help="Path to the claude CLI binary (default: claude)",
    )
    parser.add_argument(
        "--timeout-seconds",
        type=float,
        default=None,
        help="Optional timeout for each request (seconds)",
    )
    return parser.parse_args()


def process_request(
    payload: Dict[str, Any],
    claude_bin: str,
    timeout_seconds: Optional[float],
) -> Dict[str, Any]:
    """Handle one JSON request payload and return the normalized result."""
    try:
        request = options.Request.from_dict(payload)
    except ValueError as exc:
        return output.error_result(str(exc), {"stage": "input_validation"}).to_dict()

    cli_command = command.build_command(claude_bin, request.prompt, request.options)
    run_result = runner.run_command(cli_command, request.stdin, timeout_seconds)
    parsed = output.parse_output(
        run_result.stdout,
        run_result.stderr,
        request.options.output_format,
        run_result.returncode,
    )

    if run_result.error:
        parsed.ok = False
        parsed.error = {
            "type": "runner_error",
            "message": run_result.error,
            "returncode": run_result.returncode,
            "cause": parsed.error,
        }

    return parsed.to_dict()


def main() -> int:
    args = parse_args()
    try:
        payload = input_loader.load_requests(args.input)
    except ValueError as exc:
        error_payload = output.error_result(str(exc), {"stage": "input_load"})
        print(json.dumps(error_payload.to_dict(), ensure_ascii=False))
        return 1

    exit_code = 0
    for request_payload in payload.requests:
        result = process_request(request_payload, args.claude_bin, args.timeout_seconds)
        if not result.get("ok"):
            exit_code = 1
        print(json.dumps(result, ensure_ascii=False))

    return exit_code


if __name__ == "__main__":
    sys.exit(main())
