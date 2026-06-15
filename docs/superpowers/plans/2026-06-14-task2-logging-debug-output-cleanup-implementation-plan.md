# Task 2 Logging Debug Output Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Centralize Bilibili API diagnostic output through the existing redacting logger and make debug-level logs silent unless `BILIBILI_MCP_DEBUG=1`.

**Architecture:** Keep the current stderr-safe logger as the single output path for structured logs. Convert debug and diagnostic `console.error` calls in Bilibili API modules to `logger.debug`, `logger.warn`, or `logger.error` according to severity, while preserving thrown errors, fallback behavior, cache behavior, MCP response shapes, and credential redaction.

**Tech Stack:** TypeScript ESM, Vitest, existing `src/utils/logger.ts`, Node `process.env`, `rg`, npm scripts.

---

## Scope

Task 2 is only about logging and debug output cleanup.

Expected direct edits:

- `tests/logger-redaction.test.ts`: add tests for debug gating and debug redaction.
- `src/utils/logger.ts`: add debug gating and replace logger-facing `any` in touched signatures with `unknown`.
- `src/bilibili/http.ts`: route request diagnostics and API error logs through `logger`.
- `src/bilibili/comments-api.ts`: route comment API diagnostics and fallback logs through `logger`.
- `src/bilibili/comments.ts`: route cache, disabled-comments, and error logs through `logger`.
- `src/bilibili/subtitle.ts`: route cache, subtitle fallback, and error logs through `logger`.
- `src/bilibili/video-api.ts`: route subtitle fallback diagnostics through `logger`.

Expected inspections:

- `src/server.ts`, `src/cli.ts`, `src/index.ts`, and `src/utils/retry.ts`: confirm remaining `console.error` calls are intentional process/server/retry stderr output or outside Task 2 scope.

Out of scope:

- Do not clean mojibake comments or Chinese strings; that belongs to Task 5.
- Do not refactor `src/server.ts`; that belongs to Task 3.
- Do not change cache keys, fallback decisions, thrown error classes, or MCP response JSON.
- Do not change credential loading or Cookie construction.
- Do not change package dependencies or lockfile.
- Do not commit unless the user explicitly asks.

## Capability Use

- Use `secret-scanning` style checks because this task touches logging and credential redaction boundaries.
- Use `credential-sanitizer` only if implementation touches credential loading, Cookie construction, or credential status behavior. The expected implementation should not need it.
- Use `risk-reviewer` after implementation because log changes can affect MCP stderr discipline, credential leakage, and fallback visibility.
- Use local CLI commands for authoritative facts: `rg`, `npm test`, `npm run build`, `git diff`.

---

### Task 1: Add Debug Gating And Redaction Tests

**Files:**

- Modify: `tests/logger-redaction.test.ts`

- [x] **Step 1: Add tests before changing logger behavior**

Append these tests inside the existing `describe("logger secret redaction", () => { ... })` block in `tests/logger-redaction.test.ts`:

```ts
  it("does not emit debug logs unless debug logging is enabled", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const previous = process.env.BILIBILI_MCP_DEBUG;
    delete process.env.BILIBILI_MCP_DEBUG;

    logger.debug("debug message", { Cookie: "SESSDATA=<placeholder-sess>" });

    expect(spy).not.toHaveBeenCalled();
    process.env.BILIBILI_MCP_DEBUG = previous;
    spy.mockRestore();
  });

  it("emits redacted debug logs when debug logging is enabled", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const previous = process.env.BILIBILI_MCP_DEBUG;
    process.env.BILIBILI_MCP_DEBUG = "1";

    logger.debug("debug message SESSDATA=<placeholder-sess>", {
      Cookie: "SESSDATA=<placeholder-sess>; bili_jct=<placeholder-jct>; DedeUserID=<placeholder-user-id>",
      nested: {
        message: "BILIBILI_SESSDATA=<placeholder-env>",
      },
    });

    const output = spy.mock.calls.map((call) => call.join(" ")).join("\n");
    process.env.BILIBILI_MCP_DEBUG = previous;
    spy.mockRestore();

    expect(output).toContain('"level":"debug"');
    expect(output).toContain("SESSDATA=***");
    expect(output).toContain('"Cookie":"***"');
    expect(output).not.toContain("<placeholder-sess>");
    expect(output).not.toContain("<placeholder-jct>");
    expect(output).not.toContain("123456");
    expect(output).not.toContain("<placeholder-env>");
  });
```

Run:

```bash
npm test -- tests/logger-redaction.test.ts
```

Expected before implementation:

```text
The new "does not emit debug logs unless debug logging is enabled" test fails because logger.debug currently always writes to stderr.
The existing redaction tests continue to pass.
```

If the whole file fails for unrelated reasons, stop and report the exact failure before changing production code.

---

### Task 2: Implement Debug Gating In Logger

**Files:**

- Modify: `src/utils/logger.ts`
- Test: `tests/logger-redaction.test.ts`

- [x] **Step 1: Update logger types and debug gating**

In `src/utils/logger.ts`, change the touched logger value types from `any` to `unknown` and make static `debug` return early unless `BILIBILI_MCP_DEBUG` is exactly `"1"`.

Use this target shape for the top-level entry and static methods:

```ts
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: unknown;
  context?: Record<string, unknown>;
}

export class Logger {
  private static log(
    level: LogLevel,
    message: string,
    data?: unknown,
    context?: Record<string, unknown>,
  ) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message: redactString(message),
      data: redactSecrets(data),
      context: redactSecrets(context) as Record<string, unknown> | undefined,
    };

    console.error(JSON.stringify(entry));
  }

  static info(message: string, data?: unknown, context?: Record<string, unknown>) {
    this.log("info", message, data, context);
  }

  static warn(message: string, data?: unknown, context?: Record<string, unknown>) {
    this.log("warn", message, data, context);
  }

  static error(message: string, data?: unknown, context?: Record<string, unknown>) {
    this.log("error", message, data, context);
  }

  static debug(message: string, data?: unknown, context?: Record<string, unknown>) {
    if (process.env.BILIBILI_MCP_DEBUG !== "1") {
      return;
    }
    this.log("debug", message, data, context);
  }
}
```

Keep the existing `redactString`, `redactSecrets`, helper methods, instance methods, and `export const logger = Logger;` behavior. Update helper method parameter types that are touched in this file from `Record<string, any>` to `Record<string, unknown>`.

- [x] **Step 2: Verify logger tests pass**

Run:

```bash
npm test -- tests/logger-redaction.test.ts
```

Expected:

```text
All logger redaction tests pass.
Debug logs are silent by default.
Debug logs are emitted and redacted when BILIBILI_MCP_DEBUG=1.
```

---

### Task 3: Replace Debug And Diagnostic Console Output In API Modules

**Files:**

- Modify: `src/bilibili/http.ts`
- Modify: `src/bilibili/comments-api.ts`
- Modify: `src/bilibili/comments.ts`
- Modify: `src/bilibili/subtitle.ts`
- Modify: `src/bilibili/video-api.ts`

- [x] **Step 1: Convert `src/bilibili/http.ts` logging**

Keep `import { logger } from "../utils/logger.js";`.

Replace direct diagnostic `console.error` calls with structured logger calls:

```ts
logger.debug(
  "Sending WBI request",
  {
    url: url.toString(),
    headers: finalHeaders,
  },
  { type: "bilibili-http", operation: "fetchWithWBI" },
);
```

```ts
logger.warn(
  "WBI request failed",
  {
    error: errorMsg,
    url: url.toString(),
    status: response.status,
    statusText: response.statusText,
  },
  { type: "bilibili-http", operation: "fetchWithWBI" },
);
```

```ts
logger.warn(
  "Bilibili credentials appear expired",
  { url: url.toString(), code: data.code },
  { type: "bilibili-http", code: "COOKIE_EXPIRED" },
);
```

```ts
logger.warn(
  "Bilibili API returned an error",
  {
    code: data.code,
    message: data.message,
    url: url.toString(),
    params,
  },
  { type: "bilibili-http", operation: "fetchWithWBI" },
);
```

```ts
logger.error(
  "WBI request threw",
  {
    error: error instanceof Error ? error.message : String(error),
    path,
    params,
    url: tempUrl.toString(),
  },
  { type: "bilibili-http", operation: "fetchWithWBI" },
);
```

For `fetchWithoutWBI`, replace:

```ts
console.error(`[DEBUG] fetchWithoutWBI: ${path}`, params);
console.error(`[DEBUG] Fetching URL: ${url.toString()}`);
```

with:

```ts
logger.debug(
  "fetchWithoutWBI request",
  { path, params },
  { type: "bilibili-http", operation: "fetchWithoutWBI" },
);
```

```ts
logger.debug(
  "fetchWithoutWBI URL",
  { url: url.toString() },
  { type: "bilibili-http", operation: "fetchWithoutWBI" },
);
```

Do not change the error classes thrown in this file.

- [x] **Step 2: Convert `src/bilibili/comments-api.ts` logging**

Add this import:

```ts
import { logger } from "../utils/logger.js";
```

Replace comment API diagnostics with structured logger calls:

```ts
logger.debug(
  "Fetching video comments",
  {
    bvid,
    oid: Number(oid),
    type,
    page,
    pageSize,
    sort,
    includeReplies,
    isBangumi,
  },
  { type: "comments-api" },
);
```

```ts
logger.debug(
  "Trying WBI comments API",
  { path: wbiPath },
  { type: "comments-api" },
);
```

```ts
logger.debug(
  "WBI comments API returned empty comments, falling back to plain comments API",
  { bvid, oid: Number(oid) },
  { type: "comments-api" },
);
```

```ts
logger.warn(
  "WBI comments API failed, falling back to plain comments API",
  { error: errorMsg, bvid, oid: Number(oid) },
  { type: "comments-api" },
);
```

```ts
logger.error(
  "Plain comments API also failed",
  { error: fallbackErrorMsg, bvid, oid: Number(oid) },
  { type: "comments-api" },
);
```

Do not alter the WBI-first then plain-API fallback sequence.

- [x] **Step 3: Convert `src/bilibili/comments.ts` logging**

Change the import:

```ts
import { logger, redactSecrets } from "../utils/logger.js";
```

Replace cache and disabled-comment logs:

```ts
logger.debug(
  "Comments cache hit",
  { bvid, cacheKey },
  { type: "comments" },
);
```

```ts
logger.debug(
  "Comments cache miss",
  { bvid, cacheKey },
  { type: "comments" },
);
```

```ts
logger.warn(
  "Comments disabled for video",
  { bvid },
  { type: "comments" },
);
```

Replace final error logging:

```ts
logger.error(
  "Error getting video comments",
  { error: redactSecrets(error) },
  { type: "comments" },
);
```

Do not change the `CommentsDisabledError` handling path or empty result shape.

- [x] **Step 4: Convert `src/bilibili/subtitle.ts` logging**

Change the import:

```ts
import { logger, redactSecrets } from "../utils/logger.js";
```

Replace cache and fallback logs:

```ts
logger.debug("Video cache hit", { bvid, cacheKey }, { type: "subtitle" });
logger.debug("Video cache miss", { bvid, cacheKey }, { type: "subtitle" });
```

```ts
logger.warn(
  "Video returned no subtitles; verifying login status",
  { bvid },
  { type: "subtitle" },
);
```

```ts
logger.info(
  "Video has no subtitles while credentials are logged in",
  { bvid },
  { type: "subtitle" },
);
```

```ts
logger.debug(
  "Not caching fallback result to allow future retries",
  { bvid },
  { type: "subtitle" },
);
```

```ts
logger.warn(
  "Failed to fetch subtitles, using description fallback",
  { bvid, error: error instanceof Error ? error.message : error },
  { type: "subtitle" },
);
```

Replace final error logging:

```ts
logger.error(
  "Error getting video info with subtitle",
  { error: redactSecrets(error) },
  { type: "subtitle" },
);
```

Do not change the rule that `COOKIE_EXPIRED` propagates and does not silently fall back.

- [x] **Step 5: Convert `src/bilibili/video-api.ts` logging**

Keep existing `import { logger } from "../utils/logger.js";`.

Replace subtitle fallback diagnostics:

```ts
logger.debug(
  "WBI subtitle API returned empty subtitles, falling back to /x/player/v2",
  { bvid, cid },
  { type: "video-api", operation: "getVideoSubtitle" },
);
```

```ts
logger.info(
  "Subtitle fallback succeeded",
  { bvid, cid, subtitleCount: fallbackResult.subtitle.subtitles.length },
  { type: "video-api", operation: "getVideoSubtitle" },
);
```

```ts
logger.info(
  "Subtitle fallback also returned no subtitles",
  { bvid, cid },
  { type: "video-api", operation: "getVideoSubtitle" },
);
```

Do not change the `getVideoSubtitle` return type or fallback call order.

---

### Task 4: Focused Verification

**Files:**

- Inspect: `src/bilibili/*.ts`
- Inspect: `src/utils/logger.ts`
- Test: `tests/logger-redaction.test.ts`

- [x] **Step 1: Run focused tests and build**

Run:

```bash
npm test -- tests/logger-redaction.test.ts tests/bilibili-video-api.test.ts tests/bilibili-transcript.test.ts tests/bilibili-comments-tool.test.ts
npm run build
```

Expected:

```text
Focused tests pass.
TypeScript build passes.
No public MCP response shape changes are required for this task.
```

- [x] **Step 2: Confirm debug output is gated**

Run:

```bash
node -e "import('./dist/utils/logger.js').then(({logger}) => { logger.debug('debug SESSDATA=<placeholder-sess>', { Cookie: 'SESSDATA=<placeholder-sess>; bili_jct=<placeholder-jct>' }); })"
```

Expected:

```text
No output is printed because BILIBILI_MCP_DEBUG is not set to 1.
```

Run:

```bash
$env:BILIBILI_MCP_DEBUG='1'; node -e "import('./dist/utils/logger.js').then(({logger}) => { logger.debug('debug SESSDATA=<placeholder-sess>', { Cookie: 'SESSDATA=<placeholder-sess>; bili_jct=<placeholder-jct>' }); })"; Remove-Item Env:BILIBILI_MCP_DEBUG
```

Expected:

```text
One JSON log line is printed to stderr.
The output contains SESSDATA=*** or "Cookie":"***".
The output does not contain `<placeholder-sess>` or `<placeholder-jct>`.
```

- [x] **Step 3: Scan remaining direct stderr output**

Run:

```bash
rg -n "\\[DEBUG\\]|console\\.error\\(" src/bilibili src/utils src/server.ts src/cli.ts src/index.ts
```

Expected allowed remaining matches:

```text
src/utils/logger.ts: console.error(JSON.stringify(entry))
src/server.ts: top-level tool error reporting with redactSecrets
src/cli.ts and src/index.ts: stdio startup or fatal process messages with redactSecrets
src/utils/retry.ts if included in scan: retry status messages, unchanged by Task 2
```

Expected disallowed matches:

```text
No [DEBUG] lines remain in src/bilibili.
No direct console.error diagnostic calls remain in src/bilibili/http.ts, comments-api.ts, comments.ts, subtitle.ts, or video-api.ts.
```

---

### Task 5: Secret Scan, Full Verification, And Memory Record

**Files:**

- Modify if completed: `docs/agent-memory/verification-log.md`
- Inspect: `src`
- Inspect: `tests`

- [x] **Step 1: Run secret-oriented scan**

Run:

```bash
rg -n "SESSDATA=|bili_jct=|DedeUserID=|BILIBILI_SESSDATA=|BILIBILI_BILI_JCT=|BILIBILI_DEDEUSERID=" src tests
```

Expected:

```text
Matches are limited to redaction functions, redaction tests, credential header construction, and safe pattern checks.
No real Cookie value is present.
```

If a real credential value is found, stop, remove or externalize it, and report that credential rotation is required.

- [x] **Step 2: Run full verification**

Run:

```bash
npm test
npm run build
```

Expected:

```text
All Vitest tests pass.
TypeScript build passes.
```

- [x] **Step 3: Record Task 2 verification**

If Step 1 and Step 2 pass, append this entry to `docs/agent-memory/verification-log.md`:

```markdown
## 2026-06-14 Task 2 Logging Debug Output Cleanup

- Commands: `npm test -- tests/logger-redaction.test.ts tests/bilibili-video-api.test.ts tests/bilibili-transcript.test.ts tests/bilibili-comments-tool.test.ts`; `npm test`; `npm run build`; logger debug smoke check; logging and secret scans with `rg`.
- Result: Debug logs are silent unless `BILIBILI_MCP_DEBUG=1`, debug output remains redacted when enabled, Bilibili API diagnostics route through the redacting logger, tests/build pass, and no real credential value was found.
- Caveat: No MCP tool contract, credential loading behavior, package metadata, tag, push, publish, or GitHub release was changed.
```

Do not update `docs/agent-memory/decisions.md` or `docs/agent-memory/lessons-learned.md` unless implementation discovers a new durable decision or repeated pitfall.

- [x] **Step 4: Inspect diff scope**

Run:

```bash
git diff -- src/utils/logger.ts src/bilibili/http.ts src/bilibili/comments-api.ts src/bilibili/comments.ts src/bilibili/subtitle.ts src/bilibili/video-api.ts tests/logger-redaction.test.ts docs/agent-memory/verification-log.md
git status --short
```

Expected:

```text
Task 2 diff is limited to logger tests, logger implementation, Bilibili API logging call sites, and verification-log append.
Existing unrelated dirty files remain unstaged and untouched.
```

---

## Acceptance Criteria

- `logger.debug(...)` emits nothing unless `process.env.BILIBILI_MCP_DEBUG === "1"`.
- Debug logs emitted with `BILIBILI_MCP_DEBUG=1` are still redacted.
- No `[DEBUG]` string remains in `src/bilibili`.
- Direct Bilibili API diagnostic `console.error` calls in Task 2 files are replaced with `logger.debug`, `logger.warn`, or `logger.error`.
- Remaining `console.error` calls are intentional stderr protocol/process output or `Logger` internals.
- `COOKIE_EXPIRED` propagation remains unchanged.
- Comments fallback, subtitle fallback, cache hit/miss behavior, and MCP response shapes remain unchanged.
- No real Cookie, token, `.env` value, `SESSDATA`, `bili_jct`, or `DedeUserID` is introduced.
- Focused tests pass.
- Full `npm test` passes.
- `npm run build` passes.
- No package, README, release workflow, MCP handler refactor, type/cache hardening, or encoding cleanup changes are mixed into this task.

## Rollback Point

If this task breaks tests, build, credential redaction, or fallback behavior, revert only Task 2 files:

```bash
git restore -- src/utils/logger.ts src/bilibili/http.ts src/bilibili/comments-api.ts src/bilibili/comments.ts src/bilibili/subtitle.ts src/bilibili/video-api.ts tests/logger-redaction.test.ts docs/agent-memory/verification-log.md
```

Use the restore command only if those files contain no unrelated user changes. If unrelated user changes are present in any file, stop and report the conflicting paths instead of restoring.

## Commit Boundary

If the user asks for a local commit after successful verification, use the configured `git-local-commit` skill and stage only Task 2 files:

```bash
git add src/utils/logger.ts src/bilibili/http.ts src/bilibili/comments-api.ts src/bilibili/comments.ts src/bilibili/subtitle.ts src/bilibili/video-api.ts tests/logger-redaction.test.ts docs/agent-memory/verification-log.md
git commit -m "chore: centralize debug logging"
```

If the user has not asked for a commit, stop after reporting changed files, verification commands, skipped checks, and remaining dirty worktree state.

## Self-Review

- Spec coverage: This plan covers debug gating, redaction tests, Bilibili API logging conversion, direct stderr scan, secret scan, focused tests, full tests, build, and verification memory.
- Placeholder scan: No open-ended placeholder steps remain; each step has concrete commands, code shapes, and expected outcomes.
- Scope control: The plan explicitly excludes encoding cleanup, MCP handler refactor, package changes, README changes, credential loading changes, release actions, and commits without user approval.
