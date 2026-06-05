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

## 2026-06-05

- Owner: Codex planned and reviewed; Claude Code implemented the credential-guidance feature from the handoff.
- Objective: Make agent-driven MCP installation able to discover and present Bilibili Cookie setup instructions without exposing Cookie values.
- Files in scope: `src/server.ts`, `src/utils/credential-guidance.ts`, `src/utils/credentials.ts`, Bilibili credential error paths, README files, and focused Vitest coverage.
- Constraints: Do not put Cookie values in MCP client config, logs, tests, or responses; preserve Cookie-based access through environment variables and the global credential helper.
- Verification expected: `npm test`, `npm run build`, `npm pack --dry-run`, secret/stale-client scans, and review of generic `COOKIE_EXPIRED` error handling.
- Result: Codex review added a missing generic-catch `COOKIE_EXPIRED` regression fix and confirmed the feature passed the expected verification commands.
- Unresolved risks: Global config source is not directly covered by a dedicated unit test, and in-memory-only credentials are not currently reported as a credential source.
