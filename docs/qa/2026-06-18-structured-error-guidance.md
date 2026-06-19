# QA Checklist: Structured MCP Error Guidance

## QA Session

- Title: Structured MCP error guidance bilingual payload
- Date: 2026-06-18
- Version or commit: pre-release working tree (v1.6.1)
- Owner: Claude Code
- Related ticket, plan, PRD, or release: `docs/agent-memory/handoffs/2026-06-18-structured-error-guidance-task-ticket.md`, `docs/superpowers/plans/2026-06-18-structured-error-guidance-implementation-plan.md`
- QA type: `MCP tool change`

## Scope

In scope:

- Unified structured error payload across all MCP tool error paths.
- Bilingual `message_en` / `message_zh` / `next_steps_en` / `next_steps_zh` fields.
- New error codes: `NETWORK_ERROR`, `NETWORK_TIMEOUT`, `API_RATE_LIMITED`, `ACCESS_DENIED`, `PAID_VIDEO`, `COMMENTS_DISABLED`, `BILIBILI_API_ERROR`, `UNKNOWN_ERROR`, plus existing `VALIDATION_ERROR`, `COOKIE_EXPIRED`, `SUBTITLE_UNAVAILABLE`.
- Backward compatibility: `error`, `message`, `code`, `next_steps` remain.
- `CommentsDisabledError` no longer masquerades as an empty successful result.
- HTTP status codes flow into `NetworkError` so HTTP 429 can map to `API_RATE_LIMITED`.

Out of scope:

- Tool name or input schema changes.
- Package version bump, tag, GitHub Release, or npm publish.
- Bilibili credential value changes.
- Full Bilibili client refactor.
- Smithery configuration.

## Preconditions

- [x] Current branch and commit recorded: `master`, working tree.
- [x] Expected package version recorded: v1.6.1 (no bump for this task).
- [x] Required credentials are available only through approved external sources, not pasted into this file.
- [x] Test Bilibili video IDs or URLs are safe to share (`BV1T6PQzQErF` fixture).
- [x] MCP client or local CLI environment is identified: local Node.js + Vitest.

## Automated Baseline

Run when relevant:

```bash
npm run build
npm test
npm pack --dry-run
```

Results:

- Build: pass (TypeScript compilation clean after fix in `src/server/error-response.ts`).
- Tests: 16 files, 155 tests passed (0 failed) after mapper refactor, handler cleanup, HTTP status propagation, CommentsDisabledError propagation, and Codex review coverage for handler validation errors plus generic Bilibili API error mapping.
- Pack: not run; no package metadata or publish-contents change in this task.
- Skipped checks and reason: `npm pack --dry-run` not run because package files are untouched.

## Package And Install Path

- [x] `package.json` version unchanged (no release bump in scope).
- [x] `npm pack --dry-run` not required for this task (no package metadata or publish-contents change).
- [x] Local `bin`, `main`, `module`, and `types` still point to built `dist` output.

Notes:

- Task ticket explicitly excludes `package.json` / `package-lock.json` edits unless a test dependency is required; none was required.

## MCP Stdio And Tool Discovery

- [x] Starting the MCP server does not print non-JSON logs to stdout before JSON-RPC traffic.
- [x] `tools/list` returns the expected tool names (unchanged).
- [x] Tool descriptions do not expose credentials or misleading setup instructions.
- [x] Tool schemas match the intended public interface (unchanged).

Expected tools (unchanged):

- `get_credential_setup_instructions`
- `check_bilibili_credentials`
- `check_mcp_update`
- `get_video_info`
- `get_video_transcript`
- `get_video_metadata`
- `get_video_comments`

Notes:

- No tool name or input schema was changed in this task.

## Credential States

Do not paste full Cookie values into this checklist.

- [x] No credentials: setup guidance is actionable and does not leak secrets.
- [x] Invalid or expired credentials: `COOKIE_EXPIRED` code and bilingual `next_steps` are useful and do not leak secrets.
- [x] Valid credentials: `check_bilibili_credentials` reports configured/login status without exposing Cookie values.
- [x] Credential setup flow points users to `npx -y @xzxzzx/bilibili-mcp config` and `npx -y @xzxzzx/bilibili-mcp check` when relevant.

Notes:

- `COOKIE_EXPIRED` payload still routes through `buildCredentialNextStepsEn` / `buildCredentialNextStepsZh`; `details.api_code` carries the stable string `COOKIE_EXPIRED`, not the raw Bilibili numeric code.

## Tool Workflows

Use safe test videos and avoid recording private user data.

- [x] `get_video_metadata` returns stable metadata fields.
- [x] `get_video_info` returns expected video info and subtitle/description behavior.
- [x] `get_video_transcript` handles available subtitles.
- [x] `get_video_transcript` handles unavailable subtitles with clear fallback guidance (`fallback_to_description: true`).
- [x] `get_video_comments` respects `detail_level`, `limit`, `sort`, and `include_replies`.
- [x] Validation errors are structured and useful for invalid BV IDs, URLs, language codes, or comment options.

New structured-error coverage exercised by `tests/server-error-next-steps.test.ts`:

- [x] Validation failures return `VALIDATION_ERROR` with bilingual guidance.
- [x] Expired credentials return `COOKIE_EXPIRED` with bilingual `next_steps`.
- [x] Unavailable subtitles return `SUBTITLE_UNAVAILABLE` with bilingual fallback step.
- [x] Network failures return `NETWORK_ERROR`, `category: network`, `retryable: true`.
- [x] Timeouts return `NETWORK_TIMEOUT`, `retryable: true`.
- [x] HTTP 429 returns `API_RATE_LIMITED`, `category: rate_limit`, `user_action_required: true`.
- [x] Access-denied API errors return `ACCESS_DENIED` with bilingual guidance.
- [x] Paid videos return `PAID_VIDEO` with bilingual guidance.
- [x] Comments-disabled errors from `get_video_comments` return `COMMENTS_DISABLED` (no silent empty list).

Notes:

- Live Bilibili API calls are intentionally out of scope; coverage uses mocked error throws to assert category mapping and bilingual guidance.
- `details.status_code` is populated from `NetworkError.statusCode` only when the HTTP layer passes it through.

## Client Compatibility

Mark untested clients explicitly.

| Client | Version | Install method | Result | Notes |
|--------|---------|----------------|--------|-------|
| Claude Desktop |  |  | not tested | Live client test not in scope; only structured payload shape verified. |
| Cursor |  |  | not tested | Same as above. |
| Codex |  |  | not tested | Same as above. |
| Other |  |  | not tested | Backward-compatible `error`/`message`/`code`/`next_steps` fields preserved. |

## Documentation Checks

- [x] README install command matches actual package behavior.
- [x] Credential setup docs do not suggest putting Cookie values in MCP client config.
- [x] README and README_EN agree on the supported setup path.
- [x] Changelog or release notes mention user-visible changes: deferred 鈥?no release bump in this task; a release note should accompany the next version bump that ships this change.
- [x] Known limitations are documented when behavior is intentionally partial.

Notes:

- README.md and README_EN.md now document the unified structured error payload, field semantics, and the full error-code table.
- Behavior change: disabled comments no longer return an empty success result; documented in the error-code table and release-note follow-up.

## Security And Privacy Checks

- [x] No full Cookie values, npm tokens, GitHub tokens, `.env` content, or private credentials appear in logs, reports, docs, tests, or package output.
- [x] Error messages and retry logs redact credential-like values.
- [x] External inputs are validated before Bilibili API calls.
- [x] Network responses that may be large or redirected are bounded or rejected according to current policy.
- [x] `details` field intentionally excludes URLs and query strings; only numeric HTTP status, timeout in ms, and stable string API codes are emitted.

Notes:

- Verified by `rg -n` scans of `COMMENTS_DISABLED|API_RATE_LIMITED|PAID_VIDEO|ACCESS_DENIED|NETWORK_ERROR|NETWORK_TIMEOUT` in source, tests, and docs (Task 6).
- Verified by `git diff` review of README/README_EN/source/tests for credential-like patterns.

## Result

- Overall result: `pass with caveats`
- Blocking issues: none.
- Non-blocking caveats:
  - Live client compatibility is not tested; the payload shape and field semantics are verified through unit tests.
  - `npm pack --dry-run` was not run because the package file set did not change.
  - A release-note entry should accompany the version bump that ships this change (out of scope for this task).
- Follow-up tickets: none created.
- Codemap update status: updated; `src/utils/error-guidance.ts` is listed under Utilities.
- Research note link, if external facts affected QA: not applicable; no external Bilibili API documentation was used.
