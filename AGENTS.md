# Repository Guidelines

## Project Structure & Module Organization
This repository is a collection of skill plugins. Each plugin lives under `skills-plugins/<skill-name>/`, and the canonical documentation is `skills-plugins/<skill-name>/skills/<skill-name>/SKILL.md`. Executable helpers are typically in `skills-plugins/<skill-name>/skills/<skill-name>/scripts/`, with optional `references/` and `assets/` for supporting docs and templates. The top-level `README.md` provides the catalog and install guidance.

## Build, Test, and Development Commands
There is no repo-wide build or test runner. Work at the skill level:
- Run a script directly when a skill includes one, for example: `python3 skills-plugins/<skill-name>/skills/<skill-name>/scripts/<script>.py`.
- Consult each `SKILL.md` for required CLI tools, inputs, and expected outputs.

## Coding Style & Naming Conventions
Follow existing conventions in each skill:
- Python scripts use 4-space indentation.
- Skill folder names use kebab-case (for example, `lark-doc-to-md`).
- Script filenames are lowercase with underscores (for example, `lark_doc_to_md.py`).
- Keep documentation in `SKILL.md` and describe inputs/outputs clearly.

## Testing Guidelines
No test framework or tests are currently present. If you add tests, keep them close to the skill they validate (for example, `skills-plugins/<skill-name>/tests/`) and document how to run them in that skill’s `SKILL.md`.

## Commit & Pull Request Guidelines
Recent commits use an emoji prefix and a conventional type, for example: `✨ feat: ...`, `📝 docs: ...`, `🔧 chore: ...`. Keep messages short, use a single summary line, and match the existing style (English or Chinese is fine). For PRs, include:
- A clear description of the skill change and expected behavior.
- Any new commands or environment requirements.
- Sample inputs/outputs when adding or updating a skill.

## Agent-Specific Notes
When adding a new skill, mirror the existing layout (`skills/`, `scripts/`, `references/`, `assets/`) and update `README.md` to list it. Ensure `SKILL.md` is the source of truth for usage details.
