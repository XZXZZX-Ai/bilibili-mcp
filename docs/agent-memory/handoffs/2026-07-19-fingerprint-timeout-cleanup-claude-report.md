# Claude To Codex Report: Fingerprint Timeout Cleanup

## Summary

Fixed `getBuvid()` to guarantee `clearTimeout` call on every code path by hoisting the timer declarations out of `try` and moving cleanup into `finally`. No retry, no abstraction, one block change.

## Files Changed

- `src/bilibili/fingerprint.ts`: hoisted `controller`/`timeoutId` above `try`, replaced inline `clearTimeout` with `finally` block.
- `tests/bilibili-fingerprint.test.ts`: added `expect(mockFetch).toHaveBeenCalledTimes(1)` to prove no-retry (test-baseline-builder identified the missing assertion).

## Commands Run

```
npm test -- --run tests/bilibili-fingerprint.test.ts           # 1 passed (was failing)
npm test -- --run tests/bilibili-fingerprint.test.ts tests/bilibili-video-api.test.ts tests/bilibili-comments-tool.test.ts  # 28 passed
npm test                                                        # 20 files, 178 passed
npm run build                                                   # tsc clean
git diff --check                                                # no whitespace errors
```

## Results

- Red test confirmed before fix: `clearTimeout` called 0 times.
- Green after: `clearTimeout` called exactly 1 time, `fetch` called exactly 1 time.
- All 20 test files (178 tests) pass. TypeScript build clean.
- Both callers (`comments-api.ts`, `video-api.ts`) use null-safe patterns — no changes needed.
- All three acceptance criteria now explicitly asserted: null fallback, clearTimeout×1, fetch×1 (no retry).

## Diff Notes

8 lines changed: controller/timeoutId hoisted + finally block. No public interface, fallback, cache, validation, logging, or caller behavior changed.

## Risks Or Skipped Checks

- `risk-reviewer`: confirmed null fallback preserved on all paths, no credential/MCP risk, no regressions.
- `test-baseline-builder`: identified missing `expect(mockFetch).toHaveBeenCalledTimes(1)` — added.
- Minor note: hoisted `new AbortController()`/`setTimeout()` are now outside try/catch, but both are infallible in practice.
- No `npm pack --dry-run` run because no package/release files changed.

## Harness Artifacts

- Task ticket: not required — single-file bug fix, no public behavior change.
- Research note: not required — no external facts.
- QA checklist: not required — no release/install/MCP/client behavior change.
- Codemap: checked unchanged — `fingerprint.ts` entry already exists under Bilibili Integration.
- Harness security: not applicable — no rules, hooks, skills, subagents, MCP/tool config, or memory changed.
- Harness eval: deferred — no workflow friction observed.

## Decision Points

None. The fix was straightforward: `finally` is the idiomatic way to guarantee single-path cleanup in JS.

## Suggested Codex Review Focus

- Confirm the diff is the minimum guaranteed-cleanup structure.
- Confirm no retry/abstraction crept in.
