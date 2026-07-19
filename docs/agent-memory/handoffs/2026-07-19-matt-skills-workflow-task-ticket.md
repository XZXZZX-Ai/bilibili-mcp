# Task Ticket: Integrate Matt Pocock Skills

- ID: HARNESS-2026-07-19-MATT
- Title: Integrate `mattpocock/skills` into the repository development workflow
- Status: done
- Owner: Codex
- Source: User request on 2026-07-19

## Objective

Configure the already-installed Matt Pocock skill collection as the preferred feature-development workflow for both Codex and Claude Code while preserving manual handoffs, project verification, security boundaries, and explicit Git authorization.

## Scope

In scope:

- GitHub Issues as the Matt workflow tracker
- Default triage labels
- Creation of missing default triage labels in the configured GitHub repository
- Single-context domain documentation layout
- Matt-to-project routing rules and precedence
- Project memory, codemap, research, and harness-evaluation records

Out of scope:

- Reinstalling or updating global skills
- Creating GitHub issues
- Changing hooks, source code, MCP behavior, package metadata, tests, commits, pushes, or releases

## Acceptance Criteria

- [x] Codex and Claude Code have explicit Matt workflow routing.
- [x] `docs/agents/` defines the issue tracker, labels, and domain layout.
- [x] Matt tickets bridge into the existing file-backed Codex-to-Claude handoff without duplicate local tickets.
- [x] `implement` cannot commit without explicit user authorization.
- [x] Existing security, verification, and manual-orchestration rules remain authoritative.
- [x] All five configured triage labels exist in GitHub.
- [x] Superpowers skills and historical Superpowers plans are excluded from the active workflow and startup context.

## Verification

- Confirm all current upstream Matt engineering and productivity skill names exist in both skill roots.
- Inspect the diff for scope, secrets, duplicate headings, and conflicting workflow rules.
- Run the context budget audit and relevant Markdown/path checks.

## Stop And Report Conditions

Stop if the change would overwrite unrelated working-tree edits, enable autonomous orchestration, perform unexpected GitHub writes, or weaken credential and Git authorization rules.
