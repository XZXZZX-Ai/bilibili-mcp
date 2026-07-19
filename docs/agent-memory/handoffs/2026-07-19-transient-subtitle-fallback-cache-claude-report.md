# Claude To Codex Report: Transient Subtitle Fallback Cache

## Summary

Removed the erroneous `cacheManager.setVideoInfo(cacheKey, result)` call in the general subtitle-error catch branch of `getVideoInfoWithSubtitle`. This was caching the description fallback on transient errors, blocking all future retries for the same BVID. Also corrected the misleading Chinese comment that claimed the fallback was a successful subtitle result.

## Files Changed

- `src/bilibili/subtitle.ts` — removed 1 line (erroneous `cacheManager.setVideoInfo` in error catch), updated 1 comment

## Commands Run

| Command | Result |
|---------|--------|
| `npm test -- --run tests/bilibili-transcript.test.ts -t "retries subtitle retrieval..."` (before fix) | FAIL — expected "subtitle", got "description" |
| `npm test -- --run tests/bilibili-transcript.test.ts -t "retries subtitle retrieval..."` (after fix) | PASS — 1 passed, 15 skipped |
| `npm test -- --run tests/bilibili-transcript.test.ts` | PASS — 16 passed |
| `npm test` | PASS — 17 files, 159 tests |
| `npm run build` | PASS — TypeScript compilation clean |
| `git diff --check` | PASS — only pre-existing CRLF warnings |

## Results

- First call returns `data_source: "description"` (fallback preserved)
- Second call retries, reaches subtitle API, returns `data_source: "subtitle"`
- `mockGetVideoSubtitle` called exactly twice
- Successful subtitle caching on the happy path preserved (line 382)
- `COOKIE_EXPIRED` propagation preserved (line 386-388, checked before fallback)
- No MCP response shape changes, no new abstractions, no scope creep

## Diff Notes

The only source change is in `subtitle.ts` lines 403-408: removed `cacheManager.setVideoInfo(cacheKey, result)` and changed the comment from `// 成功获取到字幕，存入缓存` to `// 不缓存降级结果，以便下次重试时能拉取字幕`. The `src/bilibili/http.ts` changes in the working tree diff are pre-existing and unrelated to this task.

## Risks Or Skipped Checks

- No risk: one-line deletion of a buggy cache write, consistent with three other fallback branches that already skip caching
- The regression test relies on `cacheManager.clear()` in `beforeEach` for isolation; no order-dependency risk
- No deterministic cache-layer test for the retry-after-cached-fallback scenario exists, but the mock-layer regression covers the real behavior

## Harness Artifacts

- **Task ticket**: used — GitHub Issue #4 is the task ticket, referenced in the Codex handoff
- **Research note**: not required — all facts are local to the worktree
- **QA checklist**: not required — no release/install/package/public-MCP surface changes
- **Codemap**: checked unchanged — `subtitle.ts` module ownership and navigation unchanged
- **Harness security**: reviewed — no credential, .env, token, or trust-boundary impact
- **Harness eval**: deferred — local one-line fix, no workflow change

## Decision Points

None. The fix was unambiguous and matched the handoff exactly.

## Suggested Codex Review Focus

1. Confirm the removed `cacheManager.setVideoInfo` was the only path caching description fallbacks (verified: three other fallback branches already skip caching)
2. Confirm the regression test correctly exercises the retry path (two calls, same BVID, mock counters verified)
3. Note: the `http.ts` throttling changes in the working tree are pre-existing and unrelated
