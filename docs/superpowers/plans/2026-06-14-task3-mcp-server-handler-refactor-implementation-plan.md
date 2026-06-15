# Task 3 MCP Server Handler Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split `src/server.ts` into smaller MCP schema, handler, and error-response modules without changing public MCP tool names, schemas, response shapes, credential guidance, or fallback behavior.

**Architecture:** Keep `src/server.ts` as the MCP server construction and registration entry point. Move the six public tool schema objects into `src/server/tool-schemas.ts`, move tool-call switch logic into `src/server/tool-handlers.ts`, and move repeated JSON error payload helpers into `src/server/error-response.ts`.

**Tech Stack:** TypeScript ESM, Node16 module resolution, MCP SDK `Server`, Vitest, existing validation and credential guidance utilities.

---

## Scope

Task 3 is only about MCP server handler structure.

Expected direct edits:

- `src/server.ts`: reduce to server creation plus `tools/list` and `tools/call` registration.
- `src/server/tool-schemas.ts`: create and export the six current MCP tool schema objects in the current order.
- `src/server/error-response.ts`: create shared helpers for validation and generic API error payloads.
- `src/server/tool-handlers.ts`: create and export the tool-call dispatcher.
- `tests/server-tools.test.ts`: add public tool order and schema contract checks before refactor.
- `tests/server-credential-tools.test.ts`: keep credential helper tool behavior passing.
- `tests/server-error-next-steps.test.ts`: keep generic `COOKIE_EXPIRED` `next_steps` behavior passing.
- `docs/agent-memory/verification-log.md`: append verification only after successful completion.

Out of scope:

- Do not add, remove, rename, or reorder public MCP tools.
- Do not change MCP response JSON shapes.
- Do not change Bilibili API modules, cache behavior, logging behavior, credential loading, package metadata, README, workflow, or encoding.
- Do not introduce a new test helper for `_requestHandlers`; shared MCP test helper work belongs to Task 6 unless required by this refactor.
- Do not do source comment/mojibake cleanup.
- Do not commit unless the user explicitly asks.

## Current Server Contract To Preserve

Tool order must remain:

```ts
[
  "get_credential_setup_instructions",
  "check_bilibili_credentials",
  "get_video_info",
  "get_video_comments",
  "get_video_transcript",
  "get_video_metadata",
]
```

Validation error payloads must keep this shape:

```json
{
  "error": true,
  "message": "validation message",
  "code": "VALIDATION_ERROR"
}
```

Generic `BilibiliAPIError("COOKIE_EXPIRED")` payloads must keep this shape:

```json
{
  "error": true,
  "message": "Cookie expired",
  "code": "COOKIE_EXPIRED",
  "next_steps": ["..."]
}
```

Transcript `NoSubtitleError` payloads must keep `code: "SUBTITLE_UNAVAILABLE"` and include credential setup `next_steps` plus the fallback hint.

## Capability Use

- Use normal implementation plus `risk-reviewer` perspective after implementation because this is a public MCP contract refactor.
- Use `build-error-resolver` only if TypeScript, ESM imports, or MCP SDK request handler registration fails.
- Use local CLI commands for source facts and verification: `rg`, `npm test`, `npm run build`, `git diff`.
- Use `bilibili-mcp-memory` only for final verification log or a newly discovered durable lesson.

---

### Task 1: Strengthen Baseline Server Contract Tests

**Files:**

- Modify: `tests/server-tools.test.ts`
- Inspect: `tests/server-credential-tools.test.ts`
- Inspect: `tests/server-error-next-steps.test.ts`

- [x] **Step 1: Add explicit tool order test**

In `tests/server-tools.test.ts`, add this test inside `describe("MCP tool list baseline", () => { ... })` after `beforeAll` and before schema-specific `describe` blocks:

```ts
  it("keeps the public tool order stable", () => {
    expect(toolsResult.tools.map((tool) => tool.name)).toEqual([
      "get_credential_setup_instructions",
      "check_bilibili_credentials",
      "get_video_info",
      "get_video_comments",
      "get_video_transcript",
      "get_video_metadata",
    ]);
  });
```

Do not remove the existing "exposes all 6 tools" test; it catches a different failure mode.

- [x] **Step 2: Add core schema required-field checks**

Still in `tests/server-tools.test.ts`, add this test in the top-level `describe("MCP tool list baseline", ...)` block:

```ts
  it("keeps all public tool required fields stable", () => {
    const requiredByTool = Object.fromEntries(
      toolsResult.tools.map((tool) => [
        tool.name,
        tool.inputSchema.required ?? [],
      ]),
    );

    expect(requiredByTool).toEqual({
      get_credential_setup_instructions: [],
      check_bilibili_credentials: [],
      get_video_info: ["bvid_or_url"],
      get_video_comments: ["bvid_or_url"],
      get_video_transcript: ["bvid_or_url"],
      get_video_metadata: ["bvid_or_url"],
    });
  });
```

- [x] **Step 3: Run baseline tests before refactor**

Run:

```bash
npm test -- tests/server-tools.test.ts tests/server-credential-tools.test.ts tests/server-error-next-steps.test.ts
```

Expected:

```text
All three server-focused test files pass before production refactor.
```

If this fails before refactor, stop and report the exact failure. Do not start moving code until the baseline is green.

---

### Task 2: Extract Tool Schemas

**Files:**

- Create: `src/server/tool-schemas.ts`
- Modify: `src/server.ts`
- Test: `tests/server-tools.test.ts`

- [x] **Step 1: Create `src/server/tool-schemas.ts`**

Create `src/server/tool-schemas.ts` with this structure:

```ts
import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const toolSchemas: Tool[] = [
  // Move the current six tool objects from src/server.ts here, unchanged.
];
```

Implementation requirement:

- The array must contain exactly the six existing objects currently returned from the `tools/list` handler.
- Keep every `name`, `description`, `inputSchema.type`, `properties`, `required`, and `enum` value exactly as it is before this task.
- Keep the current order exactly: credential setup, credential check, video info, comments, transcript, metadata.
- Do not repair mojibake text in descriptions during this task.

- [x] **Step 2: Use extracted schemas in `src/server.ts`**

In `src/server.ts`, add:

```ts
import { toolSchemas } from "./server/tool-schemas.js";
```

Replace the `ListToolsRequestSchema` handler body with:

```ts
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: toolSchemas,
}));
```

Remove only the inline schema array from `src/server.ts`.

- [x] **Step 3: Verify schema extraction**

Run:

```bash
npm test -- tests/server-tools.test.ts
npm run build
```

Expected:

```text
The public tool order test passes.
All schema-specific tests pass.
TypeScript build passes.
```

If any schema test fails, compare `git diff -- src/server.ts src/server/tool-schemas.ts` and restore the exact schema field that changed.

---

### Task 3: Extract Shared Error Payload Helpers

**Files:**

- Create: `src/server/error-response.ts`
- Modify: `src/server.ts`
- Test: `tests/server-error-next-steps.test.ts`

- [x] **Step 1: Create error payload helper module**

Create `src/server/error-response.ts`:

```ts
import { BilibiliAPIError } from "../utils/errors.js";
import { buildCredentialNextSteps } from "../utils/credential-guidance.js";

export function buildValidationErrorPayload(error: unknown): Record<string, unknown> {
  return {
    error: true,
    message: error instanceof Error ? error.message : "Invalid input",
    code: "VALIDATION_ERROR",
  };
}

export function buildGenericErrorPayload(error: unknown): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    error: true,
    message: error instanceof Error ? error.message : "Unknown error",
  };

  if (error instanceof BilibiliAPIError) {
    payload.code = error.code;
    if (error.code === "COOKIE_EXPIRED") {
      payload.next_steps = buildCredentialNextSteps();
    }
  }

  return payload;
}

export function toTextContent(payload: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(payload, null, 2),
      },
    ],
  };
}

export function toErrorTextContent(payload: unknown) {
  return {
    ...toTextContent(payload),
    isError: true,
  };
}
```

- [x] **Step 2: Use helpers for validation errors in `src/server.ts`**

In `src/server.ts`, add:

```ts
import {
  buildGenericErrorPayload,
  buildValidationErrorPayload,
  toErrorTextContent,
} from "./server/error-response.js";
```

Replace each repeated validation catch return:

```ts
return {
  content: [{
    type: "text",
    text: JSON.stringify({
      error: true,
      message: error instanceof Error ? error.message : "Invalid input",
      code: "VALIDATION_ERROR"
    }, null, 2)
  }],
  isError: true
};
```

with:

```ts
return toErrorTextContent(buildValidationErrorPayload(error));
```

There are validation catch blocks for:

- `get_video_info`
- `get_video_comments`
- `get_video_transcript`
- `get_video_metadata`

- [x] **Step 3: Use helper for top-level generic errors**

In the outer `catch (error)` at the bottom of `src/server.ts`, keep:

```ts
console.error(`Error processing tool ${name}:`, redactSecrets(error));
```

Replace the manual `payload` construction and return with:

```ts
return toErrorTextContent(buildGenericErrorPayload(error));
```

Do not change the specialized `NoSubtitleError` and transcript `COOKIE_EXPIRED` handling yet; it stays inside the transcript case until handler extraction.

- [x] **Step 4: Verify error helper extraction**

Run:

```bash
npm test -- tests/server-error-next-steps.test.ts tests/server-credential-tools.test.ts
npm run build
```

Expected:

```text
COOKIE_EXPIRED generic next_steps test passes.
Credential helper tools still return JSON text.
TypeScript build passes.
```

---

### Task 4: Extract Tool Handlers

**Files:**

- Create: `src/server/tool-handlers.ts`
- Modify: `src/server.ts`
- Test: `tests/server-tools.test.ts`
- Test: `tests/server-credential-tools.test.ts`
- Test: `tests/server-error-next-steps.test.ts`

- [x] **Step 1: Create `src/server/tool-handlers.ts` with dispatcher imports**

Create `src/server/tool-handlers.ts` with these imports:

```ts
import { getVideoCommentsData } from "../bilibili/comments.js";
import { checkLoginStatus } from "../bilibili/http.js";
import { getVideoMetadataData } from "../bilibili/metadata.js";
import {
  getVideoInfoWithSubtitle,
  getVideoTranscriptData,
} from "../bilibili/subtitle.js";
import { getPreferredLanguage } from "../config.js";
import {
  buildCredentialNextSteps,
  buildCredentialSetupInstructions,
  buildCredentialStatus,
} from "../utils/credential-guidance.js";
import { BilibiliAPIError, NoSubtitleError } from "../utils/errors.js";
import { sanitizeBVInput } from "../utils/sanitization.js";
import {
  validateBVInput,
  validateCommentLimit,
  validateCommentSort,
  validateDetailLevel,
  validateLanguage,
} from "../utils/validation.js";
import {
  buildValidationErrorPayload,
  toErrorTextContent,
  toTextContent,
} from "./error-response.js";
```

Then add:

```ts
type ToolArgs = Record<string, unknown> | undefined;

export async function handleToolCall(name: string, args: ToolArgs) {
  switch (name) {
    // Move the existing six cases here.
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
```

- [x] **Step 2: Move credential helper cases**

Move these two switch cases from `src/server.ts` into `handleToolCall` without behavior changes:

- `get_credential_setup_instructions`
- `check_bilibili_credentials`

Use `toTextContent(...)` for both:

```ts
case "get_credential_setup_instructions": {
  return toTextContent(buildCredentialSetupInstructions());
}

case "check_bilibili_credentials": {
  const result = await buildCredentialStatus(checkLoginStatus);
  return toTextContent(result);
}
```

- [x] **Step 3: Move content tool cases and preserve validation shape**

Move `get_video_info`, `get_video_comments`, `get_video_transcript`, and `get_video_metadata` into `handleToolCall`.

For each validation catch, use:

```ts
return toErrorTextContent(buildValidationErrorPayload(error));
```

For `sanitizeBVInput`, do not leave unused `sanitizedInput` locals. Use the sanitized value for downstream calls:

```ts
const sanitizedBvidOrUrl = sanitizeBVInput(bvidOrUrl);
```

Then call downstream functions with `sanitizedBvidOrUrl`:

```ts
const result = await getVideoInfoWithSubtitle(sanitizedBvidOrUrl, normalizedLang);
```

```ts
const result = await getVideoCommentsData(sanitizedBvidOrUrl, {
  detailLevel,
  limit,
  sort,
  includeReplies,
});
```

```ts
const result = await getVideoTranscriptData(
  sanitizedBvidOrUrl,
  normalizedLang,
  fallbackToDescription,
);
```

```ts
const result = await getVideoMetadataData(sanitizedBvidOrUrl);
```

Important behavior rule:

- Validation must still happen before sanitization.
- `getPreferredLanguage(preferredLang)` must still run after validation.
- `fallback_to_description` must still default to `false`.
- `include_replies` must still validate boolean type when provided.

- [x] **Step 4: Preserve specialized transcript errors**

Keep the transcript case's inner `try/catch` behavior. In `src/server/tool-handlers.ts`, the transcript `NoSubtitleError` branch should return:

```ts
return toErrorTextContent({
  error: true,
  message: error.message,
  code: "SUBTITLE_UNAVAILABLE",
  next_steps: [
    "If you expected subtitles, configure Bilibili Cookies.",
    ...buildCredentialNextSteps(),
    "Or retry get_video_transcript with fallback_to_description: true if description fallback is acceptable.",
  ],
});
```

The transcript `COOKIE_EXPIRED` branch should return:

```ts
return toErrorTextContent({
  error: true,
  message: error.message,
  code: "COOKIE_EXPIRED",
  next_steps: buildCredentialNextSteps(),
});
```

- [x] **Step 5: Reduce `src/server.ts` to registration**

After the switch cases are moved, `src/server.ts` should keep only these responsibilities:

- import MCP SDK server and request schemas
- import `toolSchemas`
- import `handleToolCall`
- import `buildGenericErrorPayload` and `toErrorTextContent`
- import `redactSecrets`
- create and export `server`
- register `tools/list`
- register `tools/call`

The `tools/call` handler should be:

```ts
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    return await handleToolCall(
      name,
      args as Record<string, unknown> | undefined,
    );
  } catch (error) {
    console.error(`Error processing tool ${name}:`, redactSecrets(error));
    return toErrorTextContent(buildGenericErrorPayload(error));
  }
});
```

`src/server.ts` should no longer import Bilibili API modules, validation helpers, sanitization helpers, credential guidance builders, `BilibiliAPIError`, or `NoSubtitleError`.

- [x] **Step 6: Verify handler extraction**

Run:

```bash
npm test -- tests/server-tools.test.ts tests/server-credential-tools.test.ts tests/server-error-next-steps.test.ts
npm run build
```

Expected:

```text
All server-focused tests pass.
TypeScript build passes.
```

---

### Task 5: Add Focused Regression Tests For Sanitized Inputs

**Files:**

- Modify: `tests/server-error-next-steps.test.ts`
- Or create: `tests/server-handler-sanitization.test.ts`

- [x] **Step 1: Add a server handler sanitization test**

Create `tests/server-handler-sanitization.test.ts` if avoiding more complexity in the existing mocked error test is cleaner. Use module mocks to verify that a full Bilibili URL is sanitized before reaching downstream APIs.

Add:

```ts
import { describe, expect, it, vi } from "vitest";

const mockGetVideoMetadataData = vi.fn();

vi.mock("../src/bilibili/subtitle.js", () => ({
  getVideoInfoWithSubtitle: vi.fn(),
  getVideoTranscriptData: vi.fn(),
}));

vi.mock("../src/bilibili/metadata.js", () => ({
  getVideoMetadataData: (...args: unknown[]) => mockGetVideoMetadataData(...args),
}));

vi.mock("../src/bilibili/comments.js", () => ({
  getVideoCommentsData: vi.fn(),
}));

vi.mock("../src/bilibili/http.js", () => ({
  checkLoginStatus: vi.fn(async () => ({ isLogin: false })),
}));

const { server } = await import("../src/server.js");

function getCallToolHandler() {
  const handlers = (server as any)._requestHandlers as Map<string, unknown>;
  const handlerEntry = handlers.get("tools/call");
  if (!handlerEntry) {
    throw new Error("tools/call handler not registered");
  }
  return handlerEntry as (request: {
    method: "tools/call";
    jsonrpc: "2.0";
    id: number;
    params: { name: string; arguments?: Record<string, unknown> };
  }) => Promise<{
    content: Array<{ type: string; text: string }>;
    isError?: boolean;
  }>;
}

describe("server handler input sanitization", () => {
  it("passes sanitized input to metadata handler", async () => {
    mockGetVideoMetadataData.mockResolvedValueOnce({ bvid: "BV1T6PQzQErF" });

    const handler = getCallToolHandler();
    await handler({
      method: "tools/call",
      jsonrpc: "2.0",
      id: 1,
      params: {
        name: "get_video_metadata",
        arguments: {
          bvid_or_url: "  https://www.bilibili.com/video/BV1T6PQzQErF/?spm_id_from=333.999.0.0  ",
        },
      },
    });

    expect(mockGetVideoMetadataData).toHaveBeenCalledWith(
      "https://www.bilibili.com/video/BV1T6PQzQErF/?spm_id_from=333.999.0.0",
    );
  });
});
```

Run:

```bash
npm test -- tests/server-handler-sanitization.test.ts
```

Expected after handler extraction:

```text
The test passes and proves Task 3 removed the unused sanitizedInput local by using the sanitized value.
```

- [x] **Step 2: Verify no unused sanitized locals remain**

Run:

```bash
rg -n "sanitizedInput|const sanitized" src/server.ts src/server
```

Expected:

```text
No `sanitizedInput` matches.
Only intentionally used `sanitizedBvidOrUrl` locals appear in src/server/tool-handlers.ts.
```

---

### Task 6: Full Verification And Memory Record

**Files:**

- Modify if completed: `docs/agent-memory/verification-log.md`
- Inspect: `src/server.ts`
- Inspect: `src/server/`
- Inspect: `tests/`

- [x] **Step 1: Run full focused and global verification**

Run:

```bash
npm test -- tests/server-tools.test.ts tests/server-credential-tools.test.ts tests/server-error-next-steps.test.ts tests/server-handler-sanitization.test.ts
npm test
npm run build
```

Expected:

```text
Server-focused tests pass.
Full Vitest suite passes.
TypeScript build passes.
```

- [x] **Step 2: Inspect public contract and diff scope**

Run:

```bash
rg -n "get_credential_setup_instructions|check_bilibili_credentials|get_video_info|get_video_comments|get_video_transcript|get_video_metadata|SUBTITLE_UNAVAILABLE|COOKIE_EXPIRED|VALIDATION_ERROR" src/server.ts src/server tests
git diff -- src/server.ts src/server tests/server-tools.test.ts tests/server-credential-tools.test.ts tests/server-error-next-steps.test.ts tests/server-handler-sanitization.test.ts
git status --short
```

Expected:

```text
All six public tool names are still present.
The three error codes are still present in the extracted server modules or tests.
Diff is limited to Task 3 server modules, server tests, and verification-log append.
Existing unrelated dirty files remain unstaged and untouched.
```

- [x] **Step 3: Record Task 3 verification**

If Step 1 and Step 2 pass, append this entry to `docs/agent-memory/verification-log.md`:

```markdown
## 2026-06-14 Task 3 MCP Server Handler Refactor

- Commands: `npm test -- tests/server-tools.test.ts tests/server-credential-tools.test.ts tests/server-error-next-steps.test.ts tests/server-handler-sanitization.test.ts`; `npm test`; `npm run build`; server contract scan with `rg`.
- Result: `src/server.ts` now only constructs/registers the MCP server, tool schemas and handlers are extracted, public tool order/schema/error contracts remain covered by tests, sanitized inputs are passed downstream without changing URL-to-BVID extraction ownership, and tests/build pass.
- Caveat: No MCP tool was added, removed, renamed, or intentionally changed; no package, README, credential loading, release, tag, push, or publish action was performed.
```

Do not update `docs/agent-memory/decisions.md` or `docs/agent-memory/lessons-learned.md` unless implementation discovers a new durable decision or repeated pitfall.

---

## Acceptance Criteria

- `src/server.ts` is reduced to server construction and request handler registration.
- `src/server/tool-schemas.ts` exports the six current tool schema objects in the current order.
- `src/server/tool-handlers.ts` owns tool dispatch and calls existing Bilibili/credential utilities.
- `src/server/error-response.ts` owns validation and generic error payload helpers.
- Public tool order remains unchanged.
- Public tool names remain unchanged.
- Public tool `required` fields and `enum` values remain unchanged.
- `VALIDATION_ERROR`, `COOKIE_EXPIRED`, and `SUBTITLE_UNAVAILABLE` payload behavior remains unchanged.
- `COOKIE_EXPIRED` next steps remain present in generic and transcript-specific paths.
- `SUBTITLE_UNAVAILABLE` next steps keep the credential setup and fallback-to-description hints.
- Sanitized inputs are passed to downstream content handlers instead of unused `sanitizedInput` locals.
- `npm test` passes.
- `npm run build` passes.
- No logging, package, README, credential loading, release workflow, source encoding, or Bilibili API behavior changes are mixed into this task.

## Rollback Point

If this task breaks tests, build, public tool schema, or MCP error response shape, revert only Task 3 files:

```bash
git restore -- src/server.ts src/server tests/server-tools.test.ts tests/server-credential-tools.test.ts tests/server-error-next-steps.test.ts tests/server-handler-sanitization.test.ts docs/agent-memory/verification-log.md
```

Use the restore command only if those files contain no unrelated user changes. If unrelated user changes are present in any file, stop and report the conflicting paths instead of restoring.

## Commit Boundary

If the user asks for a local commit after successful verification, use the configured `git-local-commit` skill and stage only Task 3 files:

```bash
git add src/server.ts src/server tests/server-tools.test.ts tests/server-credential-tools.test.ts tests/server-error-next-steps.test.ts tests/server-handler-sanitization.test.ts docs/agent-memory/verification-log.md
git commit -m "refactor: split MCP server handlers"
```

If the user has not asked for a commit, stop after reporting changed files, verification commands, skipped checks, and remaining dirty worktree state.

## Self-Review

- Spec coverage: This plan covers schema extraction, error helper extraction, handler extraction, sanitized input usage, public MCP contract tests, focused server tests, full tests, build, diff scope, and verification memory.
- Placeholder scan: The plan avoids open-ended placeholders by naming exact files, commands, tool names, error codes, expected payloads, and code shapes for new helper modules.
- Scope control: The plan explicitly excludes logging changes, package changes, README changes, source encoding cleanup, credential loading changes, release actions, and commits without user approval.
