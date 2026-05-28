# Agent Memory And Learning System Design

## Purpose

Build a repository-local learning and memory system for `@xzxzzx/bilibili-mcp` so Codex and Claude Code can preserve project facts, decisions, lessons, handoffs, and verification history across update cycles.

The design is inspired by ECC, especially its separation of skills, rules, memory persistence, continuous learning, and project-scoped instincts. This project should start with a controlled, explicit system before adopting automatic Claude Code hooks.

## Current Context

The repository is in a stabilization phase. The active near-term plan is:

- `docs/superpowers/plans/2026-05-27-stabilization-roadmap.md`

Current agent configuration already exists in:

- `AGENTS.md`
- `CLAUDE.md`
- `C:\Users\ZX\.claude\skills`
- `C:\Users\ZX\.codex\skills`
- `C:\Users\ZX\.agents\skills`

Important constraints:

- The user manually orchestrates Codex and Claude Code.
- Codex provides direction, decomposition, risk review, and verification guidance.
- Claude Code executes bounded implementation tasks.
- The stabilization roadmap should remain the source of truth for near-term code work.
- Global Claude Code hooks should not be enabled as part of the first phase.

## ECC Reference Points

ECC uses several concepts that are useful here:

- Project-scoped instincts avoid cross-project contamination.
- Memory persistence should stay local by default.
- Continuous learning should distinguish raw observations from promoted reusable rules.
- Skills should be used for repeatable workflows.
- Hooks are powerful but higher-risk because they affect agent runtime behavior.

This repository should adapt those ideas conservatively:

- Use Markdown memory files as the first storage layer.
- Use project-scoped skill instructions for the repeatable update workflow.
- Treat hooks as a later upgrade, not the initial implementation.

## Recommended Architecture

Use a three-layer system:

1. Repository memory files under `docs/agent-memory/`.
2. Agent instruction integration in `AGENTS.md` and `CLAUDE.md`.
3. A project-specific memory skill installed for both Codex and Claude Code.

Do not add automatic observation hooks in the first implementation phase.

## Repository Memory Files

Create:

```text
docs/agent-memory/
  README.md
  project-facts.md
  decisions.md
  lessons-learned.md
  handoff-log.md
  verification-log.md
```

### `README.md`

Explains the memory system, what each file is for, and the update rules.

### `project-facts.md`

Stores stable, currently true facts about the repository.

Examples:

- Package entry points should target `dist`.
- Cookie-based subtitle access must remain supported.
- Smithery runtime config is not part of the active workflow.
- Claude Code skills live under `C:\Users\ZX\.claude\skills`.

### `decisions.md`

Stores durable project decisions and the reason for each decision.

Examples:

- Stabilize security, package metadata, tests, and publish contents before splitting `src/bilibili/client.ts`.
- Use Vitest for the minimal test baseline.
- Do not enable ECC hooks during the first memory-system phase.

### `lessons-learned.md`

Stores corrections, mistakes, and reusable operating lessons.

Examples:

- `.agents\skills` and `.claude\skills` are separate directories.
- Do not remove Cookie support when removing hard-coded Cookie values.
- Avoid copying mojibake into new Markdown content.

### `handoff-log.md`

Stores Codex-to-Claude execution handoffs and Claude-to-Codex implementation reports.

Each entry should include:

- date
- owner
- objective
- files in scope
- constraints
- verification expected or completed
- unresolved risks

### `verification-log.md`

Stores significant verification results.

Each entry should include:

- date
- command
- result
- relevant files or feature area
- skipped checks or caveats

## Memory Update Rules

Agents should update memory when one of these events occurs:

- The user corrects an assumption or workflow.
- A project-specific rule becomes clear.
- A durable technical decision is made.
- A stabilization task is completed or reprioritized.
- A verification result changes the known project state.
- A repeated pitfall is discovered.

Agents should not update memory for:

- transient command output with no future relevance
- speculation
- unverified guesses
- raw credentials, Cookie values, tokens, or `.env` content
- noisy implementation details that are already obvious from the code

Memory entries must be concise and evidence-backed. If a fact depends on a command, cite the command and date.

## Agent Instruction Integration

Update `AGENTS.md` to tell Codex:

- read `docs/agent-memory/README.md` before substantial planning or review work
- consult `project-facts.md`, `decisions.md`, and `lessons-learned.md` before producing a handoff
- write new durable decisions or lessons when the user corrects behavior or the project state changes
- avoid automatic hook-based memory unless the user explicitly approves a later upgrade

Update `CLAUDE.md` to tell Claude Code:

- read `docs/agent-memory/README.md` before implementing a Codex handoff
- append implementation reports to `handoff-log.md` only when the user or Codex asks for memory capture
- append verification results to `verification-log.md` when verification outcomes are important to future work
- never store secrets or full Cookie values in memory

## Project Memory Skill

Create a project-specific skill for both Codex and Claude Code:

```text
C:\Users\ZX\.codex\skills\bilibili-mcp-memory
C:\Users\ZX\.claude\skills\bilibili-mcp-memory
```

The skill should trigger when the user asks to:

- update project memory
- review project memory
- record a lesson learned
- record a project decision
- prepare or inspect a Codex-to-Claude handoff
- summarize verification history

The skill should point to `docs/agent-memory/` and define a short workflow:

1. Inspect current memory files.
2. Decide which memory file applies.
3. Add only durable, verified information.
4. Keep entries concise.
5. Do not store secrets.
6. Report what changed.

## Deferred ECC Hooks Upgrade

Do not implement automatic hooks in the first phase.

A later phase may evaluate ECC-style hooks:

- `SessionStart` for loading bounded prior context
- `PreCompact` for saving state before compaction
- `PreToolUse` and `PostToolUse` for observation
- `Stop` for session summaries, quality checks, and learning extraction

Before enabling hooks, the project should have:

- completed the stabilization roadmap
- a clear opt-in from the user
- a documented rollback path
- a scoped project-local hook configuration or clearly separated global configuration
- verification that hooks do not duplicate existing Claude Code behavior

## Data Safety

The memory system must not store:

- full Bilibili Cookie strings
- `SESSDATA`
- `bili_jct`
- `DedeUserID`
- npm tokens
- GitHub tokens
- `.env` content
- private user credentials

If a credential-related lesson needs to be recorded, describe the rule without the value.

## Success Criteria

The first implementation phase is complete when:

- `docs/agent-memory/` exists with the six planned Markdown files.
- `AGENTS.md` tells Codex when and how to use the memory system.
- `CLAUDE.md` tells Claude Code when and how to use the memory system.
- `bilibili-mcp-memory` exists for Codex.
- `bilibili-mcp-memory` exists for Claude Code.
- The design remains project-local and does not enable ECC hooks.
- The memory files include initial entries for current stabilization facts, decisions, lessons, and verification state.

## Open Non-Goals

This design does not implement:

- automatic transcript capture
- background observer agents
- automatic instinct scoring
- global Claude Code hook installation
- a database-backed memory store
- hosted memory sync

Those can be evaluated after the repository is stable.

## Self-Review

- Completion marker scan: no open work markers remain.
- Scope check: the first phase is limited to project-local memory files, agent instructions, and one project-specific skill.
- Consistency check: this design preserves the existing Codex-plans and Claude-executes collaboration model.
- Risk check: automatic ECC hooks are deferred to avoid changing Claude Code runtime behavior during stabilization.
