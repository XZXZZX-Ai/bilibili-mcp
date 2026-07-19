# Claude To Codex Report: Subtitle HTTP Status Preservation

## Summary

Fixed GitHub Issue #12: `getSubtitleContent` in `src/bilibili/video-api.ts` was constructing `NetworkError` without `response.status` as the 4th argument, causing `statusCode` to be `undefined`. Since `shouldRetry` checks `error.statusCode` first (retry.ts:121-123), a missing `statusCode` fell through to name matching — `NetworkError` is in `retryableErrorTypes` — so non-retryable HTTP 403 retried 4 times with `statusCode: undefined` on the final error.

Added `response.status` as the 4th `NetworkError` constructor argument. This matches the existing pattern in `fetchWithWBI` (http.ts:161) and `fetchWithoutWBI` (http.ts:303-308).

## Files Changed

- `src/bilibili/video-api.ts` — one line added at line 204 (`, response.status` as 4th `NetworkError` argument)

## Commands Run

```
npx vitest run tests/bilibili-video-api.test.ts -t "does not retry a non-retryable subtitle HTTP status"
npx vitest run tests/bilibili-video-api.test.ts
npm test
npm run build
git diff --check
npm pack --dry-run
```

## Results

| Command | Result |
|---------|--------|
| Focused regression test (pre-fix) | FAIL: `statusCode: undefined`, 4 fetches |
| Focused regression test (post-fix) | PASS: 1 fetch, `statusCode: 403` |
| Full video API test file | PASS: 7/7 |
| Full test suite | PASS: 18 files, 175 tests |
| Build | PASS: TypeScript compilation clean |
| git diff --check | Clean (pre-existing CRLF warnings only) |
| npm pack --dry-run | 120 files, expected contents |

## Diff Notes

Exactly one line added. The two sibling HTTP callers (`fetchWithWBI`, `fetchWithoutWBI`) already pass `response.status` correctly. No retry policy, credential, or schema changes.

## Risks Or Skipped Checks

None. The `retry.test.ts` test suite already validates retryable (503 → 4 attempts) and non-retryable (403 → 1 attempt) paths through `withRetry` with `NetworkError` carrying `statusCode`. No integration test against real Bilibili 403 subtitle responses — but that would be network-dependent and out of scope.

## Subagents Used

- **test-baseline-builder**: confirmed test is deterministic, correctly verifies 1 fetch + `statusCode: 403`. No issues.
- **risk-reviewer**: confirmed no retry regressions, no credential exposure, no schema changes, no unrelated edits, smallest root-cause fix. No issues.

Both subagents ran to completion without stalls.

## Harness Artifacts

- Task ticket: not required — single-line bug fix, no public behavior change
- Research note: not required — local root-cause fix, no external research
- QA checklist: not required — no release/install paths, public tool schemas, or response shapes changed
- Codemap: checked unchanged — `video-api.ts` already described as "video/subtitle API calls and subtitle response safety checks", no navigation ownership change
- Harness security: not applicable — no credential, secret, or trust-boundary changes
- Harness eval: deferred — minor bug fix, no process friction observed

## Decision Points

None. The root cause was unambiguous: `getSubtitleContent` was the only of three HTTP callers omitting `response.status` from `NetworkError` construction.

## Suggested Codex Review Focus

- Verify the issue acceptance criteria: 403 performs 1 fetch, `statusCode: 403` preserved, all tests/build pass.
- Close GitHub Issue #12 after review.
