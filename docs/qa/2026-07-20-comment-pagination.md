# QA Session: Comment Limit Pagination

- Date: 2026-07-20
- Version or commit: pre-release worktree after v1.6.3
- Owner: Codex
- Related ticket: GitHub Issue #9 and `docs/comment-limit-pagination-prd.md`
- QA type: MCP tool change / regression

## Scope

In scope:

- `get_video_comments` explicit limits from 1 through 50.
- Sequential page sizes no larger than 20.
- Early stop on empty or short pages.
- Detailed-mode reply expansion after top-level pagination.
- Cache separation for output-affecting comment options.

Out of scope:

- Live Bilibili comment availability and anti-bot behavior.
- Real Cookie validation.
- Client-specific rendering.

## Automated Evidence

- [x] `limit: 50` requests page sizes 20, 20, and 10.
- [x] Empty or short pages stop pagination.
- [x] Limits at or below 20 use one request.
- [x] Top-level results are truncated to the requested limit before reply expansion.
- [x] Detailed mode preserves child reply expansion.
- [x] Cache keys separate detail level, explicit limit, sort, and reply inclusion.
- [x] Tests are deterministic and do not use network or real credentials.

Evidence: `tests/bilibili-comments-tool.test.ts` and the full Vitest gate.

## Public Contract Review

- [x] Tool schema still accepts integer `limit` values from 1 through 50.
- [x] Tool names and response field names are unchanged.
- [x] Existing brief/detailed defaults are unchanged.
- [x] No credential value is present in tests or output fixtures.

## Manual And Live Checks

- [ ] Live Bilibili request with a video containing at least 50 accessible comments.
- [ ] Valid-Cookie comparison against the Bilibili page.
- [ ] Codex, Claude Desktop, and Cursor rendering checks.

These checks are not required to prove the deterministic pagination defect is fixed, but remain post-release compatibility observations.

## Result

- Overall result: pass with caveats
- Blocking issues: none from deterministic contract coverage
- Non-blocking caveats: live Bilibili and client-specific behavior not exercised
- Codemap: checked; ownership remains in `src/bilibili/comments.ts` and existing entries remain correct

