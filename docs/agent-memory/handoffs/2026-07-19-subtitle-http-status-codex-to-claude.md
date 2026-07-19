# Codex To Claude Handoff: Preserve Subtitle HTTP Status

## Objective

Implement GitHub Issue #12 so an explicit non-retryable subtitle HTTP status such as 403 is preserved on `NetworkError` and fails after one request.

## Current State

- Codex added a failing-first regression in `tests/bilibili-video-api.test.ts`.
- The focused command fails in about 0.6 seconds: the 403 path performs four fetches and the final error has `statusCode: undefined`.
- Root-cause hypothesis: `src/bilibili/video-api.ts` omits `response.status` when constructing `NetworkError`.
- The worktree contains many earlier authorized, uncommitted changes. Preserve them.

## Files To Inspect

- `src/bilibili/video-api.ts`
- `src/bilibili/http.ts`
- `src/utils/errors.ts`
- `src/utils/retry.ts`
- `tests/bilibili-video-api.test.ts`
- `docs/agent-memory/codemap.md`

## Files To Edit

- `src/bilibili/video-api.ts`
- `tests/bilibili-video-api.test.ts` only if the existing focused regression needs cleanup
- `docs/agent-memory/handoffs/2026-07-19-subtitle-http-status-claude-report.md`

## Required Capability

- Use the `vitest` skill.
- Ask the project `test-baseline-builder` subagent to review the regression test.
- Ask the project `risk-reviewer` subagent to review the completed diff.
- If a named subagent stalls, complete the same bounded work yourself and record the stall and your replacement review in the report.

## Constraints

- Make the smallest root-cause fix; do not redesign retry policy.
- Preserve retries for 408, 429, 500, 502, 503, 504 and status-less transport errors.
- Preserve redirect rejection, subtitle host validation, response-size limits, MCP tool schemas, and response shapes.
- Do not edit `dist/`, commit, push, close the issue, or change labels.
- Do not expose credentials or Cookie values.
- Do not use Superpowers skills.

## Execution Steps

1. Run the focused red test and confirm its exact failure.
2. Verify that the response status is present before `NetworkError` construction and absent afterward.
3. Apply the minimal source fix.
4. Run the focused regression and the full video API test file.
5. Run the full test suite and build.
6. Review the scoped diff for retry regressions and accidental unrelated edits.
7. Write the requested report.

## Verification Commands

```powershell
npm test -- --run tests/bilibili-video-api.test.ts -t "does not retry a non-retryable subtitle HTTP status"
npm test -- --run tests/bilibili-video-api.test.ts
npm test
npm run build
git diff --check
```

## Acceptance Criteria

- Subtitle HTTP 403 performs exactly one fetch.
- The resulting error preserves `statusCode: 403`.
- Existing video API tests pass.
- Full `npm test` and `npm run build` pass.
- No public MCP tool name, schema, or response shape changes.
- Codemap is checked and reported unchanged unless navigation ownership actually changes.

## Things Not To Change

- Shared retry allowlists or retry count/delay policy.
- Credential handling, comment flows, package/release files, agent harness, or unrelated tests.
- Existing user changes in the dirty worktree.

## Stop And Report If

- The minimal status propagation does not turn the focused regression green.
- A broader retry or error-model redesign appears necessary.
- Required verification fails for an unrelated or unclear reason.
- A secret is discovered.

## Expected Claude Report

Write `docs/agent-memory/handoffs/2026-07-19-subtitle-http-status-claude-report.md` using the repository report template, including files changed, commands and exact results, subagents used or stalled, risks/skips, and Harness Artifacts status.
