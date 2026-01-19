# Lark PlantUML Safe Subset (write-lark-markdown)

This skill requires all diagrams to be PlantUML and to follow a conservative safe subset for stable rendering and review.

## Allowed diagram types

- component / deployment
- sequence
- activity
- class
- state

## Required

- Every diagram MUST include a `title ...` line.
- Use `@startuml` / `@enduml`.
- Prefer simple relationships and minimal styling.

## Forbidden (hard-block)

- Any preprocessor include or macro:
  - `!include`, `!includeurl`, `!include_many`, `!define`, `!ifdef`, `!ifndef`, `!endif`
- Any URL-like content:
  - `http://` or `https://`
- Any local file path hints:
  - `file://`, `/Users/`, `C:\\`
- Any sprite usage:
  - `sprite`, `$sprite`

## `skinparam` policy

Default: avoid styling.

Allowed `skinparam` keys (whitelist):

- `componentStyle rectangle`
- `shadowing false`
- `monochrome true|false`
- `defaultTextAlignment left`

All other `skinparam` usages are forbidden.

## Complexity limits (encourage split)

- sequence: participants/actors <= 12
- component/deployment: nodes/components <= 15
- activity/state/class: nodes/classes <= 20

If a diagram exceeds limits, split it into multiple diagrams and label sections as `(1/2)`, `(2/2)` in headings.
