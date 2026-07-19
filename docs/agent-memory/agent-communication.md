# Agent Communication

This file defines the Markdown-based communication protocol between Codex and Claude Code for `@xzxzzx/bilibili-mcp`.

Codex orchestrates Claude Code through the Paseo CLI after the user has authorized the task or development direction. This protocol authorizes one bounded implementation agent, not autonomous teams or scope expansion.

## Default Flow

1. Codex writes a bounded Markdown handoff.
2. Codex reads the live Paseo orchestration preferences and launches one Claude Code implementation agent with the handoff path.
3. Claude Code executes the handoff and writes the requested Markdown report.
4. Codex reviews the report, diff, and verification evidence.
5. Durable outcomes are summarized in `docs/agent-memory/handoff-log.md`, `verification-log.md`, `decisions.md`, or `lessons-learned.md` as appropriate.

When Matt Pocock skills produced a GitHub specification or ticket, the issue is the planning source and the file-backed Codex handoff references it while adding repository-specific files, checks, rollback, and stop conditions. Do not create a duplicate local task ticket.

## Paseo Launch Contract

- Read `C:\Users\ZX\.paseo\orchestration-preferences.json` before each launch and use `providers.impl` unless the user explicitly selected another Claude provider.
- Check Paseo availability, but never restart its daemon without explicit user approval.
- Launch one bounded implementation agent and reference the absolute repository path, handoff path, and GitHub Issue when present.
- Keep the handoff self-contained; do not rely on Codex chat context.
- Claude Code must write the expected report before finishing. Codex then reviews the report, actual diff, and checks.
- A same-scope repair may be sent through Paseo without asking the user to operate Claude Code. New scope, public behavior, Git actions, releases, or other new authority still require user approval.

## Active Handoff Location

For substantial implementation work, Codex should create a focused handoff file under:

```text
docs/agent-memory/handoffs/YYYY-MM-DD-<topic>-codex-to-claude.md
```

Claude Code should return its execution report in Markdown. If it writes a file, use:

```text
docs/agent-memory/handoffs/YYYY-MM-DD-<topic>-claude-report.md
```

Short tasks may use chat Markdown only, but release, package, credential, MCP tool, and multi-file implementation work should use a file-backed handoff.

## Codex Handoff Template

```markdown
# Codex To Claude Handoff: <topic>

## Objective

## Current State

## Files To Inspect

## Files To Edit

## Required Capability

## Constraints

## Execution Steps

## Verification Commands

## Acceptance Criteria

## Things Not To Change

## Stop And Report If

## Expected Claude Report
```

## Claude Report Template

```markdown
# Claude To Codex Report: <topic>

## Summary

## Files Changed

## Commands Run

## Results

## Diff Notes

## Risks Or Skipped Checks

## Harness Artifacts

- Task ticket: used / not required, reason
- Research note: created / not required, reason
- QA checklist: created / not required, reason
- Codemap: updated / checked unchanged / not applicable
- Harness security: reviewed / not applicable
- Harness eval: updated / deferred / not applicable

## Decision Points

## Suggested Codex Review Focus
```

## Rules

- Markdown handoffs must be specific enough that Claude Code does not need hidden chat context.
- Include exact verification commands and expected pass/fail meaning.
- Name required skills, subagents, MCP/tool connectors, or CLI commands when fixed triggers apply.
- Claude reports must include the `Harness Artifacts` section so Codex can verify whether task tickets, research notes, QA checklists, codemap updates, harness-security review, and harness-eval were considered.
- Do not include secrets, full Cookie values, `.env` contents, npm tokens, GitHub tokens, or private credentials.
- Do not use handoff files as uncontrolled scratchpads. Keep one handoff focused on one task or phase.
- If Claude Code changes scope, discovers a decision point, or cannot run a required check, it should stop and report that in Markdown instead of guessing.
