# Codex To Claude Handoff: Comment Limit Pagination

## Objective

Implement GitHub Issue #9 so `get_video_comments` honors the documented top-level comment `limit` range of 1-50 even though each upstream page is capped at 20.

Planning source: `docs/comment-limit-pagination-prd.md`.

## Current State

- `src/utils/validation.ts`, `src/server/tool-schemas.ts`, `README.md`, and `README_EN.md` all define `limit` as 1-50.
- `src/bilibili/comments-api.ts` caps `ps` to 20.
- `src/bilibili/comments.ts` currently calls `getVideoComments` once for page 1, so limits above 20 are silently under-fulfilled.
- The worktree contains other user-authorized, uncommitted changes for Issues #2-#8. Preserve all of them.

## Files To Inspect

- `docs/comment-limit-pagination-prd.md`
- `src/bilibili/comments.ts`
- `src/bilibili/comments-api.ts`
- `src/bilibili/types.ts`
- `tests/bilibili-comments-tool.test.ts`
- `docs/agent-memory/codemap.md`

## Files To Edit

Expected:

- `src/bilibili/comments.ts`
- `tests/bilibili-comments-tool.test.ts`
- `docs/agent-memory/handoffs/2026-07-19-comment-limit-pagination-claude-report.md`

Edit other files only if directly necessary, and explain why in the report.

## Required Capability

- Use the installed `vitest` skill because this task changes tests.
- Invoke the project Claude subagent `test-baseline-builder` for a bounded review of the failing-first regression and final test design. If it does not return promptly, record that and complete the same scoped verification in the top-level task.
- After implementation, invoke the project Claude subagent `risk-reviewer` for a bounded regression review. If it does not return promptly, record that and perform the same checklist in the top-level task.
- Do not use any `superpowers:*` skill.

## Constraints

- Use test-driven development: add a deterministic failing regression first and record the failure reason before changing production code.
- Keep public tool names, schema, validation, response shape, sorting, cache behavior, and error behavior unchanged.
- `limit` counts top-level comments. Existing detailed-mode expansion of child replies may make the final processed array longer than `limit`; preserve it.
- Fetch pages sequentially, not in parallel.
- Each request page size must be at most 20.
- Stop when the requested top-level count is reached, a page is empty, or a page returns fewer top-level comments than requested for that page.
- Truncate merged top-level comments to the requested count defensively.
- Preserve limits at or below 20 as a single request with the existing requested page size.
- Do not redesign `getVideoComments`, add public cursor parameters, change README/schema range, add network tests, touch credentials, commit, or push.
- Do not revert or rewrite unrelated dirty-worktree changes.

## Execution Steps

1. Inspect the current diff around the expected files so Issue #8 edits remain intact.
2. Add a failing Vitest regression for `limit: 50` that returns deterministic per-page replies and proves requests `(page 1, 20)`, `(page 2, 20)`, `(page 3, 10)` plus 50 retained top-level comments.
3. Add an early-stop regression for an empty or short page; avoid over-specifying internal structure.
4. Run the focused test and record the expected pre-fix failure.
5. Implement the smallest sequential pagination loop in `src/bilibili/comments.ts`.
6. Run focused comment tests, full tests, and build.
7. Run the required bounded subagent reviews and address only same-scope findings.
8. Write the Claude report with exact commands/results and Harness Artifacts status.

## Verification Commands

```powershell
npx vitest run tests/bilibili-comments-tool.test.ts
npm test
npm run build
git diff --check
```

Also inspect the final diff for only Issue #9 additions relative to the already dirty worktree.

## Acceptance Criteria

- A `limit: 50` request collects up to 50 available top-level comments through page sizes 20, 20, and 10.
- Pagination stops early on empty or short pages.
- Limits at or below 20 still make one request.
- Detailed-mode reply expansion remains unchanged.
- Focused tests, full tests, build, and `git diff --check` pass.
- The report names the `vitest` skill and both requested subagent outcomes.
- Codemap is checked and either updated if ownership/navigation changed or explicitly reported unchanged.

## Things Not To Change

- Public MCP schemas, validation range, READMEs, response fields, cache key format, comment sorting, or lower-level API fallback behavior.
- Credential, subtitle, HTTP throttle, smoke-test, package, release, hook, or harness files outside the required report.
- Any existing user changes for Issues #2-#8.

## Stop And Report If

- Correct pagination requires a public schema or response-shape change.
- Upstream page semantics cannot be represented with the existing `page` and `pageSize` parameters.
- A required test fails for an unrelated reason that cannot be isolated.
- The change would require a broad refactor or a new network-dependent fixture.
- A credential or secret is encountered.

## Expected Claude Report

Write `docs/agent-memory/handoffs/2026-07-19-comment-limit-pagination-claude-report.md` with:

- summary and files changed
- failing-first command and observed failure
- all final commands and results
- subagent usage and outcomes
- risks, skipped checks, and decision points
- Harness Artifacts section covering Issue #9, PRD, research note, QA checklist, codemap, harness-security, and harness-eval
- suggested Codex review focus
