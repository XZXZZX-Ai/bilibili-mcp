# Codex To Claude Handoff: Redundant Comment Metadata Request

## Update Goal

Implement GitHub Issue #8: https://github.com/XZXZZX-Ai/bilibili-mcp/issues/8

Remove the redundant outer video-metadata request from uncached comment processing.

## Current Judgment

`getVideoCommentsData` imports `getVideoInfo`, calls it, and stores `videoData.cid`, but `cid` is never read. The function then calls `getVideoComments`; the real implementation in `comments-api.ts` correctly performs its own metadata lookup to compute `oid = aid || cid`.

Codex added a deterministic red regression in `tests/bilibili-comments-tool.test.ts`. With `getVideoComments` mocked, the outer function still calls `mockGetVideoInfo` once. That isolates the redundant outer call.

## Recommended Approach

Delete `getVideoInfo` from the `comments.ts` import and delete the unused metadata-fetch/comment lines. Do not move, parameterize, or refactor the required lookup in `comments-api.ts`.

## Files To Inspect

- `C:/Users/ZX/bilibili-mcp/src/bilibili/comments.ts`
- `C:/Users/ZX/bilibili-mcp/src/bilibili/comments-api.ts`
- `C:/Users/ZX/bilibili-mcp/src/bilibili/client.ts`
- `C:/Users/ZX/bilibili-mcp/tests/bilibili-comments-tool.test.ts`
- `C:/Users/ZX/bilibili-mcp/docs/agent-memory/codemap.md`

## Files To Edit

- Expected: `C:/Users/ZX/bilibili-mcp/src/bilibili/comments.ts`
- Edit the Codex-authored regression only if a correctness problem is demonstrated.
- Write the report to `C:/Users/ZX/bilibili-mcp/docs/agent-memory/handoffs/2026-07-19-redundant-comment-metadata-claude-report.md`.

## Required Capability

- Use `diagnosing-bugs` and the existing red-capable focused test.
- Use the installed `vitest` skill.
- Use the project `test-baseline-builder` subagent for a bounded regression review.
- Use the project `risk-reviewer` after editing to confirm request ownership and behavior preservation.
- If a subagent stalls, complete the same bounded review at top level and report it. Do not create an agent tree.
- `codebase-design` is intentionally not used because ownership and interfaces remain unchanged; this deletes a dead caller-side request.
- Do not use Superpowers skills.

## Constraints

- Preserve the required `getVideoInfo` call in `comments-api.ts`.
- Preserve cache keys, cache hit behavior, page size, sort, includeReplies, reply processing, errors, and response shapes.
- Do not add a new parameter or pass metadata between layers.
- Keep tests deterministic and network-free.
- Do not edit generated `dist/` output.
- Preserve unrelated dirty-worktree changes.
- Do not stage, commit, or push.

## Claude Code Execution Steps

1. Read the handoff and listed files; trace both metadata call sites.
2. Run the focused regression before editing and confirm one unexpected outer call.
3. Run the bounded test review.
4. Delete only the unused outer import, request, assignment, and now-stale comment.
5. Run the focused test, full comments test file, full suite, build, and diff check.
6. Search `comments.ts` for remaining `getVideoInfo`/unused `cid` references and confirm `comments-api.ts` still owns the real lookup.
7. Run the bounded risk review and address only same-scope findings.
8. Check `codemap.md`; leave unchanged unless navigation/ownership changes.
9. Write the required report.

## Verification Commands

```powershell
$env:PATH='D:\Node24;' + $env:PATH
npm test -- --run tests/bilibili-comments-tool.test.ts -t "does not fetch video metadata before delegating to the comments API"
npm test -- --run tests/bilibili-comments-tool.test.ts
npm test
npm run build
git diff --check
rg -n "getVideoInfo|const cid" src/bilibili/comments.ts src/bilibili/comments-api.ts
```

## Acceptance Criteria

- The outer `getVideoCommentsData` path no longer calls or imports `getVideoInfo`.
- `comments-api.ts` still fetches metadata and computes `aid || cid`.
- Focused regression, all comments tests, full suite, build, and diff checks pass.
- Cache and public comment behavior remain unchanged.
- No abstraction, dependency, production interface, secret, commit, or push change.

## Things To Avoid

- Do not remove the metadata lookup from `comments-api.ts`.
- Do not add metadata/oid parameters to `getVideoComments`.
- Do not refactor the compatibility re-export module.
- Do not combine this with comment API fallback or cache changes.
- Do not remove the test mock merely because production no longer imports it.

## Risks

- Removing the wrong lookup would leave comment requests without a valid oid.
- Broad signature changes would create unnecessary interface churn.
- Cache hits should remain request-free and cache misses should still make exactly the required lower-layer request.

## Stop And Report If

- The outer `cid` is used through a path Codex missed.
- The fix requires changing `getVideoComments` parameters or public behavior.
- The focused red failure cannot be reproduced.
- Required verification fails for a new unrelated reason.
- A secret is discovered.

## Expected Claude Report

Use the repository report template. Include exact deletion, red/green evidence, commands/results, subagent conclusions, confirmation that `comments-api.ts` retains metadata ownership, risks/skips, complete Harness Artifacts, and suggested Codex review focus.
