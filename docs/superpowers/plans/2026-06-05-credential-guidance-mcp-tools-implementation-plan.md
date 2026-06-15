# Credential Guidance MCP Tools Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make agent-installed `bilibili-mcp` instances guide users to configure Bilibili Cookie credentials at runtime, not only through README text.

**Architecture:** Add a small credential guidance helper that centralizes safe setup instructions, credential status, and error `next_steps`. Register two additive MCP tools in `src/server.ts`: `get_credential_setup_instructions` and `check_bilibili_credentials`. Update existing tool descriptions and `COOKIE_EXPIRED` / `SUBTITLE_UNAVAILABLE` error responses to include actionable credential setup guidance without exposing Cookie values.

**Tech Stack:** TypeScript ESM, MCP SDK server request handlers, Vitest unit tests, existing `credentialManager`, existing `checkLoginStatus()`.

**Claude Code Goal Prompts:** `docs/superpowers/plans/2026-06-05-credential-guidance-claude-goal-prompts.md`

---

## Update Goal

Other AI agents often install MCP servers by copying a client config snippet and then stop. This change makes the MCP server itself expose credential setup instructions and credential-status checks so those agents can discover and present the Cookie setup flow after installation.

## Current Judgment

- Existing README now has strong agent-facing guidance, but agents may ignore README after copying JSON.
- Existing runtime errors return `COOKIE_EXPIRED` and `SUBTITLE_UNAVAILABLE`, but they do not consistently include `next_steps`.
- Existing MCP tool list exposes four content tools only. It does not expose an obvious "how do I configure credentials?" tool.
- Existing `credentialManager` can load credentials but does not expose credential source safely.
- Do not print or return Cookie values, `SESSDATA`, `bili_jct`, or full `DedeUserID`.

## Recommended Approach

1. Add a pure helper module for credential setup text, status, and error payloads.
2. Add tests for that helper before modifying server behavior.
3. Register two new MCP tools:
   - `get_credential_setup_instructions`
   - `check_bilibili_credentials`
4. Update relevant existing tool descriptions to point agents to `get_credential_setup_instructions`.
5. Update runtime error responses to include `next_steps` for `COOKIE_EXPIRED` and `SUBTITLE_UNAVAILABLE`.
6. Update README tool list / credential guidance after tests pass.

## Things To Avoid

- Do not put real Cookie values in tests, docs, logs, or returned JSON.
- Do not ask users to paste Cookie values into MCP client config.
- Do not remove Cookie-based subtitle access.
- Do not rename or break existing MCP tools.
- Do not change package entry points or release workflow.
- Do not hard-code Claude Code, DeepSeek, or any model choice into repository files.
- Do not touch generated `dist/` unless the user explicitly asks for release artifacts.
- Do not touch unrelated dirty files such as `docs/agent-memory/pending-learning-proposals.md` or `.codex/scripts/__pycache__/`.

## Files And Responsibilities

- Modify `src/utils/credentials.ts`
  - Add a safe source-aware status method or source helper.
  - Return source as `env`, `global_config`, or `none`.
  - Never expose raw credential values.

- Create `src/utils/credential-guidance.ts`
  - Centralize setup instructions and next steps.
  - Build safe `get_credential_setup_instructions` tool response.
  - Build safe `check_bilibili_credentials` tool response.
  - Build reusable `next_steps` for error payloads.

- Modify `src/server.ts`
  - Add two new MCP tools to `tools/list`.
  - Add two `CallToolRequestSchema` switch cases.
  - Add `next_steps` to `COOKIE_EXPIRED` and `SUBTITLE_UNAVAILABLE` responses.
  - Update content tool descriptions to mention Cookie dependency and the credential setup tool.

- Modify `tests/server-tools.test.ts`
  - Update expected tool count and assert the new tool schemas.
  - Assert content tool descriptions mention credential setup.

- Create `tests/credential-guidance.test.ts`
  - Test setup instruction shape.
  - Test status without credentials.
  - Test source detection for env/global config via isolated temp home or direct helper setup.
  - Test no secret-like values appear in responses.

- Optionally create `tests/server-credential-tools.test.ts`
  - Invoke private MCP call handler for the two new tools.
  - Verify JSON payloads are parseable, safe, and actionable.

- Modify `README.md` and `README_EN.md`
  - Add the two credential helper tools to the tool surface / usage guidance.
  - Mention agents should call `get_credential_setup_instructions` after installation.

---

### Task 1: Add Credential Guidance Helper Tests

**Files:**
- Create: `tests/credential-guidance.test.ts`
- Read/Use: `src/utils/credentials.ts`
- Read/Use: future `src/utils/credential-guidance.ts`

- [x] **Step 1: Write failing helper tests**

Create `tests/credential-guidance.test.ts`:

```ts
import { afterEach, describe, expect, it } from "vitest";

import {
  buildCredentialSetupInstructions,
  buildCredentialNextSteps,
  hasSecretLikeValue,
} from "../src/utils/credential-guidance.js";
import { credentialManager } from "../src/utils/credentials.js";

describe("credential guidance", () => {
  afterEach(() => {
    credentialManager.clearCredentials();
    delete process.env.BILIBILI_SESSDATA;
    delete process.env.BILIBILI_BILI_JCT;
    delete process.env.BILIBILI_DEDEUSERID;
  });

  it("returns actionable setup commands for agent installers", () => {
    const result = buildCredentialSetupInstructions();

    expect(result.title).toBe("Bilibili credential setup");
    expect(result.recommended_commands).toContain(
      "npx -y @xzxzzx/bilibili-mcp config",
    );
    expect(result.recommended_commands).toContain(
      "npx -y @xzxzzx/bilibili-mcp check",
    );
    expect(result.required_cookie_fields).toEqual([
      "SESSDATA",
      "bili_jct",
      "DedeUserID",
    ]);
    expect(result.security_notes.join(" ")).toContain(
      "Do not paste Cookie values into MCP client config",
    );
  });

  it("returns reusable next steps for credential errors", () => {
    expect(buildCredentialNextSteps()).toEqual([
      "Run: npx -y @xzxzzx/bilibili-mcp config",
      "Then run: npx -y @xzxzzx/bilibili-mcp check",
      "Do not paste Cookie values into MCP client config files.",
    ]);
  });

  it("does not include secret-looking Cookie values", () => {
    const result = JSON.stringify(buildCredentialSetupInstructions());

    expect(hasSecretLikeValue(result)).toBe(false);
    expect(result).not.toContain("your_sessdata");
    expect(result).not.toContain("bili_jct=");
    expect(result).not.toContain("SESSDATA=");
  });
});
```

- [x] **Step 2: Run helper tests to verify they fail**

Run:

```bash
npm test -- tests/credential-guidance.test.ts
```

Expected: FAIL because `src/utils/credential-guidance.ts` does not exist.

### Task 2: Implement Credential Guidance Helper

**Files:**
- Create: `src/utils/credential-guidance.ts`

- [x] **Step 1: Add helper implementation**

Create `src/utils/credential-guidance.ts`:

```ts
export type CredentialSource = "env" | "global_config" | "none";

export interface CredentialSetupInstructions {
  title: "Bilibili credential setup";
  summary: string;
  recommended_commands: string[];
  global_install_commands: string[];
  required_cookie_fields: ["SESSDATA", "bili_jct", "DedeUserID"];
  security_notes: string[];
}

export function buildCredentialSetupInstructions(): CredentialSetupInstructions {
  return {
    title: "Bilibili credential setup",
    summary:
      "For reliable Bilibili subtitles, transcripts, and comments, configure Cookies outside the MCP client config.",
    recommended_commands: [
      "npx -y @xzxzzx/bilibili-mcp config",
      "npx -y @xzxzzx/bilibili-mcp check",
    ],
    global_install_commands: [
      "bilibili-mcp config",
      "bilibili-mcp check",
    ],
    required_cookie_fields: ["SESSDATA", "bili_jct", "DedeUserID"],
    security_notes: [
      "Do not paste Cookie values into MCP client config files.",
      "Do not share Cookie values in chats, issues, PRs, logs, or tests.",
      "Use the CLI helper, environment variables, or local deployment secrets.",
    ],
  };
}

export function buildCredentialNextSteps(): string[] {
  return [
    "Run: npx -y @xzxzzx/bilibili-mcp config",
    "Then run: npx -y @xzxzzx/bilibili-mcp check",
    "Do not paste Cookie values into MCP client config files.",
  ];
}

export function hasSecretLikeValue(value: string): boolean {
  return /SESSDATA=|bili_jct=|DedeUserID=|BILIBILI_SESSDATA=|BILIBILI_BILI_JCT=|BILIBILI_DEDEUSERID=/i.test(
    value,
  );
}
```

- [x] **Step 2: Run helper tests**

Run:

```bash
npm test -- tests/credential-guidance.test.ts
```

Expected: PASS.

### Task 3: Add Safe Credential Source Detection

**Files:**
- Modify: `src/utils/credentials.ts`
- Modify: `src/utils/credential-guidance.ts`
- Modify: `tests/credential-guidance.test.ts`

- [x] **Step 1: Write failing source/status tests**

Append to `tests/credential-guidance.test.ts`:

```ts
import { buildCredentialStatus } from "../src/utils/credential-guidance.js";

describe("credential status", () => {
  afterEach(() => {
    credentialManager.clearCredentials();
    delete process.env.BILIBILI_SESSDATA;
    delete process.env.BILIBILI_BILI_JCT;
    delete process.env.BILIBILI_DEDEUSERID;
  });

  it("reports none when no credentials are configured", async () => {
    const result = await buildCredentialStatus(async () => ({ isLogin: false }));

    expect(result.configured).toBe(false);
    expect(result.source).toBe("none");
    expect(result.logged_in).toBe(false);
    expect(result.next_steps).toContain(
      "Run: npx -y @xzxzzx/bilibili-mcp config",
    );
  });

  it("reports env without exposing Cookie values", async () => {
    process.env.BILIBILI_SESSDATA = "secret-sessdata";
    process.env.BILIBILI_BILI_JCT = "secret-jct";
    process.env.BILIBILI_DEDEUSERID = "123456789";

    const result = await buildCredentialStatus(async () => ({ isLogin: true }));
    const serialized = JSON.stringify(result);

    expect(result.configured).toBe(true);
    expect(result.source).toBe("env");
    expect(result.logged_in).toBe(true);
    expect(serialized).not.toContain("secret-sessdata");
    expect(serialized).not.toContain("secret-jct");
    expect(serialized).not.toContain("123456789");
  });
});
```

- [x] **Step 2: Run source/status tests to verify they fail**

Run:

```bash
npm test -- tests/credential-guidance.test.ts
```

Expected: FAIL because `buildCredentialStatus` and source detection are not implemented.

- [x] **Step 3: Add source detection to `CredentialManager`**

Modify `src/utils/credentials.ts` minimally. Add the type and method near the class:

```ts
export type CredentialSource = "env" | "global_config" | "none";
```

Inside `CredentialManager`, add:

```ts
  getCredentialSource(): CredentialSource {
    if (
      process.env.BILIBILI_SESSDATA &&
      process.env.BILIBILI_BILI_JCT &&
      process.env.BILIBILI_DEDEUSERID
    ) {
      return "env";
    }

    if (fs.existsSync(GLOBAL_CONFIG_FILE)) {
      try {
        const raw = fs.readFileSync(GLOBAL_CONFIG_FILE, "utf-8");
        const parsed = JSON.parse(raw) as Partial<BilibiliCredentials>;
        if (parsed.sessdata && parsed.bili_jct && parsed.dedeuserid) {
          return "global_config";
        }
      } catch {
        return "none";
      }
    }

    return "none";
  }
```

- [x] **Step 4: Add status builder**

Extend `src/utils/credential-guidance.ts`:

```ts
import { credentialManager, type CredentialSource } from "./credentials.js";

export interface CredentialStatus {
  configured: boolean;
  source: CredentialSource;
  logged_in: boolean;
  next_steps: string[];
  security_notes: string[];
}

export async function buildCredentialStatus(
  checkLoginStatus: () => Promise<{ isLogin: boolean }>,
): Promise<CredentialStatus> {
  const source = credentialManager.getCredentialSource();
  const configured = source !== "none";
  const logged_in = configured
    ? (await checkLoginStatus()).isLogin
    : false;

  return {
    configured,
    source,
    logged_in,
    next_steps: configured && logged_in ? [] : buildCredentialNextSteps(),
    security_notes: [
      "This response never includes raw Cookie values.",
      "Configure credentials outside MCP client config files.",
    ],
  };
}
```

If the import conflicts with the local `CredentialSource` type from Task 2, remove the local type in `credential-guidance.ts` and import it from `credentials.ts`.

- [x] **Step 5: Run helper/status tests**

Run:

```bash
npm test -- tests/credential-guidance.test.ts
```

Expected: PASS.

### Task 4: Register New MCP Tools And Tool Descriptions

**Files:**
- Modify: `src/server.ts`
- Modify: `tests/server-tools.test.ts`

- [x] **Step 1: Write failing tool-list tests**

Modify `tests/server-tools.test.ts`:

```ts
  it("exposes all 6 tools", () => {
    const names = toolsResult.tools.map((t) => t.name);
    expect(names).toContain("get_video_info");
    expect(names).toContain("get_video_comments");
    expect(names).toContain("get_video_transcript");
    expect(names).toContain("get_video_metadata");
    expect(names).toContain("get_credential_setup_instructions");
    expect(names).toContain("check_bilibili_credentials");
  });
```

Add near the end of the same file:

```ts
  describe("credential helper tools", () => {
    it("registers get_credential_setup_instructions with no required input", () => {
      const schema = toolsResult.tools.find(
        (t) => t.name === "get_credential_setup_instructions",
      )!;

      expect(schema).toBeDefined();
      expect(schema.inputSchema.required ?? []).toEqual([]);
    });

    it("registers check_bilibili_credentials with no required input", () => {
      const schema = toolsResult.tools.find(
        (t) => t.name === "check_bilibili_credentials",
      )!;

      expect(schema).toBeDefined();
      expect(schema.inputSchema.required ?? []).toEqual([]);
    });

    it("points transcript users to credential setup instructions", () => {
      const schema = toolsResult.tools.find(
        (t) => t.name === "get_video_transcript",
      ) as { description?: string };

      expect(schema.description).toContain(
        "get_credential_setup_instructions",
      );
    });
  });
```

- [x] **Step 2: Run tool-list tests to verify they fail**

Run:

```bash
npm test -- tests/server-tools.test.ts
```

Expected: FAIL because the two new tools are not registered yet.

- [x] **Step 3: Register the tools in `src/server.ts`**

Add imports:

```ts
import {
  buildCredentialSetupInstructions,
  buildCredentialStatus,
} from "./utils/credential-guidance.js";
import { checkLoginStatus } from "./bilibili/client.js";
```

Add two entries to `tools` before content tools or after metadata:

```ts
      {
        name: "get_credential_setup_instructions",
        description:
          "Return safe Bilibili Cookie setup instructions for users or installing agents. Call this after installing the MCP server if credentials are not configured. Never returns Cookie values.",
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
        },
      },
      {
        name: "check_bilibili_credentials",
        description:
          "Check whether Bilibili credentials are configured and logged in without exposing Cookie values. If missing or invalid, returns next_steps for setup.",
        inputSchema: {
          type: "object",
          properties: {},
          required: [],
        },
      },
```

Update the `get_video_transcript` description to include this exact substring:

```text
Requires Bilibili Cookie for reliable subtitle access. If unavailable, call get_credential_setup_instructions.
```

Also update `get_video_info` and `get_video_comments` descriptions with a shorter version:

```text
For credential help, call get_credential_setup_instructions.
```

- [x] **Step 4: Add `CallToolRequestSchema` cases**

In `src/server.ts`, add switch cases before `get_video_info`:

```ts
      case "get_credential_setup_instructions": {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                buildCredentialSetupInstructions(),
                null,
                2,
              ),
            },
          ],
        };
      }

      case "check_bilibili_credentials": {
        const result = await buildCredentialStatus(checkLoginStatus);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
```

- [x] **Step 5: Run tool-list tests**

Run:

```bash
npm test -- tests/server-tools.test.ts
```

Expected: PASS.

### Task 5: Test And Implement MCP Tool Call Payloads

**Files:**
- Create: `tests/server-credential-tools.test.ts`
- Modify if needed: `src/server.ts`

- [x] **Step 1: Write MCP call handler tests**

Create `tests/server-credential-tools.test.ts`:

```ts
import { afterEach, describe, expect, it } from "vitest";

import { server } from "../src/server.js";
import { credentialManager } from "../src/utils/credentials.js";

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

async function callTool(name: string) {
  const handler = getCallToolHandler();
  return handler({
    method: "tools/call",
    jsonrpc: "2.0",
    id: 1,
    params: { name, arguments: {} },
  });
}

describe("credential MCP tools", () => {
  afterEach(() => {
    credentialManager.clearCredentials();
    delete process.env.BILIBILI_SESSDATA;
    delete process.env.BILIBILI_BILI_JCT;
    delete process.env.BILIBILI_DEDEUSERID;
  });

  it("returns setup instructions as JSON text", async () => {
    const response = await callTool("get_credential_setup_instructions");
    const payload = JSON.parse(response.content[0].text);

    expect(response.isError).toBeUndefined();
    expect(payload.recommended_commands).toContain(
      "npx -y @xzxzzx/bilibili-mcp config",
    );
    expect(JSON.stringify(payload)).not.toContain("SESSDATA=");
  });

  it("returns safe credential status when credentials are missing", async () => {
    const response = await callTool("check_bilibili_credentials");
    const payload = JSON.parse(response.content[0].text);

    expect(response.isError).toBeUndefined();
    expect(payload.configured).toBe(false);
    expect(payload.source).toBe("none");
    expect(payload.logged_in).toBe(false);
    expect(payload.next_steps).toContain(
      "Run: npx -y @xzxzzx/bilibili-mcp config",
    );
  });
});
```

- [x] **Step 2: Run MCP credential tool tests**

Run:

```bash
npm test -- tests/server-credential-tools.test.ts
```

Expected: PASS if Task 4 implementation is complete. If it fails because `check_bilibili_credentials` performs live network calls even when no credentials exist, ensure `buildCredentialStatus()` only calls `checkLoginStatus` when `source !== "none"`.

### Task 6: Add `next_steps` To Existing Error Responses

**Files:**
- Modify: `src/server.ts`
- Modify: `tests/server-credential-tools.test.ts` or create focused server error tests

- [x] **Step 1: Write failing payload tests for next_steps**

Append to `tests/server-credential-tools.test.ts`:

```ts
describe("credential next_steps in error payloads", () => {
  it("credential setup instructions include the exact next_steps used by errors", async () => {
    const response = await callTool("get_credential_setup_instructions");
    const payload = JSON.parse(response.content[0].text);

    expect(payload.recommended_commands).toEqual([
      "npx -y @xzxzzx/bilibili-mcp config",
      "npx -y @xzxzzx/bilibili-mcp check",
    ]);
  });
});
```

If Claude Code can safely mock `getVideoTranscriptData` without module cache issues, add a direct `get_video_transcript` error test that expects `next_steps` in the returned JSON. If mocking is brittle, cover this through helper tests plus code review.

- [x] **Step 2: Add `next_steps` in `src/server.ts`**

Import:

```ts
import { buildCredentialNextSteps } from "./utils/credential-guidance.js";
```

In the `NoSubtitleError` response payload, add:

```ts
                  next_steps: [
                    "If you expected subtitles, configure Bilibili Cookies.",
                    ...buildCredentialNextSteps(),
                    "Or retry get_video_transcript with fallback_to_description: true if description fallback is acceptable.",
                  ],
```

In the `COOKIE_EXPIRED` response payload, add:

```ts
                  next_steps: buildCredentialNextSteps(),
```

In the generic catch block, if the error is `BilibiliAPIError` with `code === "COOKIE_EXPIRED"`, include:

```ts
              code: error.code,
              next_steps: buildCredentialNextSteps(),
```

Keep other errors unchanged unless necessary.

- [x] **Step 3: Update Bilibili API error messages that mention only `.env`**

In `src/bilibili/subtitle.ts`, replace the `.env`-only message with:

```ts
`Video ${bvid} returned an empty subtitle list and current Bilibili credentials are not logged in. Run "npx -y @xzxzzx/bilibili-mcp config", then "npx -y @xzxzzx/bilibili-mcp check", or update environment variables.`
```

In `src/bilibili/http.ts`, replace both `COOKIE_EXPIRED` messages with:

```ts
"Current Bilibili credentials are expired or not logged in. Run \"npx -y @xzxzzx/bilibili-mcp config\", then \"npx -y @xzxzzx/bilibili-mcp check\", or update environment variables."
```

Use ASCII text to avoid adding mojibake.

- [x] **Step 4: Run focused tests**

Run:

```bash
npm test -- tests/server-credential-tools.test.ts tests/bilibili-transcript.test.ts tests/bilibili-video-api.test.ts
```

Expected: PASS.

### Task 7: Update Documentation For Runtime Credential Tools

**Files:**
- Modify: `README.md`
- Modify: `README_EN.md`

- [x] **Step 1: Add the new tools to tool surface docs**

In both README files, update the MCP tool list / feature section to mention:

- `get_credential_setup_instructions`
- `check_bilibili_credentials`

The wording should be concise:

```markdown
### Credential helper tools

- `get_credential_setup_instructions`: returns safe setup commands for Bilibili Cookie configuration. Useful for AI agents installing this MCP.
- `check_bilibili_credentials`: checks whether credentials are configured and logged in without returning Cookie values.
```

- [x] **Step 2: Update agent installer note**

In the existing `Client Setup` important note, add:

```markdown
After connecting the MCP server, agents can also call `get_credential_setup_instructions` or `check_bilibili_credentials` to guide the user.
```

Use equivalent clean Chinese in `README.md`.

- [x] **Step 3: Run docs scan**

Run:

```bash
rg -n "get_credential_setup_instructions|check_bilibili_credentials|SESSDATA=|bili_jct=|DedeUserID=" README.md README_EN.md
```

Expected: new tool names are present; secret-like patterns only appear in safe variable-name context, not with real values.

### Task 8: Final Verification

**Files:**
- All touched files

- [x] **Step 1: Run full test suite**

Run:

```bash
npm test
```

Expected: PASS. Current expected baseline before this change was 8 test files / 110 tests; after this change the count should increase.

- [x] **Step 2: Run build**

Run:

```bash
npm run build
```

Expected: PASS.

- [x] **Step 3: Run package dry run**

Run:

```bash
npm pack --dry-run
```

Expected: PASS. Confirm `dist/`, `README.md`, `README_EN.md`, `LICENSE`, and `package.json` are included; tests, `.env`, `.claude/`, `.codex/`, and `docs/agent-memory/` are excluded.

- [x] **Step 4: Secret and stale-client scan**

Run:

```bash
rg -n "SESSDATA=|bili_jct=|DedeUserID=|npm_[A-Za-z0-9]|ghp_[A-Za-z0-9]|Coze|Langcli|MiniMax|Mavis|Kimi Work" README.md README_EN.md src tests
```

Expected: no real secrets. Removed unsupported client names should not reappear in README. Variable names may appear only in safe explanatory text, not with real values.

- [x] **Step 5: Report changed files and unresolved risks**

Claude Code should report:

- Files changed.
- Commands run.
- Test/build/package results.
- Whether any live Bilibili network check was skipped or mocked.
- Confirmation that no Cookie values were returned, logged, or documented.

## Acceptance Criteria

- `tools/list` exposes six MCP tools:
  - `get_video_info`
  - `get_video_comments`
  - `get_video_transcript`
  - `get_video_metadata`
  - `get_credential_setup_instructions`
  - `check_bilibili_credentials`
- `get_credential_setup_instructions` returns setup commands and security notes with no Cookie values.
- `check_bilibili_credentials` returns `configured`, `source`, `logged_in`, `next_steps`, and security notes with no Cookie values.
- Existing content tools keep their names and required inputs.
- `COOKIE_EXPIRED` responses include `next_steps`.
- `SUBTITLE_UNAVAILABLE` responses include actionable next steps, including optional `fallback_to_description`.
- Tool descriptions make credential dependency discoverable by installing agents.
- README and README_EN mention the new credential helper tools.
- `npm test`, `npm run build`, and `npm pack --dry-run` pass.
- No unsupported clients removed earlier (`Coze`, `Langcli`, `MiniMax`, `Mavis`, `Kimi Work`) are reintroduced to README.

## Risks

- `check_bilibili_credentials` may perform a live Bilibili login-status request when credentials exist. Keep tests mocked or use no-credential status tests to avoid network dependence.
- Adding MCP tools is additive but changes the tool list count. Existing tests must update from 4 to 6 tools.
- Returning credential source must not reveal paths or identifiers unless intentionally safe.
- Some existing files contain mojibake. New text should be clean UTF-8 / ASCII and avoid copying corrupted text.
- Existing working tree has unrelated README edits and memory/runtime artifacts. Claude Code must not revert them.

## Claude Code Execution Steps

Use Claude Code for implementation. Do not assume or write any concrete model choice into repository files.

Recommended Claude Code subagent:

- `test-baseline-builder` for the TDD implementation and test additions.
- `build-error-resolver` only if TypeScript or Vitest fails.
- `risk-reviewer` after implementation for credential leak and MCP compatibility review.

Execution order:

1. Read this plan.
2. Check `git status --short`.
3. Use Superpowers `executing-plans` or `subagent-driven-development`.
4. Implement Task 1 through Task 8 in order.
5. Stop and report if a product decision is required.

## Self-Review

- Spec coverage: The plan covers the two new MCP tools, actionable error `next_steps`, tool descriptions, tests, docs, and safety constraints.
- Placeholder scan: No TODO/TBD placeholders are present; code snippets and commands are concrete.
- Type consistency: `CredentialSource`, `CredentialSetupInstructions`, and `CredentialStatus` are defined before use. Tool names are consistent across tests, server, README, and acceptance criteria.
