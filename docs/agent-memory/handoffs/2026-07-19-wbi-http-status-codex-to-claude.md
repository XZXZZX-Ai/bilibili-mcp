# Codex To Claude Handoff: Preserve WBI HTTP Status

## Objective

Implement GitHub Issue #13 so a non-retryable WBI nav HTTP status is used by the shared retry decision and preserved on the final error.

## Current State

- `tests/bilibili-wbi.test.ts` is a failing-first regression added by Codex.
- `npm test -- --run tests/bilibili-wbi.test.ts` fails in about 0.3 seconds: HTTP 403 triggers four fetches and the final `NetworkError.statusCode` is `undefined`.
- The worktree contains many earlier authorized, uncommitted changes. Preserve all of them.

## Files To Inspect

- `src/bilibili/wbi.ts`
- `src/utils/errors.ts`
- `src/utils/retry.ts`
- `tests/bilibili-wbi.test.ts`
- existing WBI coverage in `tests/bilibili-video-api.test.ts`
- `docs/agent-memory/codemap.md`

## Files To Edit

- `src/bilibili/wbi.ts`
- `tests/bilibili-wbi.test.ts` only if the focused regression needs cleanup
- `docs/agent-memory/handoffs/2026-07-19-wbi-http-status-claude-report.md`

## Required Capability

- Use `diagnosing-bugs` and `vitest`.
- Use the project `test-baseline-builder` subagent to review the regression.
- Use the project `risk-reviewer` subagent after implementation.
- If a subagent stalls, finish the same bounded review and record that fact.

## Constraints

- Use the shortest root-cause fix; no retry abstraction or error hierarchy redesign.
- Preserve the explicit status before retry classification and on the final thrown error.
- Preserve transient-status retries, status-less transport retries, WBI caching, timeout conversion, key extraction, logging, and public interfaces.
- Do not touch credentials, package/release files, `dist/`, or unrelated dirty-worktree changes.
- Do not use Superpowers, commit, push, close the Issue, or change its labels.

## Execution Steps

1. Run the focused test and confirm the red result.
2. Trace the exact error object before `withRetry` and after the outer `catch`.
3. Make the minimum source edit that preserves status at both points.
4. Run the focused test, WBI/video coverage, full suite, build, and diff check.
5. Review for timeout/cache/retry regressions and write the report.

## Verification Commands

```powershell
npm test -- --run tests/bilibili-wbi.test.ts
npm test -- --run tests/bilibili-wbi.test.ts tests/bilibili-video-api.test.ts tests/retry.test.ts
npm test
npm run build
git diff --check
```

## Acceptance Criteria

- WBI HTTP 403 performs exactly one fetch.
- The final error has `statusCode: 403`.
- Allowed transient statuses and status-less transport failures remain retryable.
- Existing WBI/video behavior, timeout behavior, cache, logging, tool schemas, and response shapes remain unchanged.
- Full tests and build pass.
- Codemap is checked and changed only if navigation ownership changes.

## Things Not To Change

- Shared retry configuration or `NetworkError` constructor shape.
- WBI cache lifetime, signature algorithm, timeout duration, credentials, MCP tools, package metadata, or release workflow.
- Existing user changes outside Issue #13.

## Stop And Report If

- Preserving the status requires a broader retry-policy or error-model redesign.
- The focused test stays red after the minimal change.
- Verification fails for an unrelated or unclear reason.
- A secret is discovered.

## Expected Claude Report

Write `docs/agent-memory/handoffs/2026-07-19-wbi-http-status-claude-report.md` using the repository report template, including exact command results, files changed, subagents used, risks/skips, and Harness Artifacts status.
