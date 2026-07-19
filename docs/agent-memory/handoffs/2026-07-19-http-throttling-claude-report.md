# Claude To Codex Report: Concurrent HTTP Throttling Fix

## Summary

Replaced the single `pendingPromise` in `throttledFetch` with a promise admission chain that serializes request starts at the configured rate-limit interval. Fixes GitHub Issue #2 where concurrent callers could batch admissions within `~0.1ms` instead of the required `500ms` gap.

Codex review repairs applied (same scope): restored original JSDoc comments; updated the serialization test so the first callback stays unresolved until later admissions complete, proving only starts are serialized; final correction to `await previousTurn` before constructing AbortController so the timeout excludes prior callers' admission time while still covering this caller's own rate-limit wait.

## Files Changed

- `src/bilibili/http.ts` — replaced `pendingPromise` / `null` toggle with `admissionChain` promise chain
- `tests/bilibili-http.test.ts` — new formal Vitest test (2 cases, fake timers, `vi.resetModules` + dynamic import)
- Deleted: `tests/.tmp-http-throttle-repro.test.ts`

## Commands Run

```powershell
npm test -- tests/.tmp-http-throttle-repro.test.ts   # red: min gap ~0.1ms, FAIL
npm test -- tests/bilibili-http.test.ts               # green: 2 passed
npm test                                               # 157 passed, 17 files
npm run build                                          # tsc passed
git diff --check                                       # OK
```

## Results

| Check | Result |
|-------|--------|
| Temp repro before fix | FAILED (min gap ~0.1ms, threshold 400ms) |
| Formal test after fix | 2 passed, no warnings |
| Full test suite | 157/157 passed, 17/17 files |
| TypeScript build | Passed |
| Diff format | OK |

Root cause: `pendingPromise` stored only `waitForRateLimit()`. Three concurrent callers all awaited the same resolved `pendingPromise`, then each created its own `waitForRateLimit()` -- starting their waits at nearly the same instant.

Fix: `admissionChain` chains each caller's admission sequentially. Order is reserved synchronously: `const previousTurn = admissionChain; const myTurn = previousTurn.then(() => waitForRateLimit()); admissionChain = myTurn.catch(() => {}); await previousTurn;`. After the previous caller is admitted, the AbortController and timeout are constructed, so the timeout excludes prior callers' queue time. Inside `try`, `await myTurn` covers this request's own rate-limit wait before `fetchFn`. The `.catch(() => {})` on the chain assignment prevents a rejected admission from blocking later callers. Only request starts are serialized; response bodies may overlap.

## Risk Review

`risk-reviewer` subagent was invoked (background, read-only on `src/bilibili/http.ts` and `tests/bilibili-http.test.ts`). It returned after the report draft with all five risk areas CLEAN, matching the top-level agent's independent review:

| Area | Finding |
|------|---------|
| Concurrency ordering | CLEAN — `admissionChain` read-and-update is a synchronous atomic block; FIFO order is guaranteed |
| Timeout/abort semantics | CLEAN — timeout starts after `await previousTurn` (excludes prior queue time), `await myTurn` inside `try` (covers own rate-limit wait), `finally` cleans up on both success and failure |
| Rejected-chain recovery | CLEAN — `admissionChain = myTurn.catch(() => {})` keeps the chain head always resolvable; `previousTurn` rejection cannot block the next caller |
| Test determinism | CLEAN — `vi.resetModules()` + dynamic import provides fresh module state per test; env save/restore is correct; `firstDone` pattern deterministically proves response-body overlap |
| Scope drift | CLEAN — only `throttledFetch` internal logic changed; no new exports, modules, dependencies, or config |

Additional subagent observation: the failure-recovery test only verifies one failing caller followed by one succeeding caller; it does not test a third caller after a second consecutive failure. The chain-recovery mechanism is identical for all callers, so this is low risk.

## Diff Notes

- `waitForRateLimit()` and all other exports unchanged
- `checkLoginStatus`, `fetchWithWBI`, `fetchWithoutWBI`, `retryableFetch` unchanged
- Timeout, retry, error mapping, logging preserved
- No new dependencies, modules, exports, or configuration
- Existing unrelated dirty worktree files untouched

## Risks Or Skipped Checks

- `test-baseline-builder` subagent was invoked as required by the handoff, but was interrupted before returning a result. The top-level Claude Code agent wrote `tests/bilibili-http.test.ts` directly.
- `npm test` first run had one flaky smoke test failure (`mcp-server-smoke.test.ts`). A rerun passed; the final suite after deleting the temporary repro is 157/157 across 17 files. The flake was not reproduced by Codex's independent run.
- `npm pack --dry-run` skipped — no package metadata or publish path changed.
- No real-network integration test; the fix is exercised deterministically via fake timers.

## Harness Artifacts

- Task ticket: used (GitHub Issue #2)
- Research note: not required — no external research needed
- QA checklist: not required — no release/install/package/MCP-tool/schema/credential/README changes
- Codemap: checked unchanged — module ownership did not change
- Harness security: not applicable — no harness surface file changed
- Harness eval: deferred — single bug fix, no phase/release completed

## Decision Points

None. The admission-chain approach was the smallest root-cause fix and aligned with the handoff constraints.

## Suggested Codex Review Focus

- Verify the `admissionChain` chain logic: `catch(() => {})` on the chain assignment is the key safety property
- Confirm the temp repro file deletion and the formal test's `vi.resetModules` isolation pattern
- The incomplete subagent invocation is a process note, not a code concern
