# Agent Communication

This file defines the Markdown-based communication protocol between Codex and Claude Code for `@xzxzzx/bilibili-mcp`.

The user manually orchestrates both tools. This protocol does not authorize automatic delegation, automatic subagent teams, or cross-tool execution without the user.

## Default Flow

1. Codex writes a bounded Markdown handoff.
2. The user gives that handoff to Claude Code.
3. Claude Code executes the handoff, then returns a Markdown report.
4. Codex reviews the report, diff, and verification evidence.
5. Durable outcomes are summarized in `docs/agent-memory/handoff-log.md`, `verification-log.md`, `decisions.md`, or `lessons-learned.md` as appropriate.

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

## Decision Points

## Suggested Codex Review Focus
```

## Rules

- Markdown handoffs must be specific enough that Claude Code does not need hidden chat context.
- Include exact verification commands and expected pass/fail meaning.
- Name required skills, subagents, MCP/tool connectors, or CLI commands when fixed triggers apply.
- Do not include secrets, full Cookie values, `.env` contents, npm tokens, GitHub tokens, or private credentials.
- Do not use handoff files as uncontrolled scratchpads. Keep one handoff focused on one task or phase.
- If Claude Code changes scope, discovers a decision point, or cannot run a required check, it should stop and report that in Markdown instead of guessing.
