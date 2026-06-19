# Codex To Claude Handoff: structured error guidance

## Objective

Implement unified structured MCP error responses and bilingual operation guidance for network errors, access restrictions, paid videos, disabled comments, API rate limits, credential expiration, validation failures, and unavailable subtitles.

Use:

- `docs/superpowers/plans/2026-06-18-structured-error-guidance-implementation-plan.md`
- `docs/agent-memory/handoffs/2026-06-18-structured-error-guidance-task-ticket.md`

## Short Claude Code Goal Prompt

```text
请按 docs/superpowers/plans/2026-06-18-structured-error-guidance-implementation-plan.md 和 docs/agent-memory/handoffs/2026-06-18-structured-error-guidance-task-ticket.md 执行结构化错误改造：覆盖网络、访问受限、付费、评论关闭、API 限制等异常，保留 error/message/code/next_steps 兼容并补中英文字段。不要改 tool 名/schema，不要提交/推送/发布，不要暴露凭据；遇到新增 tool、外部研究或大重构就停止报告。
```

## Current State

- Existing MCP tool names are stable and must remain stable.
- `src/server/error-response.ts` currently builds simple generic and validation payloads.
- `COOKIE_EXPIRED` and `SUBTITLE_UNAVAILABLE` already have partial bilingual `next_steps` support.
- `src/utils/errors.ts` already defines `NetworkError`, `TimeoutError`, `BilibiliAPIError`, `PaidVideoError`, `NoSubtitleError`, and `CommentsDisabledError`.
- `src/bilibili/comments.ts` currently catches `CommentsDisabledError` and returns a successful empty comments result; this task should change that to a structured MCP error.
- `src/bilibili/http.ts` retries 429 responses but does not consistently preserve HTTP status in `NetworkError`, which blocks reliable `API_RATE_LIMITED` mapping.
- Several Markdown files contain legacy mojibake; do not copy corrupted text into new documentation.

## Files To Inspect

- `AGENTS.md`
- `CLAUDE.md`
- `docs/agent-memory/agent-communication.md`
- `docs/agent-memory/codemap.md`
- `docs/templates/qa-checklist.md`
- `src/utils/errors.ts`
- `src/utils/credential-guidance.ts`
- `src/server/error-response.ts`
- `src/server/tool-handlers.ts`
- `src/bilibili/http.ts`
- `src/bilibili/comments.ts`
- `tests/server-error-next-steps.test.ts`
- `tests/bilibili-comments-tool.test.ts`
- `README.md`
- `README_EN.md`

## Files To Edit

- Create `src/utils/error-guidance.ts`
- Modify `src/server/error-response.ts`
- Modify `src/server/tool-handlers.ts`
- Modify `src/bilibili/http.ts`
- Modify `src/bilibili/comments.ts`
- Modify focused tests under `tests/`
- Modify `README.md`
- Modify `README_EN.md`
- Create `docs/qa/2026-06-18-structured-error-guidance.md`
- Update `docs/agent-memory/codemap.md` if the new utility changes navigation

## Required Capability

- Use `superpowers:executing-plans` or `superpowers:subagent-driven-development`.
- Use the `vitest` skill because this task adds and changes tests.
- Use `risk-reviewer` before final report because this changes public MCP error behavior.
- Use `codebase-design` only if the implementation grows beyond the planned single shared formatter.

## Constraints

- Do not add, remove, or rename MCP tools.
- Do not change tool input schemas.
- Preserve backward-compatible fields: `error`, `message`, `code`, `next_steps`.
- Add explicit fields: `message_en`, `message_zh`, `next_steps_en`, `next_steps_zh`, `category`, `retryable`, `user_action_required`, and safe `details`.
- Do not include full Cookie values, `.env` contents, npm tokens, GitHub tokens, or Anthropic/Zhipu API keys in code, tests, docs, logs, or reports.
- Do not commit, push, tag, publish, or create a GitHub Release.
- Do not touch unrelated dirty harness files.
- Keep `details` minimal and sanitized; do not include request headers or credential-bearing URLs.

## Execution Steps

1. Follow `docs/superpowers/plans/2026-06-18-structured-error-guidance-implementation-plan.md` task by task.
2. Start with failing Vitest coverage for all named categories.
3. Add the shared formatter in `src/utils/error-guidance.ts`.
4. Refactor server error payload construction to use the formatter.
5. Preserve HTTP status in `NetworkError` so 429 maps to `API_RATE_LIMITED`.
6. Let `CommentsDisabledError` propagate and return `COMMENTS_DISABLED` from the MCP layer.
7. Update bilingual README documentation.
8. Create and fill the QA checklist.
9. Check codemap freshness.
10. Run focused tests, full tests, build, and secret-pattern diff scan.

## Verification Commands

```bash
npm test -- tests/server-error-next-steps.test.ts tests/bilibili-comments-tool.test.ts
npm test
npm run build
rg -n "COMMENTS_DISABLED|API_RATE_LIMITED|PAID_VIDEO|ACCESS_DENIED|NETWORK_ERROR|NETWORK_TIMEOUT" src tests README.md README_EN.md
git diff -- README.md README_EN.md src tests docs/qa docs/agent-memory/codemap.md | Select-String -Pattern "SESSDATA|bili_jct|DedeUserID|ANTHROPIC_AUTH_TOKEN|npm_[A-Za-z0-9]|ghp_[A-Za-z0-9]|sk-[A-Za-z0-9]" -CaseSensitive
```

## Acceptance Criteria

- Every abnormal case named by the ticket has a structured MCP payload.
- Chinese and English users can understand the error and the next action.
- Existing clients that read `message`, `code`, or `next_steps` still work.
- Disabled comments are no longer silently reported as successful empty comments.
- Build and tests pass.
- Documentation matches implementation.
- QA checklist exists.
- Codemap is updated or explicitly checked unchanged.
- No secrets are exposed.

## Things Not To Change

- No release/version/tag/npm publish work.
- No MCP install guidance rewrite outside the relevant error-response documentation.
- No credential storage behavior change.
- No broad Bilibili client split.
- No Smithery files.

## Stop And Report If

- You find a real credential or token in tracked files.
- You need external Bilibili API research to classify error codes beyond the local code behavior.
- You need to add or change MCP tool schemas.
- The shared formatter would require a broad architecture refactor.
- Required verification fails for unclear or unrelated reasons.

## Expected Claude Report

Return a Markdown report using `docs/agent-memory/agent-communication.md`:

- Summary
- Files changed
- Commands run and command results
- Structured error codes implemented
- One sample payload or test assertion for English and Chinese guidance
- Risks or skipped checks
- Harness Artifacts section covering task ticket, research note, QA checklist, codemap, harness-security, and harness-eval
- Decision points
- Suggested Codex review focus
