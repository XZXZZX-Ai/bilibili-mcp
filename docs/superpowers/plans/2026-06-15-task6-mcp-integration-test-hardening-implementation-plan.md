# Task 6 MCP Integration Test Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden MCP integration coverage by sharing registered-handler test helpers and adding a lightweight stdio entrypoint smoke test without changing runtime behavior.

**Architecture:** Keep production source unchanged. Move repeated test-only MCP `_requestHandlers` access into one helper, update existing server tests to use it, then add a build-dependent smoke test for `dist/index.js` startup behavior and final package dry-run verification.

**Tech Stack:** TypeScript ESM, Node16 module resolution, MCP SDK `Server`, Vitest, Node `child_process`, npm build/test/pack.

---

## Scope

Task 6 is only about MCP integration test hardening.

Expected direct edits:

- Create: `tests/helpers/mcp.ts`
- Create: `tests/mcp-server-smoke.test.ts`
- Modify: `tests/server-tools.test.ts`
- Modify: `tests/server-credential-tools.test.ts`
- Modify: `tests/server-error-next-steps.test.ts`
- Modify: `tests/server-handler-sanitization.test.ts`
- Modify if completed: `docs/agent-memory/verification-log.md`

Out of scope:

- Do not change `src/` runtime code.
- Do not change MCP tool names, order, schemas, or response shapes.
- Do not change credential loading, logger behavior, cache behavior, package metadata, README, workflows, release config, or package dependencies.
- Do not require real Bilibili Cookies or network access.
- Do not modify `dist/` manually.
- Do not commit unless the user explicitly asks.

## Current Test Facts

The current server tests duplicate private MCP SDK handler access:

- `tests/server-tools.test.ts`: direct `server as any)._requestHandlers` for `tools/list`.
- `tests/server-credential-tools.test.ts`: direct `server as any)._requestHandlers` for `tools/call`.
- `tests/server-error-next-steps.test.ts`: direct `server as any)._requestHandlers` for `tools/call`.
- `tests/server-handler-sanitization.test.ts`: direct `server as any)._requestHandlers` for `tools/call`.

The stdio entrypoint is `src/index.ts`, built to `dist/index.js`, and logs this startup message to stderr:

```text
Bilibili MCP server running on stdio
```

## Capability Use

- Use `vitest` for all tests.
- Claude Code should use `test-baseline-builder` if it wants a bounded test-writing subagent.
- Use `build-error-resolver` only if TypeScript, ESM import, process spawning, or MCP SDK handler access fails.
- Use local CLI commands for source facts and verification: `rg`, `npm run build`, `npm test`, `npm pack --dry-run`, `git diff`.

---

### Task 1: Add A Shared MCP Handler Test Helper

**Files:**

- Create: `tests/helpers/mcp.ts`
- Test later: `tests/server-tools.test.ts`

- [ ] **Step 1: Create `tests/helpers/mcp.ts`**

Create this exact helper:

```ts
import { server } from "../../src/server.js";

type ServerWithRequestHandlers = {
  _requestHandlers?: Map<string, unknown>;
};

export function getMcpHandler<TRequest, TResponse>(
  method: string,
): (request: TRequest) => Promise<TResponse> {
  const handlers = (server as unknown as ServerWithRequestHandlers)
    ._requestHandlers;

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

This helper intentionally uses the SDK private `_requestHandlers` field only in one test utility.

- [ ] **Step 2: Run TypeScript build for helper import path**

Run:

```bash
npm run build
```

Expected:

```text
TypeScript build passes, or fails only because the new helper is unused until later tasks.
```

If import path resolution fails, stop and report the exact TypeScript error before changing production code.

---

### Task 2: Refactor Existing Server Tests To Use The Helper

**Files:**

- Modify: `tests/server-tools.test.ts`
- Modify: `tests/server-credential-tools.test.ts`
- Modify: `tests/server-error-next-steps.test.ts`
- Modify: `tests/server-handler-sanitization.test.ts`
- Test: server-focused test files

- [ ] **Step 1: Update `tests/server-tools.test.ts`**

Replace:

```ts
import { server } from "../src/server.js";
```

with:

```ts
import { getMcpHandler } from "./helpers/mcp.js";
```

Replace the current `getListToolsResult()` implementation with:

```ts
function getListToolsResult() {
  const fakeRequest = {
    method: "tools/list",
    jsonrpc: "2.0" as const,
    id: 1,
  };
  const handler = getMcpHandler<
    typeof fakeRequest,
    {
      tools: Array<{ name: string; inputSchema: Record<string, unknown> }>;
    }
  >("tools/list");

  return handler(fakeRequest);
}
```

Do not change the existing public tool order or schema assertions.

- [ ] **Step 2: Update `tests/server-credential-tools.test.ts`**

Remove this import:

```ts
import { server } from "../src/server.js";
```

Add:

```ts
import { getMcpHandler } from "./helpers/mcp.js";
```

Replace `getCallToolHandler()` with:

```ts
function getCallToolHandler() {
  return getMcpHandler<
    {
      method: "tools/call";
      jsonrpc: "2.0";
      id: number;
      params: { name: string; arguments?: Record<string, unknown> };
    },
    {
      content: Array<{ type: string; text: string }>;
      isError?: boolean;
    }
  >("tools/call");
}
```

Do not change credential assertions or `hideGlobalCredentialConfig()`.

- [ ] **Step 3: Update `tests/server-error-next-steps.test.ts`**

Add:

```ts
import { getMcpHandler } from "./helpers/mcp.js";
```

Remove:

```ts
const { server } = await import("../src/server.js");
```

Replace `getCallToolHandler()` with the same generic helper wrapper from Task 2 Step 2.

Keep the dynamic import for `BilibiliAPIError`:

```ts
const { BilibiliAPIError } = await import("../src/utils/errors.js");
```

Do not change module mocks or error payload assertions.

- [ ] **Step 4: Update `tests/server-handler-sanitization.test.ts`**

Add:

```ts
import { getMcpHandler } from "./helpers/mcp.js";
```

Remove:

```ts
const { server } = await import("../src/server.js");
```

Replace `getCallToolHandler()` with the same generic helper wrapper from Task 2 Step 2.

Do not change the sanitized input expectation.

- [ ] **Step 5: Verify helper refactor**

Run:

```bash
npm test -- tests/server-tools.test.ts tests/server-credential-tools.test.ts tests/server-error-next-steps.test.ts tests/server-handler-sanitization.test.ts
npm run build
rg -n "_requestHandlers|server as any" tests
```

Expected:

```text
All four server-focused tests pass.
TypeScript build passes.
`_requestHandlers` appears only in `tests/helpers/mcp.ts`.
No `server as any` remains in tests.
```

---

### Task 3: Add A Stdio Entrypoint Smoke Test

**Files:**

- Create: `tests/mcp-server-smoke.test.ts`
- Test: `npm run build`
- Test: `npm test -- tests/mcp-server-smoke.test.ts`

- [ ] **Step 1: Create `tests/mcp-server-smoke.test.ts`**

Create this test:

```ts
import { spawn } from "node:child_process";
import { describe, expect, it } from "vitest";

describe("MCP stdio entrypoint", () => {
  it("starts the built stdio server and logs startup to stderr", async () => {
    const child = spawn(process.execPath, ["dist/index.js"], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    const stderrChunks: Buffer[] = [];
    const stdoutChunks: Buffer[] = [];

    child.stderr.on("data", (chunk) => {
      stderrChunks.push(Buffer.from(chunk));
    });
    child.stdout.on("data", (chunk) => {
      stdoutChunks.push(Buffer.from(chunk));
    });

    await new Promise((resolve) => setTimeout(resolve, 300));
    child.kill();

    const stderr = Buffer.concat(stderrChunks).toString("utf8");
    const stdout = Buffer.concat(stdoutChunks).toString("utf8");

    expect(stderr).toContain("Bilibili MCP server running on stdio");
    expect(stdout).toBe("");
  });
});
```

This test intentionally does not send JSON-RPC messages. It verifies the built entrypoint starts without polluting stdout with startup text.

- [ ] **Step 2: Build before running the smoke test**

Run:

```bash
npm run build
npm test -- tests/mcp-server-smoke.test.ts
```

Expected:

```text
Build passes.
Smoke test passes.
```

If the process shutdown is flaky on Windows, stop and report the exact failure. Do not weaken the assertion without Codex/user review.

---

### Task 4: Add Handler-Based Tool List Smoke Coverage

**Files:**

- Modify: `tests/mcp-server-smoke.test.ts`
- Test: `tests/mcp-server-smoke.test.ts`

- [ ] **Step 1: Add helper import and request/response types**

At the top of `tests/mcp-server-smoke.test.ts`, add:

```ts
import { getMcpHandler } from "./helpers/mcp.js";
```

Add these types below imports:

```ts
type ListToolsRequest = {
  method: "tools/list";
  jsonrpc: "2.0";
  id: number;
};

type ListToolsResponse = {
  tools: Array<{ name: string }>;
};
```

- [ ] **Step 2: Add public tool list smoke test**

Append this test inside the existing `describe("MCP stdio entrypoint", () => { ... })` block, or create a sibling `describe("MCP handler smoke", ...)` block:

```ts
it("lists all public tools through the registered MCP handler", async () => {
  const handler = getMcpHandler<ListToolsRequest, ListToolsResponse>(
    "tools/list",
  );

  const result = await handler({
    method: "tools/list",
    jsonrpc: "2.0",
    id: 1,
  });

  expect(result.tools.map((tool) => tool.name)).toEqual([
    "get_credential_setup_instructions",
    "check_bilibili_credentials",
    "get_video_info",
    "get_video_comments",
    "get_video_transcript",
    "get_video_metadata",
  ]);
});
```

- [ ] **Step 3: Verify smoke coverage**

Run:

```bash
npm run build
npm test -- tests/mcp-server-smoke.test.ts
```

Expected:

```text
Build passes.
The stdio startup smoke and handler tool-list smoke tests both pass.
```

---

### Task 5: Full Verification And Package Dry Run

**Files:**

- Inspect: `tests/helpers/mcp.ts`
- Inspect: `tests/mcp-server-smoke.test.ts`
- Inspect: updated server tests
- Modify if completed: `docs/agent-memory/verification-log.md`

- [ ] **Step 1: Run focused and global verification**

Run:

```bash
npm run build
npm test -- tests/server-tools.test.ts tests/server-credential-tools.test.ts tests/server-error-next-steps.test.ts tests/server-handler-sanitization.test.ts tests/mcp-server-smoke.test.ts
npm test
npm pack --dry-run
```

Expected:

```text
Build passes.
Server-focused tests and smoke tests pass.
Full Vitest suite passes.
Package dry-run passes and does not require test files to be packaged.
```

- [ ] **Step 2: Inspect package dry-run output**

In the `npm pack --dry-run` output, verify:

```text
Package includes `dist`, `README.md`, `README_EN.md`, `LICENSE`, and `package.json`.
Package does not include `tests/`, `docs/agent-memory/`, `.claude/`, `.codex/`, or `.env`.
```

If package contents unexpectedly include test or memory files, stop and report the exact `npm pack --dry-run` output.

- [ ] **Step 3: Inspect diff scope**

Run:

```bash
rg -n "_requestHandlers|server as any" tests
git diff -- tests/helpers/mcp.ts tests/mcp-server-smoke.test.ts tests/server-tools.test.ts tests/server-credential-tools.test.ts tests/server-error-next-steps.test.ts tests/server-handler-sanitization.test.ts docs/agent-memory/verification-log.md
git status --short
```

Expected:

```text
`_requestHandlers` appears only in `tests/helpers/mcp.ts`.
No `server as any` remains in tests.
Diff is limited to Task 6 test files and verification-log append.
Existing unrelated dirty files remain unstaged and untouched.
```

- [ ] **Step 4: Record Task 6 verification**

If Steps 1-3 pass, append this entry to `docs/agent-memory/verification-log.md`:

```markdown
## 2026-06-15 Task 6 MCP Integration Test Hardening

- Commands: `npm run build`; `npm test -- tests/server-tools.test.ts tests/server-credential-tools.test.ts tests/server-error-next-steps.test.ts tests/server-handler-sanitization.test.ts tests/mcp-server-smoke.test.ts`; `npm test`; `npm pack --dry-run`; MCP test helper scan with `rg`.
- Result: MCP server tests now share a single registered-handler helper, stdio entrypoint smoke coverage verifies startup logging stays on stderr, public tool-list smoke coverage remains stable, and build/tests/package dry-run pass.
- Caveat: No production source, MCP public contract, credential loading, logging behavior, cache behavior, package metadata, release workflow, tag, push, publish, or GitHub release was changed.
```

Do not update `docs/agent-memory/decisions.md` or `docs/agent-memory/lessons-learned.md` unless implementation discovers a new durable decision or repeated pitfall.

---

## Acceptance Criteria

- `tests/helpers/mcp.ts` centralizes private MCP SDK `_requestHandlers` access.
- Existing server tests no longer use `(server as any)._requestHandlers` directly.
- `tests/mcp-server-smoke.test.ts` verifies the built stdio entrypoint logs startup to stderr and keeps stdout clean.
- `tests/mcp-server-smoke.test.ts` verifies the public tool list through the registered MCP handler.
- `npm run build` passes.
- Server-focused tests pass.
- `npm test` passes.
- `npm pack --dry-run` passes and package contents remain clean.
- No production `src/` runtime code is changed.
- No MCP public tool contract, credential, logging, cache, package metadata, workflow, or release behavior is changed.

## Rollback Point

If this task breaks tests, build, process shutdown reliability, or package dry-run, revert only Task 6 files:

```bash
git restore -- tests/server-tools.test.ts tests/server-credential-tools.test.ts tests/server-error-next-steps.test.ts tests/server-handler-sanitization.test.ts docs/agent-memory/verification-log.md
Remove-Item -LiteralPath tests/helpers/mcp.ts, tests/mcp-server-smoke.test.ts
```

Use the restore/remove commands only if those files contain no unrelated user changes. If unrelated user changes are present in any file, stop and report the conflicting paths instead of restoring.

## Commit Boundary

If the user asks for a local commit after successful verification, use the configured `git-local-commit` skill and stage only Task 6 files:

```bash
git add tests/helpers/mcp.ts tests/mcp-server-smoke.test.ts tests/server-tools.test.ts tests/server-credential-tools.test.ts tests/server-error-next-steps.test.ts tests/server-handler-sanitization.test.ts docs/agent-memory/verification-log.md
git commit -m "test: harden MCP server integration coverage"
```

If the user has not asked for a commit, stop after reporting changed files, verification commands, skipped checks, and remaining dirty worktree state.

## Self-Review

- Spec coverage: This plan covers shared MCP handler helper extraction, server test updates, stdio entrypoint smoke coverage, public tool-list smoke coverage, build/tests/pack verification, package content inspection, diff scope, and verification memory.
- Placeholder scan: The plan names exact files, commands, code blocks, expected outputs, and rollback paths.
- Scope control: The plan explicitly excludes production runtime changes, MCP contract changes, credential/logging/cache changes, package metadata changes, release actions, and commits without user approval.
