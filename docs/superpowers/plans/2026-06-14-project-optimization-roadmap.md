# Project Optimization Roadmap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve `@xzxzzx/bilibili-mcp` maintainability, release health, credential safety, MCP compatibility, and test robustness without changing the public MCP tool contract unintentionally.

**Architecture:** Execute six independent optimization phases in dependency order. Keep each phase small enough to test and commit separately: package health, logging, MCP handler structure, type/cache tightening, encoding cleanup, and MCP integration test hardening.

**Tech Stack:** TypeScript ESM, Node16 module resolution, MCP SDK, Vitest, npm, GitHub CLI, existing project skills/subagents.

---

## Scope And Ordering

Run these phases in order:

1. Package and dependency health.
2. Logging and debug output cleanup.
3. MCP server handler refactor.
4. Type and cache hardening.
5. Source comment and metadata encoding cleanup.
6. MCP integration test hardening.

Do not combine phases into one commit. Each phase should pass its own focused checks before moving to the next.

## Fixed Capability Triggers

- Package/dependency work: use `package-maintainer`; use `secret-scanning` if package contents or publish surface changes; use `release-verifier` before accepting release-facing changes.
- Logging/credential work: use `secret-scanning`; use `credential-sanitizer` if credential loading or redaction changes; use `risk-reviewer` after implementation.
- Tests: use `vitest`; use `test-baseline-builder` when adding or restructuring test coverage.
- Build failures: use `build-error-resolver`.
- Memory updates: use `bilibili-mcp-memory`.
- GitHub or npm remote state: use `gh` or npm CLI for live state, and docs-grounded skills for rules.

## Current Evidence Baseline

- `npm test` passes: 12 files, 125 tests.
- `npm run build` passes.
- `npm pack --dry-run` passes for `@xzxzzx/bilibili-mcp@1.4.6`, 102 files.
- `npm audit --json` reports one high dev-dependency issue: `esbuild <0.28.1`.
- `package.json` version is `1.4.6`; `package-lock.json` still records `1.4.5`.
- `src/server.ts` contains repeated validation/error response code and unused `sanitizedInput` locals.
- `src/bilibili/http.ts` contains direct debug `console.error` statements.
- Some source comments contain historical mojibake; README/package user-facing Chinese is mostly valid UTF-8.

---

### Task 1: Package And Dependency Health

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Inspect: `.github/workflows/publish.yml`
- Inspect: `.npmignore`

**Capability:** Claude Code should use `package-maintainer`. Codex should use `release-verifier` for final review.

- [ ] **Step 1: Inspect package mismatch and audit state**

Run:

```bash
node -e "const p=require('./package.json'); const l=require('./package-lock.json'); console.log({package:p.version, lock:l.version, root:l.packages[''].version})"
npm audit --json
```

Expected before fix:

```text
package: 1.4.6
lock: 1.4.5
root: 1.4.5
```

Expected audit finding: `esbuild` high severity with a fix available.

- [ ] **Step 2: Update package lock and esbuild**

Run:

```bash
npm install --save-dev esbuild@^0.28.1
```

Expected:

```text
package-lock.json root version matches package.json
node_modules esbuild resolves to 0.28.1 or newer compatible version
```

- [ ] **Step 3: Verify package health**

Run:

```bash
npm audit --json
npm test
npm run build
npm pack --dry-run
git diff -- package.json package-lock.json
```

Expected:

```text
npm audit has zero high/critical vulnerabilities or only documented non-blocking findings
npm test passes
npm run build passes
npm pack --dry-run includes dist, README.md, README_EN.md, LICENSE, package.json
```

- [ ] **Step 4: Risk review and commit**

Review:

```bash
rg -n "smithery|Smithery|NPM_TOKEN|NODE_AUTH_TOKEN|npm_[A-Za-z0-9]|ghp_[A-Za-z0-9]" package.json package-lock.json .github/workflows .npmignore
```

Expected: no real token or restored Smithery runtime configuration.

Commit:

```bash
git add package.json package-lock.json
git commit -m "chore: refresh package dependency health"
```

Rollback point: revert this commit if dependency resolution breaks build/test/package dry-run.

---

### Task 2: Logging And Debug Output Cleanup

**Files:**
- Modify: `src/utils/logger.ts`
- Modify: `src/bilibili/http.ts`
- Modify: `src/bilibili/comments-api.ts`
- Modify: `src/bilibili/comments.ts`
- Modify: `src/bilibili/subtitle.ts`
- Modify: `src/bilibili/video-api.ts`
- Test: `tests/logger-redaction.test.ts`

**Capability:** Use `secret-scanning`; use `credential-sanitizer` if credential logging changes; use `risk-reviewer` after implementation.

- [ ] **Step 1: Add logger behavior tests**

Extend `tests/logger-redaction.test.ts` with assertions for debug gating and structured redaction:

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
    Cookie: "SESSDATA=<placeholder-sess>; bili_jct=<placeholder-jct>",
  });

  const output = String(spy.mock.calls[0][0]);
  expect(output).toContain("SESSDATA=***");
  expect(output).toContain("bili_jct=***");
  expect(output).not.toContain("<placeholder-sess>");
  process.env.BILIBILI_MCP_DEBUG = previous;
  spy.mockRestore();
});
```

- [ ] **Step 2: Implement logger debug gating**

Update `src/utils/logger.ts` so `Logger.debug()` returns without writing unless `process.env.BILIBILI_MCP_DEBUG === "1"`:

```ts
static debug(message: string, data?: unknown, context?: Record<string, unknown>) {
  if (process.env.BILIBILI_MCP_DEBUG !== "1") {
    return;
  }
  this.log("debug", message, data, context);
}
```

Also replace logger `any` parameters touched in this task with `unknown` where practical.

- [ ] **Step 3: Replace direct debug console calls in API layers**

Replace direct diagnostic logs such as:

```ts
console.error(`[DEBUG] fetchWithoutWBI: ${path}`, params);
console.error(`[DEBUG] Fetching URL: ${url.toString()}`);
```

with:

```ts
logger.debug("fetchWithoutWBI", { path, params }, { type: "bilibili-http" });
logger.debug("fetch URL", { url: url.toString() }, { type: "bilibili-http" });
```

For errors that should always remain visible, use `logger.error(...)` with redacted payloads.

- [ ] **Step 4: Focused verification**

Run:

```bash
npm test -- tests/logger-redaction.test.ts tests/bilibili-video-api.test.ts tests/bilibili-transcript.test.ts
npm run build
rg -n "\\[DEBUG\\]|console\\.error\\(" src/bilibili src/utils
```

Expected:

```text
Focused tests pass
Build passes
Remaining console.error calls are limited to intentional stdio/server startup or logger implementation
```

- [ ] **Step 5: Secret scan and commit**

Run:

```bash
rg -n "SESSDATA=|bili_jct=|DedeUserID=|BILIBILI_SESSDATA=|BILIBILI_BILI_JCT=|BILIBILI_DEDEUSERID=" src tests
```

Expected: only redaction tests and safe pattern matching, no real values.

Commit:

```bash
git add src tests
git commit -m "chore: centralize debug logging"
```

Rollback point: revert if logs stop reaching stderr or tests detect lost redaction.

---

### Task 3: MCP Server Handler Refactor

**Files:**
- Modify: `src/server.ts`
- Create: `src/server/tool-schemas.ts`
- Create: `src/server/tool-handlers.ts`
- Create: `src/server/error-response.ts`
- Test: `tests/server-tools.test.ts`
- Test: `tests/server-credential-tools.test.ts`
- Test: `tests/server-error-next-steps.test.ts`

**Capability:** Use `risk-reviewer` after implementation. Use `build-error-resolver` if TypeScript or MCP registration fails.

- [ ] **Step 1: Add baseline contract tests before refactor**

Add or confirm these assertions in `tests/server-tools.test.ts`:

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

Run:

```bash
npm test -- tests/server-tools.test.ts
```

Expected: PASS before refactor.

- [ ] **Step 2: Extract schemas**

Create `src/server/tool-schemas.ts`:

```ts
import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const toolSchemas: Tool[] = [
  /* move the existing six tool schema objects here without changing names,
     descriptions, properties, required fields, or enum values */
];
```

Implementation rule: copy the exact current objects from `src/server.ts`, then run `npm test -- tests/server-tools.test.ts`.

- [ ] **Step 3: Extract shared error response builder**

Create `src/server/error-response.ts`:

```ts
import { BilibiliAPIError } from "../utils/errors.js";
import { buildCredentialNextSteps } from "../utils/credential-guidance.js";

export function buildErrorPayload(error: unknown): Record<string, unknown> {
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

export function buildValidationErrorPayload(error: unknown): Record<string, unknown> {
  return {
    error: true,
    message: error instanceof Error ? error.message : "Invalid input",
    code: "VALIDATION_ERROR",
  };
}
```

- [ ] **Step 4: Extract handlers without changing behavior**

Create `src/server/tool-handlers.ts` with one exported dispatcher:

```ts
export async function handleToolCall(
  name: string,
  args: Record<string, unknown> | undefined,
) {
  switch (name) {
    /* move existing switch cases here */
  }
}
```

Implementation rules:

- Preserve all current tool names.
- Preserve response JSON shapes.
- Replace unused `const sanitizedInput = sanitizeBVInput(bvidOrUrl);` with `const sanitizedBvidOrUrl = sanitizeBVInput(bvidOrUrl);` and pass the sanitized value to downstream functions.
- Keep `COOKIE_EXPIRED` and `SUBTITLE_UNAVAILABLE` `next_steps`.

- [ ] **Step 5: Reduce `src/server.ts` to registration**

`src/server.ts` should only create the server, register `tools/list`, register `tools/call`, and use `redactSecrets` in the top-level catch.

Expected shape:

```ts
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: toolSchemas,
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  try {
    return await handleToolCall(name, args as Record<string, unknown> | undefined);
  } catch (error) {
    console.error(`Error processing tool ${name}:`, redactSecrets(error));
    return {
      content: [{ type: "text", text: JSON.stringify(buildErrorPayload(error), null, 2) }],
      isError: true,
    };
  }
});
```

- [ ] **Step 6: Full MCP-focused verification**

Run:

```bash
npm test -- tests/server-tools.test.ts tests/server-credential-tools.test.ts tests/server-error-next-steps.test.ts
npm test
npm run build
```

Expected: all pass.

- [ ] **Step 7: Commit**

Commit:

```bash
git add src/server.ts src/server tests
git commit -m "refactor: split MCP tool handlers"
```

Rollback point: revert if any MCP tool schema or response shape changes unintentionally.

---

### Task 4: Type And Cache Hardening

**Files:**
- Modify: `src/utils/cache.ts`
- Modify: `src/utils/logger.ts`
- Modify: `src/bilibili/subtitle.ts`
- Modify: `src/bilibili/metadata.ts`
- Modify: `src/bilibili/comments.ts`
- Modify: `src/bilibili/types.ts`
- Test: `tests/bilibili-metadata.test.ts`
- Test: `tests/bilibili-comments-tool.test.ts`
- Test: `tests/bilibili-transcript.test.ts`

**Capability:** Use `vitest`; use `test-baseline-builder` if adding coverage.

- [ ] **Step 1: Add typed cache tests**

Create or extend tests to verify cache key behavior remains stable:

```ts
import { describe, expect, it } from "vitest";
import { CacheManager } from "../src/utils/cache.js";

describe("CacheManager key generation", () => {
  it("keeps primitive key generation stable", () => {
    const cache = new CacheManager();
    expect(cache.generateKey("comments", "BV1T6PQzQErF", "limit-5", "1", "true"))
      .toBe("comments:BV1T6PQzQErF:limit-5:1:true");
  });

  it("serializes object key parts deterministically for current object insertion order", () => {
    const cache = new CacheManager();
    expect(cache.generateKey("video", { lang: "zh-Hans" }))
      .toBe('video:{"lang":"zh-Hans"}');
  });
});
```

Run:

```bash
npm test -- tests/cache.test.ts
```

Expected: PASS if current behavior is preserved.

- [ ] **Step 2: Replace cache `any` with generics**

Update `src/utils/cache.ts`:

```ts
export class CacheManager<VideoValue = unknown, CommentValue = unknown> {
  private videoCache: QuickLRU<string, VideoValue>;
  private commentCache: QuickLRU<string, CommentValue>;

  getVideoInfo(key: string): VideoValue | undefined { ... }
  setVideoInfo(key: string, value: VideoValue): void { ... }
  getCommentInfo(key: string): CommentValue | undefined { ... }
  setCommentInfo(key: string, value: CommentValue): void { ... }
  generateKey(prefix: string, ...args: unknown[]): string { ... }
}
```

Export the default singleton with local union types:

```ts
export const cacheManager = new CacheManager();
```

- [ ] **Step 3: Tighten API wrapper types**

Replace local `as any` in `src/bilibili/subtitle.ts` and related wrappers with interfaces from `src/bilibili/types.ts`.

Add missing interfaces if needed:

```ts
export interface VideoInfoResponseData {
  bvid?: string;
  title: string;
  owner?: { name?: string };
  duration?: number;
  desc?: string;
  cid: number;
  pubdate?: number;
  tag?: Array<{ tag_name: string }>;
  stat?: Record<string, number>;
  need_login_subtitle?: boolean;
  preview_toast?: string;
}
```

- [ ] **Step 4: Verify typing and behavior**

Run:

```bash
npm test -- tests/bilibili-metadata.test.ts tests/bilibili-comments-tool.test.ts tests/bilibili-transcript.test.ts
npm run build
rg -n "\\bany\\b" src/utils src/bilibili
```

Expected:

```text
Focused tests pass
Build passes
any count decreases in touched files
```

- [ ] **Step 5: Commit**

Commit:

```bash
git add src tests
git commit -m "refactor: tighten cache and API wrapper types"
```

Rollback point: revert if type tightening changes runtime response shapes.

---

### Task 5: Source Comment And Metadata Encoding Cleanup

**Files:**
- Modify: `src/utils/cache.ts`
- Modify: `src/utils/logger.ts`
- Modify: `src/config.ts`
- Modify: `src/server.ts` or extracted server files from Task 3
- Modify: selected `src/bilibili/*.ts` comments only
- Modify if needed: `package.json`

**Capability:** Use `risk-reviewer` for scope control. Do not mix with behavior changes.

- [ ] **Step 1: Identify mojibake-only targets**

Run:

```bash
python - <<'PY'
from pathlib import Path
markers = ["鍑", "璇", "瑙", "妫", "鈥", "鉂", "绔"]
for path in Path("src").rglob("*.ts"):
    text = path.read_text(encoding="utf-8", errors="replace")
    if any(marker in text for marker in markers):
        print(path)
PY
```

Expected: list of source files with corrupted comments or messages.

- [ ] **Step 2: Clean comments in small batches**

Rules:

- Only change comments and user-facing descriptions that are visibly corrupted.
- Do not rewrite logic.
- Prefer English comments if exact original Chinese meaning is uncertain.
- Preserve valid Chinese text in README and CLI.

Example replacement in `src/utils/cache.ts`:

```ts
/**
 * Cache manager for video information and comment data.
 * Uses LRU caches with separate TTLs for video and comment responses.
 */
```

- [ ] **Step 3: Check behavior-neutral diff**

Run:

```bash
git diff -- src | rg -n "^[+-][^+-]"
npm run build
npm test
```

Expected:

```text
Diff contains comment/string cleanup only for this phase
Build passes
Tests pass
```

- [ ] **Step 4: Check package metadata encoding**

Run:

```bash
node -e "const p=require('./package.json'); console.log(p.keywords)"
```

If Chinese keywords print as mojibake, replace only the corrupted keyword strings with clean UTF-8 or remove them if they are redundant.

- [ ] **Step 5: Commit**

Commit:

```bash
git add src package.json package-lock.json
git commit -m "docs: clean source comment encoding"
```

Rollback point: revert if any behavior diff appears.

---

### Task 6: MCP Integration Test Hardening

**Files:**
- Create: `tests/mcp-server-smoke.test.ts`
- Modify: `tests/server-tools.test.ts`
- Modify: `tests/server-credential-tools.test.ts`
- Modify: `tests/server-error-next-steps.test.ts`
- Optionally create: `tests/helpers/mcp.ts`

**Capability:** Use `vitest`; use `test-baseline-builder`.

- [ ] **Step 1: Add a shared test helper for SDK internal handler access**

Create `tests/helpers/mcp.ts`:

```ts
import { server } from "../../src/server.js";

export function getMcpHandler<TRequest, TResponse>(method: string) {
  const handlers = (server as unknown as { _requestHandlers?: Map<string, unknown> })._requestHandlers;
  if (!handlers) {
    throw new Error("MCP SDK request handler map is not available");
  }
  const handler = handlers.get(method);
  if (!handler) {
    throw new Error(`${method} handler not registered`);
  }
  return handler as (request: TRequest) => Promise<TResponse>;
}
```

Update existing server tests to import this helper instead of duplicating private `_requestHandlers` access.

- [ ] **Step 2: Add stdio smoke test for package entrypoint**

Create `tests/mcp-server-smoke.test.ts`:

```ts
import { spawn } from "node:child_process";
import { describe, expect, it } from "vitest";

describe("MCP stdio entrypoint", () => {
  it("starts without writing protocol data to stderr only startup log", async () => {
    const child = spawn(process.execPath, ["dist/index.js"], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    const stderrChunks: Buffer[] = [];
    child.stderr.on("data", (chunk) => stderrChunks.push(Buffer.from(chunk)));

    await new Promise((resolve) => setTimeout(resolve, 300));
    child.kill();

    const stderr = Buffer.concat(stderrChunks).toString("utf8");
    expect(stderr).toContain("Bilibili MCP server running on stdio");
  });
});
```

Run `npm run build` before this test because it uses `dist/index.js`.

- [ ] **Step 3: Add tool list smoke coverage**

Add to `tests/mcp-server-smoke.test.ts` or a helper-driven test:

```ts
it("lists all public tools through the registered MCP handler", async () => {
  const handler = getMcpHandler("tools/list");
  const result = await handler({
    method: "tools/list",
    jsonrpc: "2.0",
    id: 1,
    params: {},
  });

  expect(result.tools.map((tool: { name: string }) => tool.name)).toEqual([
    "get_credential_setup_instructions",
    "check_bilibili_credentials",
    "get_video_info",
    "get_video_comments",
    "get_video_transcript",
    "get_video_metadata",
  ]);
});
```

- [ ] **Step 4: Verify full suite and package**

Run:

```bash
npm run build
npm test
npm pack --dry-run
```

Expected:

```text
Build passes
All tests pass
Package dry-run still excludes tests, docs/agent-memory, .claude, .codex, and .env
```

- [ ] **Step 5: Commit**

Commit:

```bash
git add tests
git commit -m "test: harden MCP server integration coverage"
```

Rollback point: revert if smoke test is flaky on Windows process shutdown.

---

## Final Acceptance Gate

After all six tasks are complete:

- [ ] `git status --short` contains only intended final changes.
- [ ] `npm audit --json` has no high or critical issues, or remaining findings are documented as non-release blockers.
- [ ] `npm test` passes.
- [ ] `npm run build` passes.
- [ ] `npm pack --dry-run` passes and package contents remain clean.
- [ ] Secret scan finds no real Cookie, npm token, GitHub token, or `.env` values:

```bash
rg -n "SESSDATA=|bili_jct=|DedeUserID=|npm_[A-Za-z0-9]|ghp_[A-Za-z0-9]|NODE_AUTH_TOKEN|NPM_TOKEN" src tests README.md README_EN.md package.json .github
```

- [ ] MCP public tool names remain:
  - `get_credential_setup_instructions`
  - `check_bilibili_credentials`
  - `get_video_info`
  - `get_video_comments`
  - `get_video_transcript`
  - `get_video_metadata`
- [ ] `docs/agent-memory/verification-log.md` records the final verification result.
- [ ] If a durable lesson or decision is discovered, update `docs/agent-memory/lessons-learned.md` or `docs/agent-memory/decisions.md`.

## Recommended Execution Order For Claude Code

1. Use `package-maintainer` for Task 1.
2. Use `credential-sanitizer` or normal implementation plus `risk-reviewer` for Task 2.
3. Use normal implementation plus `risk-reviewer` for Task 3.
4. Use `test-baseline-builder` for Task 4 if adding tests.
5. Use normal scoped editing for Task 5.
6. Use `test-baseline-builder` for Task 6.
7. Use `release-verifier` for the final acceptance gate.

## Self-Review

- Spec coverage: all six requested optimization directions are represented as separate implementation tasks.
- Placeholder scan: no open-ended placeholder tasks are intentionally left; each task has concrete files, commands, checks, and rollback points.
- Type consistency: file names, tool names, and command names match the current repository state.
