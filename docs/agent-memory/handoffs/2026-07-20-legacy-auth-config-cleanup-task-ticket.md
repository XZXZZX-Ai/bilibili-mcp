# Task Ticket: Legacy Auth And Config Cleanup

- ID: LOCAL-2026-07-20-LEGACY-CLEANUP
- Title: Remove unused auth module and connect runtime cache configuration
- Status: `done`
- Owner: `Claude Code`
- Source: User request after Codex repository orientation

## Objective

Remove three verified maintenance inconsistencies without changing MCP tool names, schemas, response shapes, credential behavior, or release state.

## Scope

In scope:

- Delete the unused `src/bilibili/auth.ts` module.
- Remove the inert `package.json.config.bilibili` block because runtime configuration is owned by `src/config.ts`.
- Make `BILIBILI_CACHE_SIZE` / `config.maxCacheSize` control both QuickLRU caches.
- Make `npm run build` remove stale `dist` output before TypeScript compilation so deleted modules cannot remain publishable.
- Replace the stale Smithery-specific comment in `src/index.ts` with a transport-neutral reusable-export comment.
- Add the smallest Vitest regression proving configured cache capacity is honored.
- Update `docs/agent-memory/codemap.md` for the removed module and clarified configuration ownership.

Out of scope:

- Public MCP behavior changes.
- Credential storage, Cookie handling, login flows, new authentication features, or API changes.
- Dependency upgrades, release/version changes, commits, pushes, PRs, or publishing.
- Broad documentation cleanup or generated `dist/` edits.

## Files To Inspect Or Edit

Expected inspect:

- `src/bilibili/auth.ts`
- `src/config.ts`
- `src/utils/cache.ts`
- `src/index.ts`
- `tests/cache.test.ts`
- `package.json`
- `package-lock.json`
- `docs/agent-memory/codemap.md`
- `docs/agent-memory/harness-security.md`

Expected edit:

- Delete `src/bilibili/auth.ts`.
- Edit `src/utils/cache.ts`, `src/index.ts`, `tests/cache.test.ts`, `package.json`, and `docs/agent-memory/codemap.md`.
- Edit `package-lock.json` only if npm tooling proves the removed package metadata is represented there.
- Create `docs/agent-memory/handoffs/2026-07-20-legacy-auth-config-cleanup-claude-report.md`.

Do not touch:

- `docs/agent-memory/pending-learning-proposals.md` (pre-existing user/runtime change).
- `dist/`, credential files, `.env`, hooks, release workflows, READMEs, changelogs, or version fields.

## Required Capabilities

Skills:

- `vitest` for the cache-capacity regression.
- `ask-matt` is unavailable in the current Codex runtime; this light local ticket is the approved fallback.

Subagents:

- Use the project `package-maintainer` subagent because `package.json` and package contents are affected.
- Do not create an agent team or additional subagent tree.

CLI:

- `rg`, `git`, `npm`, `tsc`, and Vitest through repository scripts.

## Acceptance Criteria

- [ ] `src/bilibili/auth.ts` is deleted and no source, test, or current codemap reference remains.
- [ ] `package.json.config.bilibili` is removed without changing version, scripts, dependencies, entry points, or publish allowlist.
- [ ] Both QuickLRU instances use `config.maxCacheSize` rather than a duplicated hard-coded capacity.
- [ ] A deterministic Vitest regression demonstrates that configured cache capacity evicts older entries.
- [ ] `src/index.ts` no longer claims the reusable default server export exists for Smithery.
- [ ] A build started with a sentinel/stale file under `dist/` removes it, and `npm pack --dry-run --json` contains no `dist/bilibili/auth.*` artifacts.
- [ ] `docs/agent-memory/codemap.md` reflects current module/config ownership.
- [ ] Public MCP tool names, schemas, response shapes, credential behavior, and fallback behavior remain unchanged.
- [ ] No secrets or generated `dist/` files are added.

## Verification

Required:

```bash
npm run build
npm test
npm pack --dry-run --json
git diff --check
git status --short
```

Also verify with `rg` that no current reference to `BilibiliAuth`, `src/bilibili/auth.ts`, or the Smithery comment remains.

## Risks And Rollback

- Risk: deleting `auth.ts` could break an undocumented internal import; full TypeScript build and repository-wide search are the guard.
- Risk: environment-driven cache sizing could leak test state; restore environment variables and reset Vitest modules in cleanup.
- Rollback: restore the deleted module and changed lines; no data migration or external state is involved.

## Stop And Report Conditions

Stop and report if the deleted auth module is imported by a current build path, if fixing cache configuration requires a public API change or new dependency, if a real credential is discovered, or if required verification fails for an unrelated reason.
