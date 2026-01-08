"""Run the claude CLI command and capture stdout/stderr."""

from __future__ import annotations

import subprocess
from dataclasses import dataclass
from typing import Optional, Sequence


@dataclass(frozen=True)
class RunResult:
    """Captured CLI output and return code."""

    returncode: int
    stdout: str
    stderr: str
    error: Optional[str] = None


def run_command(
    command: Sequence[str],
    stdin_data: Optional[str],
    timeout_seconds: Optional[float] = None,
) -> RunResult:
    """Execute the claude CLI and capture output in text mode."""
    try:
        completed = subprocess.run(
            list(command),
            input=stdin_data,
            text=True,
            capture_output=True,
            timeout=timeout_seconds,
            check=False,
        )
    except subprocess.TimeoutExpired as exc:
        return RunResult(
            returncode=124,
            stdout=exc.stdout or "",
            stderr=exc.stderr or "",
            error="command timed out",
        )
    except OSError as exc:
        return RunResult(
            returncode=127,
            stdout="",
            stderr=str(exc),
            error="failed to execute claude CLI",
        )

    return RunResult(
        returncode=completed.returncode,
        stdout=completed.stdout,
        stderr=completed.stderr,
        error=None,
    )
