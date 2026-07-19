# Codex To Claude Handoff: Retry WBI Transport Failures

## Objective

Implement GitHub Issue #14 so native WBI fetch `TypeError` failures are classified before `withRetry`, and each failed fetch attempt clears its request timeout.

## Current State

- Codex added a failing-first regression to `tests/bilibili-wbi.test.ts`.
- The focused test completes in about 0.3 seconds and observes one fetch instead of four plus zero `clearTimeout` calls.
- Issue #13 status propagation is already implemented in the same dirty worktree and must remain intact.

## Files To Inspect

- `src/bilibili/wbi.ts`
- `src/bilibili/http.ts` for the existing native `TypeError` normalization pattern only; do not import it because `http.ts` already depends on WBI
- `src/utils/errors.ts`
- `src/utils/retry.ts`
- `tests/bilibili-wbi.test.ts`
- `docs/agent-memory/codemap.md`

## Files To Edit

- `src/bilibili/wbi.ts`
- `tests/bilibili-wbi.test.ts` only if the focused regression needs cleanup
- `docs/agent-memory/handoffs/2026-07-19-wbi-transport-retry-claude-report.md`

## Required Capability

- Use `diagnosing-bugs` and `vitest`.
- Use `test-baseline-builder` to review the regression.
- Use `risk-reviewer` to review the completed scoped diff.
- If a subagent stalls, finish the same checklist at the top level and report the stall.

## Constraints

- Use one local fetch-boundary `try/catch/finally`; no new helper, abstraction, dependency, or shared retry change.
- Normalize only native `TypeError` to the existing status-less `NetworkError` before retry classification.
- Preserve `AbortError` so the existing retry and final `TimeoutError` conversion remain unchanged.
- Clear the existing timeout in `finally` on every fetch outcome.
- Preserve Issue #13 HTTP status behavior, WBI cache/signature/key extraction/logging, public interfaces, and unrelated dirty-worktree changes.
- Do not use Superpowers, edit `dist/`, commit, push, close the Issue, or change labels.

## Execution Steps

1. Re-run the focused red test.
2. Trace the error and timer through one WBI retry attempt.
3. Add the minimum local error normalization and guaranteed cleanup around the existing fetch.
4. Run focused WBI tests, related retry/video tests, full suite, build, and diff check.
5. Complete both bounded reviews and write the report.

## Verification Commands

```powershell
npm test -- --run tests/bilibili-wbi.test.ts -t "retries WBI transport failures"
npm test -- --run tests/bilibili-wbi.test.ts tests/bilibili-video-api.test.ts tests/retry.test.ts
npm test
npm run build
git diff --check
```

## Acceptance Criteria

- Repeated WBI native `TypeError` produces four fetch attempts with `maxRetries: 3`.
- Every attempt calls `clearTimeout` once.
- The final error is `NetworkError` without an invented HTTP status.
- WBI 403 still performs one fetch and preserves `statusCode: 403`.
- Abort/timeout, cache, key extraction, logging, retry configuration, schemas, and response shapes remain unchanged.
- Full tests and build pass; codemap is checked.

## Things Not To Change

- Shared retry utility/configuration, timeout duration, error class signatures, WBI cache/signature algorithm, credentials, MCP tools, package/release files, or existing user changes.

## Stop And Report If

- The local fetch-boundary fix cannot satisfy the regression.
- Abort/timeout or Issue #13 status behavior changes.
- Verification fails for an unrelated or unclear reason.
- A secret is discovered.

## Expected Claude Report

Write `docs/agent-memory/handoffs/2026-07-19-wbi-transport-retry-claude-report.md` with exact command results, diff summary, skills/subagents used, risks/skips, and Harness Artifacts status.
