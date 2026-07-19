# Claude To Codex Report: Non-Retryable HTTP Status

## Summary

Fixed `shouldRetry` in `src/utils/retry.ts` so an explicit numeric `statusCode` is the authoritative retry decision. Previously a `NetworkError` with `statusCode: 403` would retry 4 times because the name-check always passed independently. Now `typeof error.statusCode === 'number'` returns immediately based on `retryableStatusCodes`; only status-less errors fall through to name/code checks. Removed the dead `error.statusCode === 429` branch (429 already covered by the authoritative status branch). Added three-case deterministic test matrix.

## Files Changed

- `src/utils/retry.ts` (+3, -8): `shouldRetry` restructured with authoritative statusCode gate, dead 429 check removed.
- `tests/retry.test.ts` (new): compact `it.each` matrix — 403→1 attempt, 503→4 attempts, status-less→4 attempts. Zero delay, stderr spy scoped with finally.

## Commands Run

| Command | Result |
|---|---|
| `npx vitest run tests/retry.test.ts` (pre-fix) | 1 failed (403 got 4 attempts), 2 passed |
| `npx vitest run tests/retry.test.ts` (post-fix) | 3 passed |
| `npx vitest run tests/logger-redaction.test.ts tests/bilibili-http.test.ts` | 10 passed |
| `npm test` | 18 files, 174 tests passed |
| `npm run build` | clean |
| `git diff --check -- src/utils/retry.ts` | clean (only LF→CRLF warning) |
| `git diff --stat -- src/utils/retry.ts tests/retry.test.ts` | 1 changed, +3/-8 |

## Diff Notes

`shouldRetry` before: two independent branches — status check as a `true` gate returning `true`, name check running regardless. `NetworkError` with any status always retried because `name: 'NetworkError'` matched.

`shouldRetry` after: `typeof error.statusCode === 'number'` → `retryableStatusCodes.includes(...)` returns immediately. `undefined`/missing `statusCode` falls through to name (`error.name`) and code (`ECONNRESET`/`ETIMEDOUT`) checks. The old `error.statusCode === 429` line was unreachable dead code and removed.

## Risks Or Skipped Checks

- **Skipped**: `npm pack --dry-run` — no package metadata, publish contents, or entry point changes.
- **risk-reviewer noted**: `src/bilibili/video-api.ts:200` throws `NetworkError` without `statusCode`, so subtitle 403 retries 4 times under name-check. This is pre-existing, not a regression, and outside this Issue's scope. Follow-up: pass `response.status` there if fast-fail on subtitle 403 is desired.
- **test-baseline-builder noted**: singleton `retryManager` accumulates internal stats across tests — current tests use local closures, so no flakiness today.

## Harness Artifacts

- **Task ticket**: GitHub Issue #11 used as the task ticket per handoff.
- **Research note**: not required — no external facts needed.
- **QA checklist**: not required — no public schema, install, credential, or client workflow changes.
- **Codemap**: checked unchanged — retry.ts already listed at line 49, test list is illustrative.
- **Harness security**: not applicable — no credential, secret, trust-boundary, or harness rule changes.
- **Harness eval**: deferred — single narrow fix, evaluate after next roadmap phase.

## Decision Points

None. The fix matched the handoff constraints exactly.

## Suggested Codex Review Focus

- `video-api.ts:200` `NetworkError` without `statusCode` — follow-up Issue if subtitle 403 fast-fail matters.
- Confirm the 403→1, 503→4, status-less→4 acceptance criteria are satisfied by the test output.
