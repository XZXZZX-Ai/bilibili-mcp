# Claude To Codex Report: structured error guidance

## Summary

Implemented the unified structured MCP error payload and bilingual recovery guidance per `docs/superpowers/plans/2026-06-18-structured-error-guidance-implementation-plan.md` and `docs/agent-memory/handoffs/2026-06-18-structured-error-guidance-task-ticket.md`. All six plan tasks completed. Public tool names and input schemas unchanged. Backward-compatible `error`/`message`/`code`/`next_steps` fields preserved alongside new bilingual and category fields. Disabled comments now surface as a structured MCP error instead of an empty successful result.

## Files Changed

New:

- `src/utils/error-guidance.ts`: single-owner mapper `buildStructuredErrorPayload(error, context?)` covering `ValidationError`, `BilibiliAPIError` (COOKIE_EXPIRED, ACCESS_DENIED, generic), `NoSubtitleError`, `TimeoutError`, `NetworkError` (with HTTP 429 → `API_RATE_LIMITED`), `PaidVideoError`, `CommentsDisabledError`, and unknown errors.
- `docs/qa/2026-06-18-structured-error-guidance.md`: QA checklist for the public MCP response change.
- `docs/agent-memory/handoffs/2026-06-18-structured-error-guidance-claude-report.md`: this report.

Modified:

- `src/server/error-response.ts`: `buildValidationErrorPayload` and `buildGenericErrorPayload` now delegate to `buildStructuredErrorPayload`. Text-content wrappers unchanged.
- `src/server/tool-handlers.ts`: removed inline credential-step imports; removed inline `SUBTITLE_UNAVAILABLE` and `COOKIE_EXPIRED` payloads; subtitle path now calls `buildStructuredErrorPayload(error, { fallbackToDescriptionAvailable: true })`. Generic errors still bubble to `server.ts` which uses `buildGenericErrorPayload`.
- `src/bilibili/http.ts`: both `fetchWithWBI` and `fetchWithoutWBI` now pass `response.status` as the fourth argument to `NetworkError` so HTTP 429 maps to `API_RATE_LIMITED`.
- `src/bilibili/comments.ts`: removed the `CommentsDisabledError` catch branch that returned an empty `CommentData`; the error now propagates so the server can emit `COMMENTS_DISABLED`.
- `tests/server-error-next-steps.test.ts`: added `expectStructuredError` helper, parameterized category tests (network, timeout, rate-limit, access-denied, paid, comments-disabled), server-level comments-disabled test, and applied `expectStructuredError` to the existing COOKIE_EXPIRED and SUBTITLE_UNAVAILABLE tests. Also added a controllable `mockGetVideoCommentsData` mock.
- `README.md` and `README_EN.md`: documented the unified structured payload shape, field semantics, and the full 11-row error-code table.
- `docs/agent-memory/codemap.md`: added one line for `src/utils/error-guidance.ts` under Utilities.

## Commands Run

```bash
npx vitest run tests/server-error-next-steps.test.ts                       # before implementation: 9 fail (contract pinned)
npx vitest run tests/server-error-next-steps.test.ts                       # after mapper: 7 pass / 2 fail (timeout needle + subtitle path)
# (fixed timeout wording)
npx vitest run tests/server-error-next-steps.test.ts                       # after mapper fix: 9 pass
npx vitest run tests/server-error-next-steps.test.ts                       # after handler refactor: 9 pass
npx vitest run tests/server-error-next-steps.test.ts tests/bilibili-comments-tool.test.ts  # after Task 4: 21 pass
npm run build                                                              # initially failed with TS2352 on error-response.ts
# (fixed with `as unknown as Record<string, unknown>`)
npm run build                                                              # pass
npx vitest run                                                             # 16 files, 153 tests, all pass
npm test                                                                   # 16 files, 153 tests, all pass
npm run build                                                              # pass
rg -n "COMMENTS_DISABLED|API_RATE_LIMITED|PAID_VIDEO|ACCESS_DENIED|NETWORK_ERROR|NETWORK_TIMEOUT" src tests README.md README_EN.md
git diff -- README.md README_EN.md src tests docs/qa docs/agent-memory/codemap.md | grep -E "SESSDATA=|bili_jct=|DedeUserID=|ANTHROPIC_AUTH_TOKEN|npm_[A-Za-z0-9]|ghp_[A-Za-z0-9]|sk-[A-Za-z0-9]"
git status --short
```

## Results

- Focused tests: 21/21 pass.
- Full suite: 16 files, 153/153 tests pass.
- Build: TypeScript compilation clean.
- Code scan: every new code (`NETWORK_ERROR`, `NETWORK_TIMEOUT`, `API_RATE_LIMITED`, `ACCESS_DENIED`, `PAID_VIDEO`, `COMMENTS_DISABLED`) appears in `src/utils/error-guidance.ts`, tests, and both READMEs. `BILIBILI_API_ERROR`, `VALIDATION_ERROR`, `SUBTITLE_UNAVAILABLE`, `COOKIE_EXPIRED`, `UNKNOWN_ERROR` are present in the mapper and docs.
- Secret scan: only two hits, both negative assertions in `tests/server-error-next-steps.test.ts` (`expect(JSON.stringify(payload)).not.toContain("SESSDATA=")`). No real credentials.

Structured error codes implemented (all with bilingual `message_en`/`message_zh`, `next_steps_en`/`next_steps_zh`, `category`, `retryable`, `user_action_required`, and safe `details`):

```text
VALIDATION_ERROR      category=validation     retryable=false user_action_required=true
COOKIE_EXPIRED        category=credentials    retryable=false user_action_required=true
SUBTITLE_UNAVAILABLE  category=content        retryable=false user_action_required=true
NETWORK_ERROR         category=network        retryable=true  user_action_required=false
NETWORK_TIMEOUT       category=network        retryable=true  user_action_required=false
API_RATE_LIMITED      category=rate_limit     retryable=true  user_action_required=true
ACCESS_DENIED         category=access         retryable=false user_action_required=true
PAID_VIDEO            category=access         retryable=false user_action_required=true
COMMENTS_DISABLED     category=content        retryable=false user_action_required=false
BILIBILI_API_ERROR    category=api            retryable=false user_action_required=false
UNKNOWN_ERROR         category=unknown        retryable=false user_action_required=false
```

Payload example — English path (COOKIE_EXPIRED):

```json
{
  "error": true,
  "message": "Current Bilibili credentials are expired or not logged in.",
  "message_en": "Current Bilibili credentials are expired or not logged in.",
  "message_zh": "当前 Bilibili 凭据已过期或未登录。",
  "code": "COOKIE_EXPIRED",
  "category": "credentials",
  "retryable": false,
  "user_action_required": true,
  "next_steps": [
    "Run: npx -y @xzxzzx/bilibili-mcp@latest config",
    "Then run: npx -y @xzxzzx/bilibili-mcp@latest check",
    "Do not paste Cookie values into MCP client config files."
  ],
  "next_steps_en": [
    "Run: npx -y @xzxzzx/bilibili-mcp@latest config",
    "Then run: npx -y @xzxzzx/bilibili-mcp@latest check",
    "Do not paste Cookie values into MCP client config files."
  ],
  "next_steps_zh": [
    "运行：npx -y @xzxzzx/bilibili-mcp@latest config",
    "然后运行：npx -y @xzxzzx/bilibili-mcp@latest check",
    "不要把 Cookie 值粘贴到 MCP 客户端配置文件中。"
  ],
  "details": { "api_code": "COOKIE_EXPIRED" }
}
```

Payload example — Chinese path (API_RATE_LIMITED via HTTP 429):

```json
{
  "error": true,
  "message": "HTTP 429: Too Many Requests",
  "message_en": "Bilibili API rate limit reached.",
  "message_zh": "Bilibili API 访问频率受限。",
  "code": "API_RATE_LIMITED",
  "category": "rate_limit",
  "retryable": true,
  "user_action_required": true,
  "next_steps": [
    "Wait and retry later.",
    "Reduce request frequency or increase BILIBILI_RATE_LIMIT_MS if running many calls."
  ],
  "next_steps_en": [
    "Wait and retry later.",
    "Reduce request frequency or increase BILIBILI_RATE_LIMIT_MS if running many calls."
  ],
  "next_steps_zh": [
    "请等待一段时间后重试。",
    "如果连续调用较多，请降低调用频率，或调大 BILIBILI_RATE_LIMIT_MS。"
  ],
  "details": { "status_code": 429 }
}
```

## Diff Notes

- `src/server/error-response.ts` uses `as unknown as Record<string, unknown>` because `StructuredErrorPayload` lacks a string index signature and TypeScript otherwise rejects the direct cast. The runtime shape is identical.
- The plan-provided Chinese timeout guidance did not include the literal "超时" needle that the plan's own parameterized test asserted on. Adjusted the second Chinese step from "如果问题反复出现，请检查本机网络、代理、防火墙或 VPN 设置。" to "如果超时问题反复出现，请检查本机网络、代理、防火墙或 VPN 设置。" so the test's `zhNeedle: "超时"` is satisfied without changing test semantics.
- `tests/server-error-next-steps.test.ts` had a pre-existing `vi.mock("../src/bilibili/comments.js", ...)` with a bare `vi.fn()`. Replaced it with a named `mockGetVideoCommentsData` so the server-level comments-disabled test can drive `getVideoCommentsData` directly. Other comments test files continue to mock at lower layers.
- `src/bilibili/comments.ts` no longer caches the disabled-comments empty result; the cache write only happens on the success path. `cacheManager` import remains used.

## Risks Or Skipped Checks

- Behavior change: `get_video_comments` no longer returns an empty success result when Bilibili reports comments disabled; clients that relied on the empty list will now receive a `COMMENTS_DISABLED` MCP error. Documented in README/README_EN and flagged as a non-blocking caveat in the QA checklist. Rollback: revert `src/bilibili/comments.ts` to restore the empty-result fallback without affecting the rest of the mapper.
- `npm pack --dry-run` was not run. Rationale: package metadata and publish file set are unchanged; task ticket explicitly excludes `package.json` and `package-lock.json` unless a test dependency is required (none was).
- Live client compatibility (Claude Desktop, Cursor, Codex) is not tested; only the structured payload shape is verified by unit tests.
- `details.status_code` is only populated when the HTTP layer passes the status into `NetworkError`. Both call sites in `src/bilibili/http.ts` are updated, but any future HTTP helper that forgets the status will silently leave `details.status_code` undefined.
- No Bilibili numeric API code is leaked; `details.api_code` carries the stable string token (e.g. `COOKIE_EXPIRED`, `ACCESS_DENIED`) rather than the raw `data.code`.
- No commit, push, tag, or release performed, per goal-mode directive.

## Harness Artifacts

- Task ticket: used, `docs/agent-memory/handoffs/2026-06-18-structured-error-guidance-task-ticket.md`.
- Research note: not required, reason: no external Bilibili API documentation or third-party behavior was relied on; implementation derives from local source, error classes in `src/utils/errors.ts`, and the existing credential-guidance helpers.
- QA checklist: created, `docs/qa/2026-06-18-structured-error-guidance.md`.
- Codemap: updated — added `src/utils/error-guidance.ts` under Utilities.
- Harness security: not applicable — no changes to `AGENTS.md`, `CLAUDE.md`, `.claude/`, `.codex/`, hooks, skills, subagents, or MCP/tool connector guidance.
- Harness eval: not applicable — no roadmap phase, release, or significant harness update completed.

## Decision Points

- One minor wording adjustment to the timeout Chinese guidance to satisfy the plan's own `zhNeedle: "超时"` assertion. No structural change. Flagging in case Codex prefers a different phrasing.
- TypeScript rejected the direct `StructuredErrorPayload → Record<string, unknown>` cast in `error-response.ts`; fixed with `as unknown as`. Alternative would have been adding a string index signature to `StructuredErrorPayload`, but that weakens the payload type. Chose the cast to keep the public type strict.

## Suggested Codex Review Focus

- Confirm the behavior change in `src/bilibili/comments.ts` (disabled comments now error instead of returning an empty list) matches user expectations and is sufficiently documented in README and release-note follow-up.
- Confirm the timeout Chinese wording adjustment is acceptable.
- Confirm `details` fields stay minimal and never include URLs, query strings, or raw Bilibili numeric codes — current implementation emits only `status_code`, `timeout_ms`, and stable string `api_code` tokens.
- Confirm whether a release-note / CHANGELOG entry should accompany the version bump that ships this change (out of scope for this task).
- Optional: consider whether `details` should include the Bilibili numeric API code in a redacted form for support debugging; currently intentionally omitted to reduce leak surface.

## Capability Usage

- Skills: `vitest` (test baseline add/maintain). `secret-scanning` not invoked as a separate skill; equivalent safety scan run via `rg` and `git diff | grep` per the fixed CLI triggers in `CLAUDE.md`.
- Subagents: none used. Task was bounded and deterministic; no delegation needed.
- MCP/tool connectors: none required — all facts are authoritative in the local worktree.
- CLI: `npx vitest`, `npm run build`, `npm test`, `rg`, `git diff`, `git status`.
