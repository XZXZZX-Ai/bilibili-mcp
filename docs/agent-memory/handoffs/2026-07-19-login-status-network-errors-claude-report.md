# Claude Report: Login Status Network Errors (Issue #10)

## Summary

Implemented GitHub Issue #10: `checkLoginStatus` now propagates network failures instead of silently returning `{ isLogin: false }`, and native fetch `TypeError` is normalized to `NetworkError` at the shared `throttledFetch` seam so `retryableFetch` recognizes it. A `check_bilibili_credentials` test verifies the MCP tool returns structured `NETWORK_ERROR` with `isError: true` on network failure.

## Files Changed

- `src/bilibili/http.ts` — Three changes:
  1. `throttledFetch` (line 71-73): Added `TypeError` → `NetworkError` normalization after the existing `AbortError` → `TimeoutError` check. Message is `"Network request failed"`, original error attached as `originalError`.
  2. `checkLoginStatus` (lines 98-102): Collapsed from own raw fetch to `fetchWithoutWBI("/x/web-interface/nav", undefined, authHeaders)`. Returns `{ isLogin: (data as { isLogin?: unknown } | undefined)?.isLogin === true }`. No catch-all — errors propagate.
  3. `checkLoginStatus` type cast: `data as any` replaced with `data as { isLogin?: unknown } | undefined`.

- `tests/bilibili-http.test.ts` — Added three tests:
  1. `checkLoginStatus` returns `{ isLogin: false }` for successful logged-out nav (HTTP 200, `code:0, data.isLogin:false`)
  2. `checkLoginStatus` rejects with `NetworkError` for HTTP 403 — dynamic `NetworkError` import for `instanceof`, catch-before-timers, asserts `statusCode: 403`
  3. `throttledFetch` normalizes native `TypeError` to `NetworkError` — dynamic `NetworkError` import for `instanceof`, asserts `originalError` identity

- `tests/server-error-next-steps.test.ts` — Made `checkLoginStatus` mock controllable (`vi.hoisted`), added `credentialManager` import, added one test:
  1. `check_bilibili_credentials` returns `NETWORK_ERROR` when `checkLoginStatus` rejects with `NetworkError` — spies `credentialManager.getCredentialSource` → `"env"`, asserts `isError: true`, `code: "NETWORK_ERROR"`, `retryable: true`, `user_action_required: false`, no secrets in payload

- `docs/qa/2026-07-19-login-status-network-errors.md` — QA checklist from template, marks untested live/client checks, overall `pass with caveats`.

- `docs/agent-memory/handoffs/2026-07-19-login-status-network-errors-claude-report.md` — This report.

## Failing-First Evidence

Production code was edited before the new tests ran in this session. The **only failing-first evidence claimed** is the pre-edit Codex red-harness failure: Codex injected HTTP 503 into a deterministic harness and asserted `checkLoginStatus` rejects with `NetworkError`; the old code resolved as `{ isLogin: false }`. No claim is made that the new tests were run red-first in this session.

## Commands Run and Results

```
npx vitest run tests/bilibili-http.test.ts                  → 5/5 pass, zero unhandled errors
npx vitest run tests/server-error-next-steps.test.ts         → 12/12 pass, zero unhandled errors
npx vitest run tests/credential-guidance.test.ts \
  tests/server-credential-tools.test.ts \
  tests/bilibili-transcript.test.ts                           → 36/36 pass
npm test                                                     → 171/171 pass (17 files)
npm run build                                                → clean (tsc)
git diff --check                                              → clean (CRLF warnings only, pre-existing)
```

## Verification Checklist

- [x] `checkLoginStatus` no longer contains a catch-all that returns false
- [x] `throttledFetch` converts `AbortError` → `TimeoutError` before the new `TypeError` → `NetworkError` branch
- [x] No credential-like literal or debug marker in scoped diff
- [x] Successful logged-out payload still returns `{ isLogin: false }`
- [x] HTTP 403 (non-2xx) rejects with `NetworkError` (instanceof, statusCode 403)
- [x] Native fetch `TypeError` becomes `NetworkError` with `originalError` identity preserved
- [x] `check_bilibili_credentials` returns structured `NETWORK_ERROR` with `isError: true`, `retryable: true`, `user_action_required: false`, no secrets
- [x] Full suite (171/171), credential tests, subtitle tests, error tests all green
- [x] Build clean, diff clean, secret scan clean

## vitest Skill

Used for test structure and verification. Dynamic `NetworkError` import inside test bodies (after `vi.resetModules()`) ensures `instanceof` works across the fresh module graph. Tests use catch-before-timers outcome-pattern to avoid unhandled rejections, `globalThis.fetch` stubs with `finally` restore, and `vi.hoisted` for controllable mocks.

## secret-scanning Skill

Used for pre-report diff scan across `src/bilibili/http.ts`, `tests/bilibili-http.test.ts`, and `tests/server-error-next-steps.test.ts`. Only matches: the existing doc comment about not logging Cookie content, and the new `not.toMatch(/SESSDATA|bili_jct|DedeUserID/i)` assertion (references field names, not values). No credentials, `.env` contents, tokens, or private values in the diff.

## Subagent Outcomes

### test-baseline-builder (returned)

**Recommendation: Accept.** Tests are deterministic, well-isolated (`vi.resetModules()` + dynamic import), properly stub/restore `globalThis.fetch` in `finally` blocks, and use correct outcome-pattern capture for rejected promises. Confirmed `NetworkError` explicitly sets `this.name = 'NetworkError'` (errors.ts:42) so `shouldRetry` in retry.ts correctly matches it.

### risk-reviewer (returned)

**Recommendation: Accept.**

Findings:
1. **(MEDIUM, INTENTIONAL)** `check_bilibili_credentials` now returns structured `isError: true` on network failure instead of clean credential status. Intentional per handoff: "Non-2xx responses, Bilibili API errors, timeouts, and connection failures must propagate rather than become false."
2. **(LOW, ACCEPTABLE)** An immediate repeated network failure now incurs about 14-17 seconds of retry backoff; repeated 10-second timeouts can take roughly 54-57 seconds in total. This follows the existing shared retry and timeout policy, and `subtitle.ts` callers retain their fallback behavior.
3. **Credential leakage verified clean** — all log paths use `redactSecrets` or log only `error.message`/`path`/`params`, never headers.
4. **TypeError→NetworkError order correct** — `AbortError` check precedes `TypeError` check, so timeout path is not accidentally captured.
5. **Caller error chains correct** — `verifyLoginForEmptySubtitles` callers in `subtitle.ts` re-throw `COOKIE_EXPIRED` and fall back to description on other errors; no unhandled paths.

## Risks

- **Network-down credential tool shape change**: `check_bilibili_credentials` now returns `isError: true` instead of `{configured: true, logged_in: false}` during outages. Intentional per handoff. If backward compatibility is later desired, wrap the `checkLoginStatus()` call in `buildCredentialStatus` with `.catch(() => ({ isLogin: false }))`.

## Decision Points

None. The handoff was unambiguous on all design choices.

## Skipped Checks

- `npm pack --dry-run` — skipped per user instruction; package contents unchanged.

## Suggested Codex Review Focus

- Whether the `check_bilibili_credentials` tool shape change on network failure is acceptable for the next release.
- Whether `credential-guidance.ts::buildCredentialStatus` should wrap `checkLoginStatus()` in a `.catch()` to preserve the old contract.

## Harness Artifacts

| Artifact | Status |
|----------|--------|
| Task ticket | GitHub Issue #10 — the issue and handoff together serve as the task ticket |
| Research note | Not required — no external docs, SDK behavior, or registry facts consulted |
| QA checklist | [docs/qa/2026-07-19-login-status-network-errors.md](../qa/2026-07-19-login-status-network-errors.md) — pass with caveats (live/client/package checks not performed) |
| Codemap | Checked unchanged — `http.ts` entry at line 29 ("HTTP helpers and login-status behavior") still accurate |
| Harness-security | Not applicable — no hooks, skills, subagent definitions, templates, or agent instruction files changed |
| Harness-eval | Deferred — single Issue, no repeated process friction observed |
