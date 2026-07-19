# Codex To Claude Handoff: Fingerprint Timeout Cleanup

## Objective

Implement GitHub Issue #15 so `getBuvid()` always clears its existing request timeout while preserving its optional `null` fallback.

## Current State

- `tests/bilibili-fingerprint.test.ts` is a failing-first regression added by Codex.
- It completes in about 0.25 seconds: rejected fetch resolves `null`, but `clearTimeout` is called zero times.
- Preserve every prior uncommitted change in the dirty worktree.

## Files To Inspect

- `src/bilibili/fingerprint.ts`
- `tests/bilibili-fingerprint.test.ts`
- fingerprint callers in `src/bilibili/comments-api.ts` and `src/bilibili/video-api.ts`
- `docs/agent-memory/codemap.md`

## Files To Edit

- `src/bilibili/fingerprint.ts`
- `tests/bilibili-fingerprint.test.ts` only if cleanup is needed
- `docs/agent-memory/handoffs/2026-07-19-fingerprint-timeout-cleanup-claude-report.md`

## Required Capability

- Use `diagnosing-bugs` and `vitest`.
- Use `test-baseline-builder` to review the regression.
- Use `risk-reviewer` to review the scoped diff; if it stalls, complete the same checklist at top level and report that.

## Constraints

- Smallest fix: guarantee cleanup of the existing timer; no helper, abstraction, dependency, retry, or new error type.
- Preserve `null` fallback, one fetch attempt, cache lifetime, response validation, logging, callers, and public interfaces.
- Do not touch WBI, shared HTTP/retry, credentials, package/release files, `dist/`, or unrelated changes.
- Do not use Superpowers, commit, push, close the Issue, or change labels.

## Execution Steps

1. Run the focused red test.
2. Move the existing timer cleanup to the minimum guaranteed-cleanup structure.
3. Run focused fingerprint and related caller tests, full suite, build, and diff check.
4. Complete both reviews and write the report.

## Verification Commands

```powershell
npm test -- --run tests/bilibili-fingerprint.test.ts
npm test -- --run tests/bilibili-fingerprint.test.ts tests/bilibili-video-api.test.ts tests/bilibili-comments-tool.test.ts
npm test
npm run build
git diff --check
```

## Acceptance Criteria

- Rejected fetch still resolves `null`.
- Its timeout is cleared exactly once.
- No retry or public behavior changes.
- Related/full tests and build pass; codemap is checked.

## Things Not To Change

- Fingerprint fallback, cache, response schema, caller behavior, shared networking, credentials, package/release flow, or existing user changes.

## Stop And Report If

- Guaranteed cleanup cannot be added without changing fallback/retry behavior.
- Related tests fail for an unclear reason.
- A secret is discovered.

## Expected Claude Report

Write `docs/agent-memory/handoffs/2026-07-19-fingerprint-timeout-cleanup-claude-report.md` with exact commands/results, diff summary, skills/subagents, risks/skips, and Harness Artifacts status.
