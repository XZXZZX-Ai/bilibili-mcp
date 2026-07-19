# Claude To Codex Report: Preserve WBI HTTP Status

## Summary

Fixed Issue #13: the WBI nav `NetworkError` was missing `statusCode`, causing `shouldRetry` to fall through to the `NetworkError` type-name branch and retry non-retryable statuses (403). The outer catch also discarded the status when wrapping. Two-line fix: pass `navRes.status` as the 4th `NetworkError` arg, and preserve `statusCode` in the outer catch re-wrap via `error instanceof NetworkError ? error.statusCode : undefined`.

The diagnosing-bugs red/green loop was performed through the handoff's focused test (`tests/bilibili-wbi.test.ts`). The test started red (4 fetches, `statusCode: undefined`) and the root cause was traced to the two `NetworkError` construction sites in `wbi.ts` that both omitted `statusCode`.

## Files Changed

- `src/bilibili/wbi.ts` (lines 86–91, 152–157): added `navRes.status` as 4th arg to inner `NetworkError`; outer catch preserves status via `error instanceof NetworkError ? error.statusCode : undefined`.

## Subagents Used

- **test-baseline-builder**: reviewed `tests/bilibili-wbi.test.ts`. Verdict: deterministic (fake timers, stubbed fetch), proper mock cleanup (`afterEach` restores timers/mocks), both assertions correct for acceptance criteria. Minor observation: `vi.runAllTimersAsync()` is a no-op in this flow since `shouldRetry` returns false before any `setTimeout` delay is scheduled, but it is harmless.
- **risk-reviewer**: reviewed the scoped diff. No blocking findings. Confirmed: retryable statuses (408/429/500/502/503/504) still retry; status-less NetworkErrors still retry; 403 correctly classified as non-retryable. Pattern is consistent with existing usage in `http.ts` and `video-api.ts`. No credential/secret/MCP tool/package/release impact.

## Commands Run

```
npx vitest run --reporter=verbose tests/bilibili-wbi.test.ts
npx vitest run --reporter=verbose tests/bilibili-wbi.test.ts tests/bilibili-video-api.test.ts tests/retry.test.ts
npx vitest run --reporter=verbose
npm run build
git diff --check
```

## Results

- **WBI focused test (red→green)**: 1 fetch, `statusCode: 403`. Pass.
- **WBI + video-api + retry**: 11 tests. All pass.
- **Full suite**: 19 files, 176 tests. All pass.
- **Build**: `tsc` clean, no errors.
- **git diff --check**: CRLF warnings only (pre-existing, unrelated dirty-worktree files). No whitespace errors.

## Diff Notes

Two-line change in `wbi.ts`:

1. `new NetworkError(..., navRes.status)` — gives `shouldRetry` a numeric `statusCode` to check against `retryableStatusCodes`. 403 is not in `[408, 429, 500, 502, 503, 504]`, so the retry loop exits after one attempt.
2. Outer catch `new NetworkError(..., error instanceof NetworkError ? error.statusCode : undefined)` — the final thrown error preserves the status from the inner error using the existing typed check.

No changes to `NetworkError` constructor, `shouldRetry` logic, retry configuration, WBI caching, timeout handling, logging, or any other module.

## Risks Or Skipped Checks

- `vitest` skill: invoked implicitly through `npx vitest run`; no config or fixture changes needed.
- No skipped required checks. Both `test-baseline-builder` and `risk-reviewer` subagents returned clean findings.

## Harness Artifacts

- Task ticket: not required — single-file, two-parameter bug fix under 30 minutes, no public behavior change.
- Research note: not required — no external facts affected the fix.
- QA checklist: not required — no release/install/MCP/credential/client surface change.
- Codemap: checked unchanged — `wbi.ts` ownership and navigation unchanged.
- Harness security: not applicable — no credential, token, .env, or trust-boundary change.
- Harness eval: deferred — no process friction observed in this task.

## Decision Points

None. The root cause was unambiguous: `statusCode` was never passed to either `NetworkError` construction site in `wbi.ts`.

## Suggested Codex Review Focus

- Confirm the dirty-worktree files are untouched (CRLF warnings are pre-existing).
- Verify the focused test's `toHaveBeenCalledTimes(1)` + `statusCode: 403` assertions cover the acceptance criteria.
- Both subagents (`test-baseline-builder`, `risk-reviewer`) returned clean findings with no blocking issues.
