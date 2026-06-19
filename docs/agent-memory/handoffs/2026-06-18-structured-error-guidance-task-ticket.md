# Task Ticket: Structured MCP Error Guidance

- ID: `2026-06-18-structured-error-guidance`
- Title: Unify structured MCP error payloads and bilingual recovery guidance
- Status: `ready`
- Owner: `Claude Code`
- Source: User request on 2026-06-18
- Parent plan or PRD: `docs/superpowers/plans/2026-06-18-structured-error-guidance-implementation-plan.md`
- Blocking tickets: none
- Blocked by: none

## Objective

Make network failures, access restrictions, paid videos, disabled comments, API rate limits, credential expiration, validation failures, and unavailable subtitles return one consistent structured MCP error payload with English and Chinese recovery guidance.

## Scope

In scope:

- Add a reusable structured error payload builder.
- Use the builder from generic MCP error handling and tool-specific validation/error branches.
- Preserve existing public tool names and input schemas.
- Preserve backward-compatible fields already used by clients: `error`, `message`, `code`, `next_steps`.
- Add explicit `message_en`, `message_zh`, `next_steps_en`, `next_steps_zh`, `category`, `retryable`, `user_action_required`, and safe `details`.
- Stop silently converting `CommentsDisabledError` into an empty comments result; return a structured MCP error instead.
- Add Vitest coverage for each mapped error category.
- Update README and README_EN error-response documentation.
- Create/update a QA checklist for this MCP public response change.
- Check `docs/agent-memory/codemap.md` and update it if the new utility changes navigation.

Out of scope:

- No new MCP tool names.
- No package version bump, tag, GitHub Release, or npm publish.
- No Bilibili credential value changes.
- No full Bilibili client refactor.
- No Smithery configuration.

## Files To Inspect Or Edit

Expected inspect:

- `src/utils/errors.ts`
- `src/server/error-response.ts`
- `src/server/tool-handlers.ts`
- `src/bilibili/http.ts`
- `src/bilibili/comments.ts`
- `tests/server-error-next-steps.test.ts`
- `tests/bilibili-comments-tool.test.ts`
- `README.md`
- `README_EN.md`
- `docs/agent-memory/codemap.md`

Expected edit:

- Create `src/utils/error-guidance.ts`
- Modify `src/server/error-response.ts`
- Modify `src/server/tool-handlers.ts`
- Modify `src/bilibili/http.ts`
- Modify `src/bilibili/comments.ts`
- Modify or add focused tests under `tests/`
- Modify `README.md`
- Modify `README_EN.md`
- Create `docs/qa/2026-06-18-structured-error-guidance.md`
- Modify `docs/agent-memory/codemap.md` only if needed

Do not touch:

- `.env`, local credential files, or Cookie values
- `package.json` / `package-lock.json` unless a test dependency is truly required
- `.github/workflows/`
- release tags or GitHub Releases
- unrelated dirty harness files

## Required Capabilities

Skills:

- `superpowers:executing-plans` or `superpowers:subagent-driven-development`
- `vitest`
- `codebase-design` if the shared formatter interface becomes broader than this ticket

Subagents:

- `test-baseline-builder` for focused Vitest additions if Claude Code delegates test work
- `risk-reviewer` before reporting completion, because this changes MCP public error behavior

MCP/tools/CLI:

- `rg` for code discovery
- `npm run build`
- `npm test`
- `npm test -- tests/server-error-next-steps.test.ts tests/bilibili-comments-tool.test.ts`

If a listed capability is unavailable, report it and use the closest safe fallback.

## Execution Steps

1. Write failing tests for the structured payload contract and each mapped category.
2. Add `src/utils/error-guidance.ts` with a single mapping function.
3. Refactor `src/server/error-response.ts` to use the new builder.
4. Refactor `src/server/tool-handlers.ts` so validation, subtitle, cookie, and generic errors use the same builder.
5. Pass HTTP status codes into `NetworkError` for non-OK Bilibili HTTP responses so `429` can map to API rate limiting.
6. Stop swallowing `CommentsDisabledError` in `src/bilibili/comments.ts`; let the server return `COMMENTS_DISABLED`.
7. Update README and README_EN with the unified payload shape and error-code table.
8. Create the QA checklist for the public MCP response change.
9. Check codemap freshness.
10. Run focused tests, full tests, and build.

## Acceptance Criteria

- [ ] All MCP tool error responses use the same top-level structured payload shape where practical.
- [ ] Existing fields `error`, `message`, `code`, and `next_steps` remain available for compatibility.
- [ ] New fields `category`, `message_en`, `message_zh`, `next_steps_en`, `next_steps_zh`, `retryable`, and `user_action_required` are present for mapped errors.
- [ ] `COOKIE_EXPIRED` still points to `npx -y @xzxzzx/bilibili-mcp@latest config` and `check` without exposing Cookie values.
- [ ] `SUBTITLE_UNAVAILABLE` still suggests `fallback_to_description: true` where appropriate.
- [ ] `NETWORK_ERROR` / `NETWORK_TIMEOUT` guidance tells users to retry later and check network/proxy/firewall.
- [ ] `ACCESS_DENIED` guidance tells users to check login, region/access permissions, or private/restricted video state.
- [ ] `PAID_VIDEO` guidance tells users the video may require purchase/membership and the MCP cannot bypass access.
- [ ] `COMMENTS_DISABLED` is returned as a structured MCP error instead of a silent empty comments list.
- [ ] `API_RATE_LIMITED` maps from HTTP 429 or known Bilibili API limit signals when safely detectable.
- [ ] Unknown API failures still return a safe generic structured Bilibili API error.
- [ ] No credentials, Cookies, tokens, `.env` content, or private values are printed or committed.
- [ ] Public MCP tool names and input schemas remain stable.
- [ ] `docs/agent-memory/codemap.md` is updated if module ownership or MCP tool flow changed; otherwise the report says it was checked and left unchanged.

## Verification

Required commands:

```bash
npm test -- tests/server-error-next-steps.test.ts tests/bilibili-comments-tool.test.ts
npm test
npm run build
```

Recommended scans:

```bash
rg -n "COMMENTS_DISABLED|API_RATE_LIMITED|PAID_VIDEO|ACCESS_DENIED|NETWORK_ERROR|NETWORK_TIMEOUT" src tests README.md README_EN.md
git diff -- README.md README_EN.md src tests docs/qa docs/agent-memory/codemap.md
```

Manual checks:

- Inspect one JSON payload example in tests and confirm both Chinese and English fields are understandable.
- Confirm `next_steps` remains compatible with the existing English array behavior.
- Confirm no added test fixture contains real Cookie-like values.

## Risks And Rollback

Risks:

- Some clients may have relied on disabled comments returning an empty list. This is an intentional behavior change but must be documented.
- Too much detail in `details` could leak URLs or credential-like query data. Keep `details` minimal and sanitized.
- Mapping every Bilibili API code too aggressively could mislead users. Prefer conservative categories when unsure.

Rollback:

- Revert the structured formatter and handler changes as one commit if public error behavior regresses.
- If only the comments behavior is problematic, restore the previous empty-comments fallback and keep the formatter for other errors.

## Stop And Report Conditions

Stop before editing further and report if:

- A real credential or Cookie appears in tracked files or test output.
- Implementing the category mapping requires external Bilibili API research beyond local behavior and tests.
- The implementation needs new MCP tool schemas or tool names.
- Required tests fail for reasons not directly caused by this task.
- The shared formatter starts requiring a broad cross-module refactor.

## Completion Report

Return:

- Files changed
- Commands run and results
- Structured error codes implemented
- Payload example for one English and one Chinese guidance path
- Skipped checks and why
- Subagent/skill/tool capabilities used
- QA checklist path
- Codemap update status
- Unresolved risks or decision points
