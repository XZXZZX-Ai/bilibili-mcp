# Bilibili Client Split Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split `src/bilibili/client.ts` into focused Bilibili API modules while preserving current MCP behavior and subtitle retrieval semantics.

**Architecture:** Add tests around subtitle fallback behavior, then extract HTTP, WBI, fingerprint, video API, and comments API responsibilities one at a time. Keep `src/bilibili/client.ts` as a compatibility export layer so current imports keep working.

**Tech Stack:** TypeScript, Node.js ESM, MCP SDK, Vitest, npm.

---

## Current Constraints

- Preserve Cookie-based subtitle access through `credentialManager`; never hard-code or print Cookie values.
- Preserve subtitle strategy: `/x/player/wbi/v2` first, `/x/player/v2` fallback when WBI returns an empty subtitle list.
- Preserve current MCP tool names, schemas, and JSON response shapes.
- Preserve public exports from `src/bilibili/client.ts`.
- Do not add new MCP tools in Phase 2.
- Do not recreate Smithery config.
- Do not do broad documentation or encoding cleanup.

## Target File Structure

- Create `src/bilibili/http.ts`: timeout, rate limiting, retry wrapper, `checkLoginStatus`, `fetchWithoutWBI`, and `fetchWithWBI`.
- Create `src/bilibili/wbi.ts`: WBI key fetching, mix key generation, MD5 signature generation, and WBI cache.
- Create `src/bilibili/fingerprint.ts`: buvid fingerprint fetching and cache.
- Create `src/bilibili/video-api.ts`: `getVideoInfo`, `getVideoSubtitle`, and `getSubtitleContent`.
- Create `src/bilibili/comments-api.ts`: `getVideoComments` and comments fallback.
- Modify `src/bilibili/client.ts`: re-export compatibility functions only.
- Create `tests/bilibili-video-api.test.ts`: API-level tests with mocked fetch.
- Optional create `tests/bilibili-client-exports.test.ts`: compatibility export smoke test if not folded into the API test.

---

### Task 1: Add Subtitle API Behavior Tests Before Extraction

**Recommended Claude Code subagent:** `test-baseline-builder`

**Files:**
- Create: `tests/bilibili-video-api.test.ts`
- Inspect: `src/bilibili/client.ts`
- Verify: `npm test -- tests/bilibili-video-api.test.ts`

- [x] **Step 1: Create mocked fetch helpers**

Create `tests/bilibili-video-api.test.ts` with this structure:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  getSubtitleContent,
  getVideoSubtitle,
} from "../src/bilibili/client.js";
import { credentialManager } from "../src/utils/credentials.js";

type FetchCall = {
  url: string;
  init?: RequestInit;
};

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function getFetchCalls(fetchMock: ReturnType<typeof vi.fn>): FetchCall[] {
  return fetchMock.mock.calls.map(([url, init]) => ({
    url: String(url),
    init: init as RequestInit | undefined,
  }));
}

beforeEach(() => {
  credentialManager.setCredentials({
    sessdata: "test-sessdata",
    bili_jct: "test-bili-jct",
    dedeuserid: "123456",
    expiresAt: Date.now() + 60_000,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  credentialManager.clearCredentials();
});
```

Do not use real Cookie values.

- [x] **Step 2: Add WBI-success test**

Add this test:

```ts
describe("getVideoSubtitle", () => {
  it("returns WBI subtitles without calling the non-WBI fallback", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes("/x/frontend/finger/spi")) {
        return jsonResponse({
          code: 0,
          data: { b_3: "buvid3-test", b_4: "buvid4-test" },
        });
      }

      if (url.includes("/x/web-interface/nav")) {
        return jsonResponse({
          code: 0,
          data: {
            wbi_img: {
              img_url: "https://i0.hdslb.com/bfs/wbi/abcdefghijklmnopqrstuvwxyz123456.png",
              sub_url: "https://i0.hdslb.com/bfs/wbi/123456abcdefghijklmnopqrstuvwxyz.png",
            },
          },
        });
      }

      if (url.includes("/x/player/wbi/v2")) {
        return jsonResponse({
          code: 0,
          data: {
            subtitle: {
              subtitles: [
                {
                  id: 1,
                  lan: "zh-Hans",
                  lan_doc: "中文",
                  subtitle_url: "//example.test/wbi.json",
                },
              ],
            },
          },
        });
      }

      throw new Error(`Unexpected fetch URL: ${url}`);
    });

    vi.stubGlobal("fetch", fetchMock);

    const result = await getVideoSubtitle("BV1T6PQzQErF", 123);

    expect(result.subtitle.subtitles).toHaveLength(1);
    expect(result.subtitle.subtitles[0].subtitle_url).toBe("//example.test/wbi.json");

    const calls = getFetchCalls(fetchMock);
    expect(calls.some((call) => call.url.includes("/x/player/wbi/v2"))).toBe(true);
    expect(calls.some((call) => call.url.includes("/x/player/v2"))).toBe(false);
  });
});
```

- [x] **Step 3: Add WBI-empty fallback test**

Add this test inside the same `describe`:

```ts
it("falls back to /x/player/v2 when WBI subtitles are empty", async () => {
  const fetchMock = vi.fn(async (url: string) => {
    if (url.includes("/x/frontend/finger/spi")) {
      return jsonResponse({
        code: 0,
        data: { b_3: "buvid3-test", b_4: "buvid4-test" },
      });
    }

    if (url.includes("/x/web-interface/nav")) {
      return jsonResponse({
        code: 0,
        data: {
          wbi_img: {
            img_url: "https://i0.hdslb.com/bfs/wbi/abcdefghijklmnopqrstuvwxyz123456.png",
            sub_url: "https://i0.hdslb.com/bfs/wbi/123456abcdefghijklmnopqrstuvwxyz.png",
          },
        },
      });
    }

    if (url.includes("/x/player/wbi/v2")) {
      return jsonResponse({
        code: 0,
        data: { subtitle: { subtitles: [] } },
      });
    }

    if (url.includes("/x/player/v2")) {
      return jsonResponse({
        code: 0,
        data: {
          subtitle: {
            subtitles: [
              {
                id: 2,
                lan: "ai-zh",
                lan_doc: "AI中文",
                subtitle_url: "//example.test/fallback.json",
              },
            ],
          },
        },
      });
    }

    throw new Error(`Unexpected fetch URL: ${url}`);
  });

  vi.stubGlobal("fetch", fetchMock);

  const result = await getVideoSubtitle("BV1T6PQzQErF", 123);

  expect(result.subtitle.subtitles).toHaveLength(1);
  expect(result.subtitle.subtitles[0].subtitle_url).toBe("//example.test/fallback.json");

  const calls = getFetchCalls(fetchMock);
  expect(calls.some((call) => call.url.includes("/x/player/wbi/v2"))).toBe(true);
  expect(calls.some((call) => call.url.includes("/x/player/v2"))).toBe(true);
});
```

- [x] **Step 4: Add subtitle URL normalization test**

Add this test:

```ts
describe("getSubtitleContent", () => {
  it("normalizes protocol-relative subtitle URLs", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url === "https://example.test/subtitle.json") {
        return jsonResponse({
          body: [
            { from: 0, to: 1, location: 2, content: "hello" },
          ],
        });
      }

      throw new Error(`Unexpected fetch URL: ${url}`);
    });

    vi.stubGlobal("fetch", fetchMock);

    const result = await getSubtitleContent("//example.test/subtitle.json");

    expect(result.body[0].content).toBe("hello");
    expect(getFetchCalls(fetchMock)[0].url).toBe("https://example.test/subtitle.json");
  });
});
```

- [x] **Step 5: Run focused test**

Run:

```bash
npm test -- tests/bilibili-video-api.test.ts
```

Expected: tests pass against the current implementation. If WBI cache causes cross-test coupling, clear module state with `vi.resetModules()` and import dynamically inside each test rather than weakening the assertions.

- [x] **Step 6: Run full test suite**

Run:

```bash
npm test
```

Expected: all tests pass.

- [x] **Step 7: Report**

Report files changed, commands run, command results, and whether any test had to be adjusted because of module-level caches.

---

### Task 2: Extract WBI Signing Into `wbi.ts`

**Recommended Claude Code subagent:** `build-error-resolver` if TypeScript/ESM errors appear.

**Files:**
- Create: `src/bilibili/wbi.ts`
- Modify: `src/bilibili/client.ts`
- Verify: `npm test`
- Verify: `npm run build`

- [x] **Step 1: Move WBI cache and helpers**

Create `src/bilibili/wbi.ts` with:

- `getMixKey(imgKey, subKey)`
- `getWBI()`
- `generateWBISign(params, mixKey)`
- private `md5Hash(str)`
- private WBI cache state

Keep behavior and error classes identical. Import `config`, `NetworkError`, `BilibiliAPIError`, `TimeoutError`, `logger`, `withRetry`, and `createHash` as needed.

- [x] **Step 2: Export only needed functions**

Export:

```ts
export async function getWBI(): Promise<{ imgKey: string; subKey: string; mixKey: string }>
export function generateWBISign(params: Record<string, string | number>, mixKey: string): string
```

Keep `getMixKey` unexported unless tests need a direct pure-function assertion. If exported for tests, treat it as internal and do not re-export from `client.ts`.

- [x] **Step 3: Update `client.ts` imports**

Remove WBI helper implementations from `client.ts` and import:

```ts
import { generateWBISign, getWBI } from "./wbi.js";
```

`fetchWithWBI()` should continue to call `getWBI()` and `generateWBISign()`.

- [x] **Step 4: Verify**

Run:

```bash
npm test
npm run build
```

Expected: all tests pass and TypeScript compiles.

---

### Task 3: Extract Buvid Fingerprint Into `fingerprint.ts`

**Files:**
- Create: `src/bilibili/fingerprint.ts`
- Modify: `src/bilibili/client.ts`
- Verify: `npm test`
- Verify: `npm run build`

- [x] **Step 1: Move buvid cache and fetcher**

Create `src/bilibili/fingerprint.ts` with:

```ts
export async function getBuvid(): Promise<{ buvid3: string; buvid4: string } | null>
```

Move the private `cachedBuvid` state with it. Keep the current 24-hour cache, timeout behavior, partial safe logging, and null-on-failure behavior.

- [x] **Step 2: Update `client.ts` imports**

Remove `getBuvid()` and `cachedBuvid` from `client.ts`, then import:

```ts
import { getBuvid } from "./fingerprint.js";
```

- [x] **Step 3: Verify**

Run:

```bash
npm test
npm run build
```

Expected: all tests pass and TypeScript compiles.

---

### Task 4: Extract HTTP Helpers Into `http.ts`

**Files:**
- Create: `src/bilibili/http.ts`
- Modify: `src/bilibili/client.ts`
- Verify: `npm test`
- Verify: `npm run build`

- [x] **Step 1: Move request helpers**

Create `src/bilibili/http.ts` and move:

- `checkLoginStatus()`
- `waitForRateLimit()`
- `throttledFetch()`
- `retryableFetch()`
- `fetchWithWBI()`
- `fetchWithoutWBI()`

Keep private helpers private. Export only:

```ts
export async function checkLoginStatus(): Promise<{ isLogin: boolean }>
export async function fetchWithWBI(...)
export async function fetchWithoutWBI(...)
```

- [x] **Step 2: Keep dependencies explicit**

`http.ts` should import:

```ts
import { config } from "../config.js";
import { BilibiliAPIError, CommentsDisabledError, NetworkError, PaidVideoError, TimeoutError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";
import { withRetry } from "../utils/retry.js";
import { credentialManager } from "../utils/credentials.js";
import { generateWBISign, getWBI } from "./wbi.js";
```

Do not import from `client.ts`.

- [x] **Step 3: Update `client.ts`**

Remove moved helpers and import:

```ts
import { checkLoginStatus, fetchWithWBI, fetchWithoutWBI } from "./http.js";
```

If `client.ts` still directly exports these functions during this task, re-export the imported functions:

```ts
export { checkLoginStatus, fetchWithWBI, fetchWithoutWBI } from "./http.js";
```

- [x] **Step 4: Verify**

Run:

```bash
npm test
npm run build
```

Expected: all tests pass and TypeScript compiles.

---

### Task 5: Extract Video API Into `video-api.ts`

**Files:**
- Create: `src/bilibili/video-api.ts`
- Modify: `src/bilibili/client.ts`
- Verify: `npm test`
- Verify: `npm run build`

- [x] **Step 1: Move video functions**

Create `src/bilibili/video-api.ts` and move:

- `getVideoInfo(bvid)`
- `getVideoSubtitle(bvid, cid)`
- `getSubtitleContent(url)`

Import:

```ts
import { config } from "../config.js";
import { credentialManager } from "../utils/credentials.js";
import { NetworkError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";
import { getBuvid } from "./fingerprint.js";
import { fetchWithWBI, fetchWithoutWBI } from "./http.js";
```

If `getSubtitleContent()` still needs retry/throttle helpers after Task 4 made them private, expose a small generic HTTP helper from `http.ts` rather than duplicating timeout/retry logic.

- [x] **Step 2: Preserve subtitle fallback behavior**

Keep this behavior exactly:

```ts
const wbiResult = await fetchWithWBI("/x/player/wbi/v2", { bvid, cid }, headersWithBuvid) as SubtitleResponse;

if (wbiResult?.subtitle?.subtitles && wbiResult.subtitle.subtitles.length > 0) {
  return wbiResult;
}

const fallbackResult = await fetchWithoutWBI("/x/player/v2", { bvid, cid }, headersWithBuvid) as SubtitleResponse;
return fallbackResult;
```

- [x] **Step 3: Update `client.ts` exports**

Re-export:

```ts
export { getSubtitleContent, getVideoInfo, getVideoSubtitle } from "./video-api.js";
```

- [x] **Step 4: Verify**

Run:

```bash
npm test
npm run build
```

Expected: all tests pass and TypeScript compiles.

---

### Task 6: Extract Comments API Into `comments-api.ts`

**Files:**
- Create: `src/bilibili/comments-api.ts`
- Modify: `src/bilibili/client.ts`
- Verify: `npm test`
- Verify: `npm run build`

- [x] **Step 1: Move comment function**

Create `src/bilibili/comments-api.ts` and move:

- `getVideoComments(videoUrlOrBvid, page, pageSize, sort, includeReplies)`

Import:

```ts
import { credentialManager } from "../utils/credentials.js";
import { getBuvid } from "./fingerprint.js";
import { fetchWithWBI, fetchWithoutWBI } from "./http.js";
import { getVideoInfo } from "./video-api.js";
```

- [x] **Step 2: Preserve comments fallback**

Keep current behavior:

- WBI comments API first: `/x/v2/reply/wbi/main`
- if WBI returns empty replies, fallback to `/x/v2/reply/main`
- if WBI throws, fallback to `/x/v2/reply/main`
- append buvid cookies to fallback request when available

- [x] **Step 3: Update `client.ts` exports**

Re-export:

```ts
export { getVideoComments } from "./comments-api.js";
```

- [x] **Step 4: Verify**

Run:

```bash
npm test
npm run build
```

Expected: all tests pass and TypeScript compiles.

---

### Task 7: Convert `client.ts` To Compatibility Exports

**Recommended Claude Code subagent:** `risk-reviewer`

**Files:**
- Modify: `src/bilibili/client.ts`
- Inspect: `src/bilibili/subtitle.ts`
- Inspect: `src/bilibili/comments.ts`
- Verify: `npm test`
- Verify: `npm run build`

- [x] **Step 1: Reduce `client.ts`**

After previous tasks, `src/bilibili/client.ts` should contain only:

```ts
export { checkLoginStatus, fetchWithWBI, fetchWithoutWBI } from "./http.js";
export { getSubtitleContent, getVideoInfo, getVideoSubtitle } from "./video-api.js";
export { getVideoComments } from "./comments-api.js";
```

If comments or subtitle modules are updated to import direct modules, still keep these re-exports for compatibility.

- [x] **Step 2: Verify public import compatibility**

Confirm these imports still work without changes:

```ts
import { getVideoInfo, getVideoSubtitle, getSubtitleContent, checkLoginStatus } from "./client.js";
import { getVideoInfo, getVideoComments } from "./client.js";
```

- [x] **Step 3: Verify**

Run:

```bash
npm test
npm run build
```

Expected: all tests pass and TypeScript compiles.

---

### Task 8: Final Phase 2 Verification

**Recommended Claude Code subagent:** `release-verifier`

**Files:**
- Inspect: changed files only
- Verify: `git status --short`
- Verify: `npm test`
- Verify: `npm run build`
- Verify: `npm pack --dry-run`

- [x] **Step 1: Check worktree scope**

Run:

```bash
git status --short
```

Expected: only Phase 2 files plus pre-existing unrelated agent/hook files are changed. Do not stage or modify unrelated files.

- [x] **Step 2: Run tests**

Run:

```bash
npm test
```

Expected: all tests pass, including the new subtitle API tests.

- [x] **Step 3: Run build**

Run:

```bash
npm run build
```

Expected: TypeScript compilation passes.

- [x] **Step 4: Run package dry-run**

Run:

```bash
npm pack --dry-run
```

Expected: package still includes built `dist` files and excludes tests/debug/Smithery artifacts.

- [x] **Step 5: Inspect compatibility exports**

Run:

```bash
node -e "import('./dist/bilibili/client.js').then(m=>console.log(['checkLoginStatus','fetchWithWBI','fetchWithoutWBI','getVideoInfo','getVideoSubtitle','getSubtitleContent','getVideoComments'].every(k=>typeof m[k]==='function')))"
```

Expected output:

```text
true
```

- [x] **Step 6: Report**

Report:

- files changed
- commands run and results
- whether subtitle fallback tests pass
- whether `client.ts` is compatibility-only
- whether MCP tool schemas or response shapes were changed
- unresolved risks or skipped checks

---

## Acceptance Criteria

- `src/bilibili/client.ts` is a compatibility re-export layer.
- `src/bilibili/http.ts`, `wbi.ts`, `fingerprint.ts`, `video-api.ts`, and `comments-api.ts` exist and have focused responsibilities.
- Current public imports from `./client.js` keep working.
- Subtitle fallback behavior is covered by Vitest tests.
- `npm test` passes.
- `npm run build` passes.
- `npm pack --dry-run` passes.
- No MCP tool names, input schemas, or response shapes change.
- No Cookie values are hard-coded or printed.

## Rollback Points

- After Task 1, tests can be committed independently as a behavior baseline.
- After Tasks 2-4, WBI/fingerprint/http extraction can be reverted without changing MCP behavior.
- After Tasks 5-7, compatibility exports allow consumers to keep using `client.ts`.
- If a split creates unclear circular imports, stop and report the dependency cycle instead of patching around it with dynamic imports.

## Self-Review

- Spec coverage: covers all Phase 2 roadmap targets and preserves subtitle/Cookie/MCP behavior.
- Placeholder scan: no task relies on TBD or unbounded "add tests" language.
- Type consistency: function names match the current `client.ts` exports.
- Scope check: this plan does not include Phase 3 tool expansion or broad documentation cleanup.
