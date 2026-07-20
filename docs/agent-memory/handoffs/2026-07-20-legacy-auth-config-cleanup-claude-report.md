# Claude To Codex Report: Legacy Auth And Config Cleanup

## Summary

Implemented all six scope items from the task ticket, plus a packaging repair. Deleted the unused auth module, removed the inert `package.json.config.bilibili` block, connected `src/utils/cache.ts` to `config.maxCacheSize` (was hard-coded 100), replaced the stale Smithery comment in `src/index.ts`, added a deterministic cache-capacity Vitest regression, updated the codemap, and fixed the build script to clean stale `dist/` artifacts (Node stdlib, portable safety check). No public MCP behavior, credential handling, or release state changed.

## Files Changed

- `src/bilibili/auth.ts` — deleted (unused, no live imports).
- `package.json` — removed inert `config.bilibili` block; changed `build` script from `tsc` to portable dist-clean + `tsc`.
- `src/utils/cache.ts` — imports `config`, uses `config.maxCacheSize` for both QuickLRU instances; removed unused `CacheOptions` interface.
- `src/index.ts` — replaced Smithery-specific comment with transport-neutral "Reusable default server export for programmatic use".
- `tests/cache.test.ts` — added `vi.hoisted` env setup and a new describe block proving that maxCacheSize=3 evicts oldest entries after 7 inserts (QuickLRU v7 two-generation design).
- `docs/agent-memory/codemap.md` — removed `auth.ts` entry, clarified `config.ts` ownership (rate limits, timeouts, cache sizing), clarified `cache.ts` as using runtime `config.maxCacheSize`.
- `docs/agent-memory/handoffs/2026-07-20-legacy-auth-config-cleanup-claude-report.md` — this report.

Pre-existing change `docs/agent-memory/pending-learning-proposals.md` preserved untouched.

## Commands Run

```bash
# Initial implementation
npm run build          # tsc — passed
npm test               # vitest run — 244 tests passed, 23 files
npm pack --dry-run --json  # 128 entries, auth.* stale artifacts present
git diff --check       # no whitespace errors
rg BilibiliAuth        # only handoff docs
rg 'src/bilibili/auth' # only handoff docs
rg Smithery src/       # no matches

# Build-clean repair (per Codex review)
echo "sentinel" > dist/_sentinel.txt  # place sentinel
npm run build          # dist-clean + tsc — passed
test -f dist/_sentinel.txt  # sentinel cleaned (OK)
ls dist/bilibili/auth.*  # No such file (OK)
npm test               # 244 tests passed (unchanged)
npm pack --dry-run --json  # 124 entries, no auth.* files
git diff --check       # no whitespace errors
git status --short     # expected diff; pre-existing files preserved
```

## Results

- **Build**: clean TypeScript compilation with portable dist-clean pre-step (Node stdlib `rmSync`, guard: `dirname(d) === cwd() && basename(d) === 'dist'`).
- **Tests**: all 244 tests pass across 23 files, including the new cache capacity regression.
- **Pack**: 124 entries (down from 128). Stale `dist/bilibili/auth.*` (4 files) no longer included. No package metadata corruption.
- **rg confirmations**: no live references to `BilibiliAuth`, `src/bilibili/auth.ts`, or the old Smithery comment in source, tests, or codemap. Only handoff docs reference the deleted module.

## Diff Notes

- Build script: `node --input-type=commonjs -e "…" && tsc` — uses Node stdlib `fs.rmSync` + `path.resolve/dirname/basename` for portable dist cleaning. Safety guard resolves `dist` and asserts `dirname(d) === process.cwd()` and `basename(d) === 'dist'` before recursive removal. No `mkdirSync` needed — tsc creates `outDir`.
- `vi.hoisted` in `tests/cache.test.ts` sets `BILIBILI_CACHE_SIZE=3` before all imports in that file. Cleanup restores the previous value after the file's tests complete. Existing tests in the same file insert ≤2 entries and are unaffected.
- `package-lock.json` unchanged — `package.json.config` blocks are npm-internal only and not stored in the lockfile.

## Risks Or Skipped Checks

- No manual MCP stdio smoke test run (requires valid credentials). Credential and MCP tool paths were not changed by this diff; build and tool-schema tests provide equivalent coverage.

## Harness Artifacts

- **Task ticket**: used — `docs/agent-memory/handoffs/2026-07-20-legacy-auth-config-cleanup-task-ticket.md`.
- **Research note**: not required — all facts verified from local worktree (grep, build, tests).
- **QA checklist**: not required — no public install, credential, stdio, package-client behavior change.
- **Codemap**: updated — removed `auth.ts` entry, clarified `config.ts` and `cache.ts` ownership.
- **Harness security**: not applicable — no rules, hooks, skills, subagents, MCP/tool config, memory, handoffs, templates, research, or QA workflow changes.
- **Harness eval**: deferred — this is a bounded maintenance cleanup; eval after the next roadmap phase or release.

## Decision Points

None. All scope items were unambiguous and the handoff's approach was confirmed by live repository state.

## Capabilities Used

- **`package-maintainer` subagent**: used for the build-clean repair (package.json `build` script change affecting build output and pack contents). The subagent was launched with the portable-clean requirement and returned the final script.
- **`vitest` skill**: not used for the regression test. The single test was added directly with the `vi.hoisted` + `afterAll` cleanup pattern. No fixture, mock factory, or Vitest configuration change was needed.

## Suggested Codex Review Focus

- Build script portable guard: `dirname(d) === process.cwd()` relies on npm running scripts from `package.json` directory. This is an npm guarantee.
- `vi.hoisted` pattern in `tests/cache.test.ts` — two-generation QuickLRU v7 behavior (maxSize=3, 7 inserts trigger eviction) matches the library's documented design.
