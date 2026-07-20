# Codex To Claude Handoff: Legacy Auth And Config Cleanup

## Update Goal

Implement ticket `docs/agent-memory/handoffs/2026-07-20-legacy-auth-config-cleanup-task-ticket.md` with the smallest correct diff.

## Current Judgment

- Repository-wide search found `BilibiliAuth` only in `src/bilibili/auth.ts`; the module is unused.
- `package.json.config.bilibili` is inert. Runtime values come from `src/config.ts`.
- `BILIBILI_CACHE_SIZE` populates `config.maxCacheSize`, but `src/utils/cache.ts` hard-codes `100` for both QuickLRU instances.
- The Smithery comment in `src/index.ts` contradicts the current no-Smithery workflow, while the reusable default server export itself must remain.
- The worktree already has an unrelated generated modification in `docs/agent-memory/pending-learning-proposals.md`; preserve it untouched.

## Recommended Approach

Prefer deletion and direct reuse:

1. Delete the unused auth module.
2. Remove only the inert `config` block from `package.json`.
3. Import the existing runtime `config` into `src/utils/cache.ts` and use `config.maxCacheSize` for both caches.
4. Add one focused Vitest regression using isolated module loading/environment cleanup to prove a small `BILIBILI_CACHE_SIZE` causes LRU eviction. Do not add a constructor option or new abstraction solely for testing.
5. Replace only the stale Smithery comment; preserve `export default server`.
6. Remove the auth entry and clarify config/cache ownership in the codemap.
7. If pack verification exposes stale generated output for the deleted module, make the existing `build` script clean the literal repository `dist` directory with Node's standard library before `tsc`; do not add a dependency or a generalized clean framework.

## Things To Avoid

- Do not replace `auth.ts` with another auth abstraction.
- Do not alter Cookie loading, CLI commands, tool schemas, response shapes, caching TTLs, or public exports unrelated to the deleted unused module.
- Do not add dependencies, touch `dist/`, bump versions, change release workflows, or edit broad README sections.
- Do not modify or stage `docs/agent-memory/pending-learning-proposals.md`.
- Do not commit, push, open a PR, publish, or create a new worktree.

## Claude Code Execution Steps

1. Read the task ticket, relevant project instructions, and current files.
2. Use the project `package-maintainer` subagent for the bounded implementation; use the `vitest` skill for the regression. If either is unavailable, state the fallback in the report.
3. Re-run `rg` before deletion to confirm no live references.
4. Implement the minimal changes described above.
5. Run all ticket verification commands and fix only same-scope failures.
6. Write the report to `docs/agent-memory/handoffs/2026-07-20-legacy-auth-config-cleanup-claude-report.md` using the project report template, including `Harness Artifacts`.

## Acceptance Criteria

All acceptance criteria in the ticket must pass. The final diff should be deletion-heavy, contain one focused cache regression, and leave MCP/public credential behavior unchanged.

## Risks

The main risks are hidden imports of the deleted module and Vitest environment leakage. TypeScript build, full tests, repository-wide search, and disciplined environment cleanup must cover them.

## Stop And Report If

Stop for any public behavior decision, hidden active dependency on `auth.ts`, need for a new package, unrelated failing gate, or secret discovery. Do not broaden scope.
