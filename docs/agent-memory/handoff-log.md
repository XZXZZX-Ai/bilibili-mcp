# Handoff Log

## 2026-05-27

- Owner: Codex
- Objective: Design a repository-local learning and memory system inspired by ECC.
- Files in scope: `docs/agent-memory/`, `AGENTS.md`, `CLAUDE.md`, `C:\Users\ZX\.codex\skills\bilibili-mcp-memory`, `C:\Users\ZX\.claude\skills\bilibili-mcp-memory`.
- Constraints: Do not enable Claude Code hooks in the first phase. Do not store secrets. Preserve the manual Codex-plans and Claude-executes workflow.
- Verification expected: Confirm memory files exist, agent instructions reference them, both skills exist, and no hook settings were modified.
- Unresolved risks: Later ECC-style hooks require a separate opt-in design and rollback path.

## 2026-05-28

- Owner: Codex
- Objective: Start Phase 2 by designing and planning the compatibility-first split of `src/bilibili/client.ts`.
- Files in scope: `docs/superpowers/specs/2026-05-28-bilibili-client-split-design.md`, `docs/superpowers/plans/2026-05-28-bilibili-client-split-implementation-plan.md`, `docs/agent-memory/decisions.md`.
- Constraints: Preserve Cookie-based subtitle access, WBI-first subtitle retrieval, `/x/player/v2` fallback, MCP tool schemas, and compatibility exports from `src/bilibili/client.ts`.
- Verification expected: Claude Code should execute the plan task-by-task, starting with mocked Vitest coverage for subtitle fallback behavior, then run `npm test`, `npm run build`, and `npm pack --dry-run`.
- Unresolved risks: Current worktree still contains unrelated agent/hooks configuration changes; Phase 2 implementation should not mix those into the code refactor commit unless the user explicitly chooses to.
