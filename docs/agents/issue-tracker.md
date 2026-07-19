# Issue Tracker: GitHub

Issues, specifications, and tickets produced by Matt Pocock skills for this repository live as GitHub Issues in `XZXZZX-Ai/bilibili-mcp`. Use authenticated GitHub tooling or the `gh` CLI for live operations.

## Conventions

- Create, read, comment on, label, and close issues with GitHub tooling from this repository.
- Fetch the complete issue body, labels, dependencies, and relevant comments before acting on a ticket.
- Use native GitHub sub-issues and blocking relationships when available. Otherwise record `Blocked by: #<number>` in the issue body.
- Treat a ticket as ready only when every blocker is closed and it carries the `ready-for-agent` label.
- Do not close or modify parent issues unless the active skill explicitly requires it.
- Do not include Cookie values, tokens, `.env` contents, or private credentials in issues or comments.

## Pull Requests As A Triage Surface

**PRs as a request surface: no.**

External pull requests are not included in the Matt triage queue unless this file is explicitly changed later.

## Skill Operations

- When a skill says "publish to the issue tracker", create a GitHub Issue.
- When a skill says "fetch the relevant ticket", read the full GitHub Issue and its comments.
- `to-spec` creates or updates the specification issue in its declared scope.
- `to-tickets` creates dependency-aware child tickets after the user approves the breakdown.
- `triage` changes only issues in the requested triage scope.
- `wayfinder` may create one map issue and its decision tickets for the named effort.

Remote writes remain bounded by the active user request and repository rules.
