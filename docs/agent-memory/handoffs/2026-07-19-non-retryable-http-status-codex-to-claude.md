# Codex To Claude Handoff: Non-Retryable HTTP Status

## Objective

Implement GitHub Issue #11 so an explicit HTTP status code is the authoritative retry decision: configured transient statuses retry, other statuses fail immediately.

## Current State

- `src/utils/retry.ts::shouldRetry` first checks the status allowlist, then independently checks `error.name`.
- `NetworkError` is included in `retryableErrorTypes`, so a `NetworkError` with HTTP 403 falls through and retries despite 403 not being allowed.
- Codex's zero-backoff harness threw one `NetworkError` with `statusCode: 403`; `withRetry(..., { maxRetries: 3 })` invoked it 4 times instead of once.
- The worktree contains authorized, uncommitted changes for Issues #2-#10. Preserve all of them.

## Files To Inspect

- `src/utils/retry.ts`
- `src/utils/errors.ts`
- `src/bilibili/http.ts`
- `tests/logger-redaction.test.ts`
- `tests/bilibili-http.test.ts`
- `docs/agent-memory/codemap.md`

## Files To Edit

Expected only:

- `src/utils/retry.ts`
- `tests/retry.test.ts` (new)
- `docs/agent-memory/handoffs/2026-07-19-non-retryable-http-status-claude-report.md`

## Required Capability

- Use the installed `vitest` skill.
- Invoke `test-baseline-builder` for a bounded review of the three-branch retry matrix. If it stalls, record that and perform the same review at top level.
- Invoke `risk-reviewer` for a bounded review of retry regressions, status precedence, and logging. If it stalls, record that and perform the same review at top level.
- Do not use any `superpowers:*` skill.

## Constraints

- Apply Ponytail full: no new class, helper module, configuration, dependency, or generalized policy object.
- In `shouldRetry`, when `statusCode` is a number, immediately return whether it is in `retryableStatusCodes`.
- Only status-less errors may fall through to name/code-based retry checks.
- Keep 408, 429, 500, 502, 503, and 504 behavior unchanged.
- Keep status-less `NetworkError`, `TimeoutError`, `AbortError`, `ECONNRESET`, and `ETIMEDOUT` behavior unchanged.
- Remove any now-redundant special 429 branch if the authoritative status branch already covers it.
- Do not change default retry counts, backoff/jitter calculation, logs, stats, HTTP wrappers, public errors, docs, package files, or prior Issue changes.
- Tests must use zero delay and suppress expected retry stderr with a scoped spy restored in `finally`/hook.
- Do not commit or push.

## Execution Steps

1. Inspect the current scoped diff and preserve prior HTTP changes.
2. Create `tests/retry.test.ts` with a deterministic three-case matrix:
   - `NetworkError` status 403: one attempt with `maxRetries: 3`;
   - `NetworkError` status 503: four attempts;
   - status-less `NetworkError`: four attempts.
3. Run the focused test before production edits and record the 403 red failure.
4. Make the smallest `shouldRetry` change and delete only the redundant 429 check if applicable.
5. Run focused retry/logger/HTTP tests, full tests, build, and diff checks.
6. Run bounded test and risk reviews; address only same-Issue findings.
7. Write the required report with exact commands/results and Harness Artifacts status.

## Verification Commands

```powershell
npx vitest run tests/retry.test.ts
npx vitest run tests/logger-redaction.test.ts tests/bilibili-http.test.ts
npm test
npm run build
git diff --check
```

Also rerun the Codex zero-backoff 403 harness or its exact test equivalent and scan the scoped diff for debug markers.

## Acceptance Criteria

- 403 attempts equal 1.
- 503 attempts equal 4 with `maxRetries: 3`.
- Status-less `NetworkError` attempts equal 4.
- Tests have no real waits, random-dependent assertions, or unhandled rejections.
- Existing logger redaction and HTTP behavior remain green.
- Full suite, build, and diff checks pass.
- Report names `vitest`, `test-baseline-builder`, and `risk-reviewer` outcomes.
- GitHub Issue #11 is recorded as the task ticket; QA checklist is correctly reported not required because no public schema/install/credential workflow changes.
- Codemap is checked and reported unchanged unless navigation ownership actually changes.

## Things Not To Change

- HTTP status allowlist values, retry count, delays, jitter, retry logs, stats, error classes, MCP payloads, credentials, schemas, documentation, package/release files, or Issues #2-#10 changes.

## Stop And Report If

- Existing callers depend on retrying explicit 4xx statuses other than 408/429.
- The three-case matrix cannot be expressed through the current `withRetry` API.
- A broader retry redesign or public behavior decision is required.
- Required verification fails for an unrelated reason that cannot be isolated.

## Expected Claude Report

Write `docs/agent-memory/handoffs/2026-07-19-non-retryable-http-status-claude-report.md` with:

- files changed and minimal diff summary
- focused pre-fix failure and final results
- all verification commands/results
- required skill/subagent outcomes
- risks, skipped checks, and decision points
- Harness Artifacts status
