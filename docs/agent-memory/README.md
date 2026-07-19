# Agent Memory

This directory is the repository-local learning and memory system for `@xzxzzx/bilibili-mcp`.

It exists so Codex and Claude Code can preserve durable project facts, decisions, lessons, handoffs, and verification history across update cycles.

Project-local hooks are enabled as a later upgrade. They can load bounded startup context and write runtime observation candidates, but they must not auto-promote entries into this directory.

## Files

- `project-facts.md`: stable facts that are currently true.
- `decisions.md`: durable decisions and the reason behind each decision.
- `lessons-learned.md`: corrections, mistakes, and reusable operating lessons.
- `handoff-log.md`: Codex-to-Claude execution handoffs and Claude-to-Codex reports.
- `verification-log.md`: important command results and verification caveats.
- `codemap.md`: concise navigation index for runtime entry points, MCP tool flow, Bilibili integration, tests, package/release files, and agent harness files.
- `harness-security.md`: security baseline and review checklist for agent harness surfaces such as rules, hooks, skills, subagents, MCP/tool config, memory, handoffs, templates, research, and QA notes.
- `harness-eval.md`: periodic evaluation record for whether skills, subagents, hooks, templates, memory, handoffs, and fixed triggers improve the workflow or add unnecessary process.
- `context-budget-report.md`: lightweight context overhead audit for always-relevant agent docs and project hooks.
- `pending-learning-proposals.md`: generated review queue for candidate lessons that require Codex and user approval before promotion.

## Update When

- The user corrects an assumption or workflow.
- A project-specific rule becomes clear.
- A durable technical decision is made.
- A stabilization task is completed or reprioritized.
- A verification result changes the known project state.
- A repeated pitfall is discovered.
- Broad hooks, MCP servers, rules, skills, or always-loaded instructions are added and context overhead should be rechecked.
- A roadmap phase, release, or significant harness update completes and the agent workflow itself should be evaluated.

## Do Not Store

- Full Bilibili Cookie strings.
- `SESSDATA`, `bili_jct`, or `DedeUserID` values.
- npm tokens, GitHub tokens, or `.env` content.
- Private user credentials.
- Unverified guesses or transient command output.

## Entry Format

Use dated entries:

```markdown
## 2026-05-27

- Fact: ...
- Evidence: ...
- Impact: ...
```

Keep entries concise and evidence-backed.

## Controlled Learning

Runtime hooks can generate `pending-learning-proposals.md` automatically from Codex and Claude Code candidate observations.

Promotion remains manual:

1. Codex reviews the proposal.
2. The user approves with `批准本轮 learning proposals`.
3. Codex writes the approved entry into the correct formal memory file.

Do not treat pending proposals as formal memory.

The active-work pointer is `docs/agent-memory/active-work.md`. Because Matt work is tracked in GitHub Issues instead of a local phase plan, phase-count reminders remain inactive; proposal review and promotion are still manual.
