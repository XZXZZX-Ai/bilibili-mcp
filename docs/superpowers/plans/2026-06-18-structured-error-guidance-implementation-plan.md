# Structured MCP Error Guidance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a unified structured MCP error payload with bilingual recovery guidance for network errors, access restrictions, paid videos, disabled comments, API limits, credential expiration, validation failures, and unavailable subtitles.

**Architecture:** Add one reusable formatter in `src/utils/error-guidance.ts`, then route validation, tool-specific, and generic MCP errors through it. Keep existing compatibility fields while adding explicit English and Chinese fields for client rendering.

**Tech Stack:** TypeScript ESM, MCP SDK server handlers, Vitest, existing project error classes and credential guidance helpers.

---

## File Structure

- `src/utils/error-guidance.ts`: new single-owner mapper from project error classes to safe structured MCP payloads.
- `src/server/error-response.ts`: keeps text-content wrappers and delegates payload construction to `error-guidance.ts`.
- `src/server/tool-handlers.ts`: removes inline special payload construction and uses the shared builder for validation, subtitle, and cookie paths.
- `src/bilibili/http.ts`: preserves HTTP status on `NetworkError` so 429 can map to `API_RATE_LIMITED`.
- `src/bilibili/comments.ts`: lets `CommentsDisabledError` propagate instead of silently returning an empty successful result.
- `tests/server-error-next-steps.test.ts`: covers MCP payload categories and bilingual guidance.
- `tests/bilibili-comments-tool.test.ts`: updates the disabled-comments expectation if it currently expects an empty successful result.
- `README.md` and `README_EN.md`: document the unified error payload and behavior change.
- `docs/qa/2026-06-18-structured-error-guidance.md`: QA checklist for public MCP response behavior.
- `docs/agent-memory/codemap.md`: update only if the new utility changes navigation.

## Claude Code Goal-Mode Prompt

Paste this objective into Claude Code Goal Mode:

```text
请按 docs/superpowers/plans/2026-06-18-structured-error-guidance-implementation-plan.md 和 docs/agent-memory/handoffs/2026-06-18-structured-error-guidance-task-ticket.md 执行结构化错误改造：覆盖网络、访问受限、付费、评论关闭、API 限制等异常，保留 error/message/code/next_steps 兼容并补中英文字段。不要改 tool 名/schema，不要提交/推送/发布，不要暴露凭据；遇到新增 tool、外部研究或大重构就停止报告。
```

### Task 1: Pin The Structured Error Contract With Tests

**Files:**
- Modify: `tests/server-error-next-steps.test.ts`

- [ ] **Step 1: Add imports for all error classes used in contract tests**

Ensure the dynamic import includes these classes:

```ts
const {
  BilibiliAPIError,
  CommentsDisabledError,
  NetworkError,
  NoSubtitleError,
  PaidVideoError,
  TimeoutError,
} = await import("../src/utils/errors.js");
```

- [ ] **Step 2: Add a local payload assertion helper**

Add this helper below `getCallToolHandler()`:

```ts
function expectStructuredError(
  payload: Record<string, unknown>,
  code: string,
  options: { retryable: boolean; userActionRequired: boolean },
) {
  expect(payload.error).toBe(true);
  expect(payload.code).toBe(code);
  expect(typeof payload.category).toBe("string");
  expect(typeof payload.message).toBe("string");
  expect(typeof payload.message_en).toBe("string");
  expect(typeof payload.message_zh).toBe("string");
  expect(Array.isArray(payload.next_steps)).toBe(true);
  expect(Array.isArray(payload.next_steps_en)).toBe(true);
  expect(Array.isArray(payload.next_steps_zh)).toBe(true);
  expect(payload.next_steps_en).toEqual(payload.next_steps);
  expect(payload.retryable).toBe(options.retryable);
  expect(payload.user_action_required).toBe(options.userActionRequired);
}
```

- [ ] **Step 3: Add generic content-tool tests**

Add tests that make `get_video_info` throw each error and assert the mapped code:

```ts
it.each([
  {
    name: "network failures",
    error: new NetworkError("HTTP 503: Service Unavailable", undefined, "https://api.bilibili.com/x", 503),
    code: "NETWORK_ERROR",
    retryable: true,
    userActionRequired: false,
    zhNeedle: "网络",
  },
  {
    name: "network timeouts",
    error: new TimeoutError("Request timeout: 30000ms", 30000),
    code: "NETWORK_TIMEOUT",
    retryable: true,
    userActionRequired: false,
    zhNeedle: "超时",
  },
  {
    name: "API rate limits",
    error: new NetworkError("HTTP 429: Too Many Requests", undefined, "https://api.bilibili.com/x", 429),
    code: "API_RATE_LIMITED",
    retryable: true,
    userActionRequired: true,
    zhNeedle: "频率",
  },
  {
    name: "access denied API errors",
    error: new BilibiliAPIError("Access denied", "ACCESS_DENIED"),
    code: "ACCESS_DENIED",
    retryable: false,
    userActionRequired: true,
    zhNeedle: "访问",
  },
  {
    name: "paid videos",
    error: new PaidVideoError("Paid video"),
    code: "PAID_VIDEO",
    retryable: false,
    userActionRequired: true,
    zhNeedle: "付费",
  },
  {
    name: "disabled comments",
    error: new CommentsDisabledError("Comments disabled"),
    code: "COMMENTS_DISABLED",
    retryable: false,
    userActionRequired: false,
    zhNeedle: "评论",
  },
])(
  "returns structured guidance for $name",
  async ({ error, code, retryable, userActionRequired, zhNeedle }) => {
    mockGetVideoInfoWithSubtitle.mockRejectedValueOnce(error);

    const handler = getCallToolHandler();
    const response = await handler({
      method: "tools/call",
      jsonrpc: "2.0",
      id: 1,
      params: {
        name: "get_video_info",
        arguments: { bvid_or_url: "BV1T6PQzQErF" },
      },
    });
    const payload = JSON.parse(response.content[0].text);

    expect(response.isError).toBe(true);
    expectStructuredError(payload, code, { retryable, userActionRequired });
    expect(payload.next_steps_zh.join(" ")).toContain(zhNeedle);
  },
);
```

- [ ] **Step 4: Update existing cookie and subtitle assertions**

In the existing `COOKIE_EXPIRED` and `SUBTITLE_UNAVAILABLE` tests, call `expectStructuredError(...)` and keep the current assertions for `config`, `check`, and `fallback_to_description: true`.

- [ ] **Step 5: Run the focused test and confirm it fails before implementation**

Run:

```bash
npm test -- tests/server-error-next-steps.test.ts
```

Expected before implementation: failure because `category`, bilingual messages, retry flags, and several mapped codes are missing.

### Task 2: Add The Shared Error Guidance Mapper

**Files:**
- Create: `src/utils/error-guidance.ts`
- Modify: `src/server/error-response.ts`

- [ ] **Step 1: Create `src/utils/error-guidance.ts`**

Implement a focused mapper with this public surface:

```ts
import {
  BilibiliAPIError,
  CommentsDisabledError,
  NetworkError,
  NoSubtitleError,
  PaidVideoError,
  TimeoutError,
  ValidationError,
} from "./errors.js";
import {
  buildCredentialNextSteps,
  buildCredentialNextStepsEn,
  buildCredentialNextStepsZh,
} from "./credential-guidance.js";

export type StructuredErrorCode =
  | "VALIDATION_ERROR"
  | "COOKIE_EXPIRED"
  | "SUBTITLE_UNAVAILABLE"
  | "NETWORK_ERROR"
  | "NETWORK_TIMEOUT"
  | "API_RATE_LIMITED"
  | "ACCESS_DENIED"
  | "PAID_VIDEO"
  | "COMMENTS_DISABLED"
  | "BILIBILI_API_ERROR"
  | "UNKNOWN_ERROR";

export interface StructuredErrorPayload {
  error: true;
  message: string;
  message_en: string;
  message_zh: string;
  code: StructuredErrorCode | string;
  category: "validation" | "credentials" | "content" | "network" | "access" | "rate_limit" | "api" | "unknown";
  retryable: boolean;
  user_action_required: boolean;
  next_steps: string[];
  next_steps_en: string[];
  next_steps_zh: string[];
  details?: {
    status_code?: number;
    timeout_ms?: number;
    api_code?: string | number;
  };
}

export interface StructuredErrorContext {
  fallbackToDescriptionAvailable?: boolean;
}

function compatibilityPayload(input: Omit<StructuredErrorPayload, "next_steps"> & { next_steps_en: string[] }): StructuredErrorPayload {
  return {
    ...input,
    next_steps: input.next_steps_en,
  };
}

function safeMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

export function buildStructuredErrorPayload(
  error: unknown,
  context: StructuredErrorContext = {},
): StructuredErrorPayload {
  if (error instanceof ValidationError || (error instanceof Error && error.name === "ValidationError")) {
    return compatibilityPayload({
      error: true,
      message: safeMessage(error, "Invalid input"),
      message_en: safeMessage(error, "Invalid input"),
      message_zh: "输入参数无效，请检查 BV 号、链接、语言代码或评论参数。",
      code: "VALIDATION_ERROR",
      category: "validation",
      retryable: false,
      user_action_required: true,
      next_steps_en: ["Fix the input arguments and call the MCP tool again."],
      next_steps_zh: ["请修正输入参数后重新调用 MCP 工具。"],
    });
  }

  if (error instanceof BilibiliAPIError && error.code === "COOKIE_EXPIRED") {
    return compatibilityPayload({
      error: true,
      message: safeMessage(error, "Current Bilibili credentials are expired or not logged in."),
      message_en: "Current Bilibili credentials are expired or not logged in.",
      message_zh: "当前 Bilibili 凭据已过期或未登录。",
      code: "COOKIE_EXPIRED",
      category: "credentials",
      retryable: false,
      user_action_required: true,
      next_steps_en: buildCredentialNextStepsEn(),
      next_steps_zh: buildCredentialNextStepsZh(),
      details: { api_code: "COOKIE_EXPIRED" },
    });
  }

  if (error instanceof NoSubtitleError) {
    const fallbackStepEn = context.fallbackToDescriptionAvailable
      ? "Retry get_video_transcript with fallback_to_description: true if description fallback is acceptable."
      : "If description fallback is acceptable, use get_video_info or retry transcript with fallback_to_description: true.";
    const fallbackStepZh = context.fallbackToDescriptionAvailable
      ? "如果接受降级为视频简介，请用 fallback_to_description: true 重新调用 get_video_transcript。"
      : "如果接受降级为视频简介，请使用 get_video_info，或用 fallback_to_description: true 重试字幕工具。";
    return compatibilityPayload({
      error: true,
      message: safeMessage(error, "No subtitles are available for this video."),
      message_en: "No subtitles are available for this video.",
      message_zh: "该视频没有可用字幕。",
      code: "SUBTITLE_UNAVAILABLE",
      category: "content",
      retryable: false,
      user_action_required: true,
      next_steps_en: [
        "If you expected subtitles, configure Bilibili Cookies.",
        ...buildCredentialNextSteps(),
        fallbackStepEn,
      ],
      next_steps_zh: [
        "如果你预期该视频应该有字幕，请先配置 Bilibili Cookie。",
        ...buildCredentialNextStepsZh(),
        fallbackStepZh,
      ],
    });
  }

  if (error instanceof TimeoutError) {
    return compatibilityPayload({
      error: true,
      message: safeMessage(error, "Bilibili request timed out."),
      message_en: "The Bilibili request timed out.",
      message_zh: "请求 Bilibili 超时。",
      code: "NETWORK_TIMEOUT",
      category: "network",
      retryable: true,
      user_action_required: false,
      next_steps_en: ["Retry later.", "Check local network, proxy, firewall, or VPN settings if the problem repeats."],
      next_steps_zh: ["稍后重试。", "如果问题反复出现，请检查本机网络、代理、防火墙或 VPN 设置。"],
      details: { timeout_ms: error.timeoutMs },
    });
  }

  if (error instanceof NetworkError) {
    const rateLimited = error.statusCode === 429;
    return compatibilityPayload({
      error: true,
      message: safeMessage(error, rateLimited ? "Bilibili API rate limit reached." : "Network request failed."),
      message_en: rateLimited ? "Bilibili API rate limit reached." : "Network request failed.",
      message_zh: rateLimited ? "Bilibili API 访问频率受限。" : "网络请求失败。",
      code: rateLimited ? "API_RATE_LIMITED" : "NETWORK_ERROR",
      category: rateLimited ? "rate_limit" : "network",
      retryable: true,
      user_action_required: rateLimited,
      next_steps_en: rateLimited
        ? ["Wait and retry later.", "Reduce request frequency or increase BILIBILI_RATE_LIMIT_MS if running many calls."]
        : ["Retry later.", "Check local network, proxy, firewall, or VPN settings if the problem repeats."],
      next_steps_zh: rateLimited
        ? ["请等待一段时间后重试。", "如果连续调用较多，请降低调用频率，或调大 BILIBILI_RATE_LIMIT_MS。"]
        : ["稍后重试。", "如果问题反复出现，请检查本机网络、代理、防火墙或 VPN 设置。"],
      details: { status_code: error.statusCode },
    });
  }

  if (error instanceof BilibiliAPIError && error.code === "ACCESS_DENIED") {
    return compatibilityPayload({
      error: true,
      message: safeMessage(error, "Bilibili denied access to this resource."),
      message_en: "Bilibili denied access to this resource.",
      message_zh: "Bilibili 拒绝访问该资源。",
      code: "ACCESS_DENIED",
      category: "access",
      retryable: false,
      user_action_required: true,
      next_steps_en: ["Check whether the video is private, region-restricted, removed, or requires a logged-in account.", "Run the credential check if you expected your account to have access."],
      next_steps_zh: ["请检查视频是否为私密、地区限制、已下架，或需要登录账号访问。", "如果你认为账号应有权限，请先运行凭据检查。"],
      details: { api_code: error.code, status_code: error.statusCode },
    });
  }

  if (error instanceof PaidVideoError) {
    return compatibilityPayload({
      error: true,
      message: safeMessage(error, "This video appears to require paid access."),
      message_en: "This video appears to require paid access.",
      message_zh: "该视频可能需要付费、会员或额外权限。",
      code: "PAID_VIDEO",
      category: "access",
      retryable: false,
      user_action_required: true,
      next_steps_en: ["Open the video in Bilibili and confirm whether it requires purchase, membership, or account-specific permission.", "This MCP cannot bypass paid or restricted access."],
      next_steps_zh: ["请在 Bilibili 中打开视频，确认是否需要购买、会员或账号权限。", "本 MCP 不会绕过付费或受限访问。"],
    });
  }

  if (error instanceof CommentsDisabledError) {
    return compatibilityPayload({
      error: true,
      message: safeMessage(error, "Comments are disabled or restricted for this video."),
      message_en: "Comments are disabled or restricted for this video.",
      message_zh: "该视频评论已关闭或访问受限。",
      code: "COMMENTS_DISABLED",
      category: "content",
      retryable: false,
      user_action_required: false,
      next_steps_en: ["Use transcript or metadata tools instead.", "Open the video in Bilibili to confirm whether comments are visible in the official UI."],
      next_steps_zh: ["可以改用字幕或元数据工具。", "也可以在 Bilibili 官方页面确认评论是否可见。"],
    });
  }

  if (error instanceof BilibiliAPIError) {
    return compatibilityPayload({
      error: true,
      message: safeMessage(error, "Bilibili API returned an error."),
      message_en: "Bilibili API returned an error.",
      message_zh: "Bilibili API 返回错误。",
      code: error.code || "BILIBILI_API_ERROR",
      category: "api",
      retryable: false,
      user_action_required: false,
      next_steps_en: ["Retry later if this looks temporary.", "If the problem repeats, include the error code when reporting the issue."],
      next_steps_zh: ["如果看起来是临时问题，请稍后重试。", "如果问题反复出现，反馈时请带上错误代码。"],
      details: { api_code: error.code, status_code: error.statusCode },
    });
  }

  return compatibilityPayload({
    error: true,
    message: safeMessage(error, "Unknown error"),
    message_en: safeMessage(error, "Unknown error"),
    message_zh: "发生未知错误。",
    code: "UNKNOWN_ERROR",
    category: "unknown",
    retryable: false,
    user_action_required: false,
    next_steps_en: ["Retry later.", "If the problem repeats, report the error message without including credentials."],
    next_steps_zh: ["请稍后重试。", "如果问题反复出现，请反馈错误信息，但不要包含 Cookie 或其他凭据。"],
  });
}
```

- [ ] **Step 2: Refactor `src/server/error-response.ts`**

Replace the existing BilibiliAPIError-specific logic with:

```ts
import { buildStructuredErrorPayload } from "../utils/error-guidance.js";

export function buildValidationErrorPayload(error: unknown): Record<string, unknown> {
  return buildStructuredErrorPayload(error);
}

export function buildGenericErrorPayload(error: unknown): Record<string, unknown> {
  return buildStructuredErrorPayload(error);
}
```

Keep `toTextContent()` and `toErrorTextContent()` unchanged.

- [ ] **Step 3: Run focused test**

Run:

```bash
npm test -- tests/server-error-next-steps.test.ts
```

Expected after this task: many category tests pass, but transcript-specific subtitle path may still need handler cleanup.

### Task 3: Route Tool Handlers Through The Shared Builder

**Files:**
- Modify: `src/server/tool-handlers.ts`

- [ ] **Step 1: Remove direct credential next-step imports**

Keep credential setup/status imports, but remove these from the import list:

```ts
buildCredentialNextSteps,
buildCredentialNextStepsEn,
buildCredentialNextStepsZh,
```

Add:

```ts
import { buildStructuredErrorPayload } from "../utils/error-guidance.js";
```

- [ ] **Step 2: Replace the NoSubtitleError inline payload**

Use:

```ts
if (error instanceof NoSubtitleError) {
  return toErrorTextContent(
    buildStructuredErrorPayload(error, {
      fallbackToDescriptionAvailable: true,
    }),
  );
}
```

- [ ] **Step 3: Replace the COOKIE_EXPIRED inline payload**

Use:

```ts
if (error instanceof BilibiliAPIError && error.code === "COOKIE_EXPIRED") {
  return toErrorTextContent(buildStructuredErrorPayload(error));
}
```

- [ ] **Step 4: Keep validation branches using `buildValidationErrorPayload(error)`**

Do not duplicate validation payloads in each tool.

- [ ] **Step 5: Run focused test**

Run:

```bash
npm test -- tests/server-error-next-steps.test.ts
```

Expected: structured server error tests pass except any cases blocked by lower-level error swallowing.

### Task 4: Preserve Status Codes And Stop Swallowing Disabled Comments

**Files:**
- Modify: `src/bilibili/http.ts`
- Modify: `src/bilibili/comments.ts`
- Modify: `tests/bilibili-comments-tool.test.ts`

- [ ] **Step 1: Pass HTTP status codes to `NetworkError`**

In both `fetchWithWBI` and `fetchWithoutWBI`, change non-OK response errors from:

```ts
throw new NetworkError(errorMsg, undefined, url.toString());
```

or:

```ts
throw new NetworkError(
  `HTTP ${response.status}: ${response.statusText}`,
  undefined,
  url.toString(),
);
```

to:

```ts
throw new NetworkError(
  `HTTP ${response.status}: ${response.statusText}`,
  undefined,
  url.toString(),
  response.status,
);
```

- [ ] **Step 2: Let `CommentsDisabledError` propagate**

In `src/bilibili/comments.ts`, remove the catch branch that returns:

```ts
const result: CommentData = {
  comments: [],
  summary: {
    total_comments: 0,
    comments_with_timestamp: 0,
  },
};
cacheManager.setCommentInfo(cacheKey, result);
return result;
```

Replace it with:

```ts
if (error instanceof CommentsDisabledError) {
  logger.warn("Comments disabled for video", { bvid }, { type: "comments" });
  throw error;
}
```

- [ ] **Step 3: Update comments tests**

If a test expected disabled comments to produce an empty result, change it to:

```ts
await expect(
  getVideoCommentsData("BV1T6PQzQErF", { limit: 5 }),
).rejects.toThrow(CommentsDisabledError);
```

- [ ] **Step 4: Add a server-level comments-disabled test**

In `tests/server-error-next-steps.test.ts`, mock `getVideoCommentsData` to throw `new CommentsDisabledError("Comments disabled")`, call `get_video_comments`, and assert `COMMENTS_DISABLED` with bilingual guidance.

- [ ] **Step 5: Run focused tests**

Run:

```bash
npm test -- tests/server-error-next-steps.test.ts tests/bilibili-comments-tool.test.ts
```

Expected: both focused files pass.

### Task 5: Document The Public Error Shape And QA It

**Files:**
- Modify: `README.md`
- Modify: `README_EN.md`
- Create: `docs/qa/2026-06-18-structured-error-guidance.md`
- Modify: `docs/agent-memory/codemap.md` only if needed

- [ ] **Step 1: Update README error table**

Add or update the MCP error section so it documents:

```json
{
  "error": true,
  "message": "English-compatible message",
  "message_en": "English message",
  "message_zh": "中文错误说明",
  "code": "NETWORK_ERROR",
  "category": "network",
  "retryable": true,
  "user_action_required": false,
  "next_steps": ["English-compatible steps"],
  "next_steps_en": ["English steps"],
  "next_steps_zh": ["中文操作建议"],
  "details": {
    "status_code": 503
  }
}
```

Document at least these codes:

```text
VALIDATION_ERROR
COOKIE_EXPIRED
SUBTITLE_UNAVAILABLE
NETWORK_ERROR
NETWORK_TIMEOUT
API_RATE_LIMITED
ACCESS_DENIED
PAID_VIDEO
COMMENTS_DISABLED
BILIBILI_API_ERROR
UNKNOWN_ERROR
```

- [ ] **Step 2: Update README_EN with the same contract**

Keep `next_steps` described as backward-compatible English steps. Mention that `next_steps_zh` is for Chinese clients/users.

- [ ] **Step 3: Create QA checklist**

Copy from `docs/templates/qa-checklist.md` to:

```text
docs/qa/2026-06-18-structured-error-guidance.md
```

Fill at least:

- Title
- Date
- QA type: `MCP tool change`
- Scope
- Automated Baseline commands
- Tool Workflows expected checks for validation, unavailable subtitles, expired Cookie, disabled comments, rate limit, network/timeout, access denied, paid video
- Security And Privacy Checks
- Result as `not run yet` until commands are executed

- [ ] **Step 4: Check codemap**

If `src/utils/error-guidance.ts` is added, update the Utilities section in `docs/agent-memory/codemap.md` with one line for it. If no navigation-relevant change remains, say checked unchanged in the report.

### Task 6: Final Verification And Report

**Files:**
- No source edit expected unless verification reveals a defect.

- [ ] **Step 1: Run focused tests**

Run:

```bash
npm test -- tests/server-error-next-steps.test.ts tests/bilibili-comments-tool.test.ts
```

Expected: pass.

- [ ] **Step 2: Run full tests**

Run:

```bash
npm test
```

Expected: pass.

- [ ] **Step 3: Run build**

Run:

```bash
npm run build
```

Expected: pass.

- [ ] **Step 4: Run focused scan**

Run:

```bash
rg -n "COMMENTS_DISABLED|API_RATE_LIMITED|PAID_VIDEO|ACCESS_DENIED|NETWORK_ERROR|NETWORK_TIMEOUT" src tests README.md README_EN.md
```

Expected: each code appears in source/tests/docs.

- [ ] **Step 5: Secret safety scan on added diff**

Run:

```bash
git diff -- README.md README_EN.md src tests docs/qa docs/agent-memory/codemap.md | Select-String -Pattern "SESSDATA|bili_jct|DedeUserID|ANTHROPIC_AUTH_TOKEN|npm_[A-Za-z0-9]|ghp_[A-Za-z0-9]|sk-[A-Za-z0-9]" -CaseSensitive
```

Expected: no secret-like added lines. If only documentation says the token field names without values, report that explicitly.

- [ ] **Step 6: Return Claude report**

Use the template in `docs/agent-memory/agent-communication.md`, including the required `Harness Artifacts` section:

```markdown
# Claude To Codex Report: structured error guidance

## Summary
## Files Changed
## Commands Run
## Results
## Diff Notes
## Risks Or Skipped Checks
## Harness Artifacts

- Task ticket: used, `docs/agent-memory/handoffs/2026-06-18-structured-error-guidance-task-ticket.md`
- Research note: not required unless external Bilibili API docs were used
- QA checklist: created, `docs/qa/2026-06-18-structured-error-guidance.md`
- Codemap: updated / checked unchanged
- Harness security: not applicable unless agent harness files changed
- Harness eval: not applicable

## Decision Points
## Suggested Codex Review Focus
```

## Acceptance Review Checklist

- [ ] No public tool name changed.
- [ ] No input schema changed unless explicitly justified.
- [ ] Error response compatibility fields remain present.
- [ ] All named abnormal cases are mapped.
- [ ] Chinese and English guidance are both present and understandable.
- [ ] Disabled comments no longer silently masquerade as a successful empty result.
- [ ] Rate limits are detectable through HTTP 429 status where available.
- [ ] Build and tests pass.
- [ ] README and README_EN match implementation.
- [ ] QA checklist exists and is honest about any manual checks not run.
