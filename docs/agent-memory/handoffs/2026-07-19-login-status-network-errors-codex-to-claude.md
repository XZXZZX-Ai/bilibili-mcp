# Codex To Claude Handoff: Login Status Network Errors

## Objective

Implement GitHub Issue #10 so Bilibili login-status checks preserve network failures instead of reporting them as logged-out credentials.

## Current State

- `src/bilibili/http.ts::checkLoginStatus` has its own fetch, timeout, and catch-all path.
- Any non-2xx response returns `{ isLogin: false }`.
- Any thrown fetch error or timeout is caught and also returns `{ isLogin: false }`.
- `fetchWithoutWBI` already owns shared headers, throttling, timeout, retry, status handling, API parsing, and credential-safe behavior.
- Raw fetch connection failures surface as `TypeError`; `throttledFetch` currently rethrows them unchanged, so `retryableFetch` does not recognize them as `NetworkError`.
- Codex's deterministic red harness injected HTTP 503 and asserted `checkLoginStatus` rejects with `NetworkError`; the assertion failed because the function resolved as logged out.
- The worktree contains user-authorized, uncommitted changes for Issues #2-#9. Preserve all of them.

## Files To Inspect

- `src/bilibili/http.ts`
- `src/utils/errors.ts`
- `src/utils/retry.ts`
- `src/utils/credential-guidance.ts`
- `src/bilibili/subtitle.ts`
- `tests/bilibili-http.test.ts`
- `tests/credential-guidance.test.ts`
- `tests/server-credential-tools.test.ts`
- `tests/server-error-next-steps.test.ts`
- `docs/agent-memory/codemap.md`

## Files To Edit

Expected only:

- `src/bilibili/http.ts`
- `tests/bilibili-http.test.ts`
- `docs/agent-memory/handoffs/2026-07-19-login-status-network-errors-claude-report.md`

Explain any additional file before editing it in the report.

## Required Capability

- Use the installed `vitest` skill for deterministic failing-first tests.
- Use `secret-scanning` guidance to ensure tests, errors, logs, and the report contain no Cookie or credential values.
- Invoke the project Claude subagent `test-baseline-builder` for a bounded review of the HTTP test seam. If it stalls, record that and perform the same scoped review in the top-level task.
- Invoke the project Claude subagent `risk-reviewer` after implementation for credential leakage, retry/timeout, MCP error-shape, and shared HTTP regression review. If it stalls, record that and perform the checklist in the top-level task.
- Do not use any `superpowers:*` skill.

## Constraints

- Apply the Ponytail ladder: reuse `fetchWithoutWBI`; do not add a new HTTP helper, status type, wrapper class, dependency, or configuration.
- Collapse `checkLoginStatus` to the existing shared request path and return `{ isLogin: data?.isLogin === true }` only after a successful API response.
- A successful nav response with `isLogin: false` remains a definitive logged-out result.
- Non-2xx responses, Bilibili API errors, timeouts, and connection failures must propagate rather than become `false`.
- At the shared `throttledFetch` seam, normalize native fetch `TypeError` to existing `NetworkError` with the original error attached and a generic credential-safe message.
- Preserve existing `AbortError` to `TimeoutError` behavior and all admission/rate-limit logic.
- Do not change retry counts/delays, public MCP schemas, credential response fields, subtitle fallback policy, error payload formats, docs, package files, or unrelated code.
- Never include Cookie values, `.env` content, credential fields, tokens, or private values.
- Do not commit or push, and do not revert unrelated dirty-worktree changes.

## Execution Steps

1. Inspect the scoped existing diff so prior Issue #2 HTTP changes remain intact.
2. Add deterministic failing tests in `tests/bilibili-http.test.ts` for:
   - successful nav payload with `isLogin: false` still resolving false;
   - non-2xx login-status response rejecting with `NetworkError` instead of false;
   - a raw `TypeError` thrown inside `throttledFetch` becoming `NetworkError` with `originalError` preserved.
3. Run the focused file and record the expected pre-fix failures.
4. Make the smallest production edit in `src/bilibili/http.ts`: normalize raw fetch `TypeError` at the shared seam and rewrite `checkLoginStatus` to call `fetchWithoutWBI`.
5. Re-run focused HTTP tests, credential/subtitle/error tests, full tests, build, and diff checks.
6. Run the required bounded subagent reviews and address only same-Issue findings.
7. Scan the scoped diff/report for secret-like assignments without printing any actual credential values.
8. Write the required Claude report.

## Verification Commands

```powershell
npx vitest run tests/bilibili-http.test.ts
npx vitest run tests/credential-guidance.test.ts tests/server-credential-tools.test.ts tests/bilibili-transcript.test.ts tests/server-error-next-steps.test.ts
npm test
npm run build
git diff --check
```

Also verify:

- `checkLoginStatus` no longer contains a catch-all that returns false.
- `throttledFetch` still converts `AbortError` to `TimeoutError` before the new `TypeError` branch.
- no new credential-like literal or debug marker exists in the scoped diff.

## Acceptance Criteria

- The three failing-first cases above are green.
- HTTP 503/other non-2xx status cannot masquerade as logged-out credentials.
- Native fetch connection failure becomes retry-recognizable `NetworkError` at the shared seam.
- Successful logged-out payload still returns false.
- Existing throttling, retry, timeout, credential, subtitle, and structured MCP error behavior remains green.
- Focused checks, full suite, build, and `git diff --check` pass.
- Report names `vitest`, `secret-scanning`, `test-baseline-builder`, and `risk-reviewer` outcomes.
- Codemap is checked and either updated only if navigation/ownership changed or reported unchanged.

## Things Not To Change

- Credential sources, Cookie storage, setup commands, response fields, subtitle fallback branches, retry configuration, WBI behavior, API endpoints, public schemas, README files, package/release files, or harness rules.
- Existing Issue #2-#9 changes.

## Stop And Report If

- The nav endpoint uses a successful nonzero API code to represent ordinary logged-out state in current deterministic fixtures or existing tests.
- The fix requires a public response-shape change or tri-state credential status.
- Tests reveal retry recursion, timeout regression, or a broad HTTP refactor is necessary.
- A real credential or secret is found.
- Required verification fails for an unrelated reason that cannot be isolated.

## Expected Claude Report

Write `docs/agent-memory/handoffs/2026-07-19-login-status-network-errors-claude-report.md` with:

- summary and exact files changed
- failing-first commands and failure evidence
- final commands and results
- `vitest` and `secret-scanning` use
- both requested subagent outcomes
- secret-safety result without printing values
- risks, skipped checks, decision points, and suggested Codex review focus
- Harness Artifacts status for Issue #10, research note, QA checklist, codemap, harness-security, and harness-eval
