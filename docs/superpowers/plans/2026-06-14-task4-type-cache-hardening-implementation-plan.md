# Task 4 Type And Cache Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tighten cache and Bilibili API wrapper typing while preserving current cache keys, public response shapes, subtitle fallback behavior, and comment behavior.

**Architecture:** Add focused Vitest coverage for cache key generation and cache hit behavior first, then replace `any` in `src/utils/cache.ts` with generics and reduce selected `any` casts in `src/bilibili/subtitle.ts` / `src/bilibili/comments-api.ts` by reusing interfaces from `src/bilibili/types.ts`. Keep this as a behavior-preserving hardening task; source encoding cleanup remains Task 5.

**Tech Stack:** TypeScript ESM, Node16 module resolution, QuickLRU, Vitest, existing Bilibili API wrappers.

---

## Scope

Task 4 is only about type and cache hardening.

Expected direct edits:

- `src/utils/cache.ts`: replace cache `any` with generic value types and `unknown[]` key parts while preserving runtime behavior.
- `src/bilibili/types.ts`: add missing API response interfaces used by wrappers.
- `src/bilibili/subtitle.ts`: replace selected local `any` casts with typed API response interfaces.
- `src/bilibili/comments-api.ts`: replace the WBI comments API `as any` cast with the existing `CommentsResponse` type.
- `tests/cache.test.ts`: add stable cache key and stats behavior tests.
- `tests/bilibili-transcript.test.ts`: keep subtitle wrapper behavior passing.
- `tests/bilibili-comments-tool.test.ts`: keep comment cache behavior passing.
- `tests/bilibili-metadata.test.ts`: keep metadata mapping passing.
- `docs/agent-memory/verification-log.md`: append verification after successful completion.

Out of scope:

- Do not clean mojibake comments or Chinese strings; that is Task 5.
- Do not change MCP tool names, order, schemas, or response JSON shapes.
- Do not change credential loading, logging behavior, README, package metadata, GitHub workflow, release tags, or package contents.
- Do not change cache key string format.
- Do not make object cache key generation sorted or canonical in this task.
- Do not commit unless the user explicitly asks.

## Capability Use

- Use `vitest` for new and existing focused tests.
- Claude Code may use `test-baseline-builder` if it wants a bounded test-writing pass.
- Use `build-error-resolver` only if TypeScript or ESM import errors appear.
- Use local CLI commands for authoritative facts: `rg`, `npm test`, `npm run build`, `git diff`.

---

### Task 1: Add Cache Behavior Baseline Tests

**Files:**

- Create or modify: `tests/cache.test.ts`
- Inspect: `src/utils/cache.ts`

- [x] **Step 1: Add cache key and stats tests**

Create `tests/cache.test.ts` if it does not exist. If it exists, append this `describe` block without deleting existing tests:

```ts
import { describe, expect, it } from "vitest";
import { CacheManager } from "../src/utils/cache.js";

describe("CacheManager", () => {
  it("keeps primitive key generation stable", () => {
    const cache = new CacheManager();

    expect(
      cache.generateKey("comments", "BV1T6PQzQErF", "limit-5", "1", "true"),
    ).toBe("comments:BV1T6PQzQErF:limit-5:1:true");
  });

  it("keeps current object insertion-order serialization stable", () => {
    const cache = new CacheManager();

    expect(cache.generateKey("video", { lang: "zh-Hans" })).toBe(
      'video:{"lang":"zh-Hans"}',
    );
  });

  it("tracks video cache hits, misses, sets, deletes, and clear", () => {
    const cache = new CacheManager<{ title: string }>();

    expect(cache.getVideoInfo("missing")).toBeUndefined();
    cache.setVideoInfo("video-key", { title: "Test Video" });

    expect(cache.getVideoInfo("video-key")).toEqual({ title: "Test Video" });
    cache.deleteVideoInfo("video-key");
    expect(cache.getVideoInfo("video-key")).toBeUndefined();

    expect(cache.getStats()).toEqual({
      hits: 1,
      misses: 2,
      sets: 1,
      deletes: 1,
    });

    cache.clear();
    expect(cache.getStats()).toEqual({
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
    });
  });

  it("tracks comment cache values with a separate generic type", () => {
    const cache = new CacheManager<unknown, { comments: string[] }>();

    cache.setCommentInfo("comment-key", { comments: ["first"] });

    expect(cache.getCommentInfo("comment-key")).toEqual({
      comments: ["first"],
    });
  });
});
```

- [x] **Step 2: Run the new cache baseline**

Run:

```bash
npm test -- tests/cache.test.ts
```

Expected:

```text
tests/cache.test.ts passes before the type refactor.
```

If this fails before implementation, stop and report the exact behavior mismatch instead of changing production code.

---

### Task 2: Genericize CacheManager Without Runtime Changes

**Files:**

- Modify: `src/utils/cache.ts`
- Test: `tests/cache.test.ts`

- [x] **Step 1: Replace cache value `any` with generic value types**

In `src/utils/cache.ts`, keep the current imports and `CacheOptions`, then update the class shape to:

```ts
export class CacheManager<VideoValue = unknown, CommentValue = unknown> {
  private videoCache: QuickLRU<string, VideoValue>;
  private commentCache: QuickLRU<string, CommentValue>;
  private cacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
  };
```

Do not change the constructor cache sizes or max ages.

- [x] **Step 2: Type the video cache methods**

Update these methods exactly by behavior:

```ts
  getVideoInfo(key: string): VideoValue | undefined {
    const value = this.videoCache.get(key);
    if (value) {
      this.cacheStats.hits++;
    } else {
      this.cacheStats.misses++;
    }
    return value;
  }

  setVideoInfo(key: string, value: VideoValue): void {
    this.videoCache.set(key, value);
    this.cacheStats.sets++;
  }
```

Keep `deleteVideoInfo` behavior unchanged.

- [x] **Step 3: Type the comment cache methods**

Update these methods exactly by behavior:

```ts
  getCommentInfo(key: string): CommentValue | undefined {
    const value = this.commentCache.get(key);
    if (value) {
      this.cacheStats.hits++;
    } else {
      this.cacheStats.misses++;
    }
    return value;
  }

  setCommentInfo(key: string, value: CommentValue): void {
    this.commentCache.set(key, value);
    this.cacheStats.sets++;
  }
```

Keep `deleteCommentInfo`, `getStats`, and `clear` behavior unchanged.

- [x] **Step 4: Type cache key generation without changing output**

Change:

```ts
generateKey(prefix: string, ...args: any[]): string
```

to:

```ts
generateKey(prefix: string, ...args: unknown[]): string {
  const keyParts = [
    prefix,
    ...args.map((arg) =>
      typeof arg === "object" && arg !== null ? JSON.stringify(arg) : String(arg),
    ),
  ];
  return keyParts.join(":");
}
```

The `arg !== null` guard is allowed because `typeof null === "object"` and `JSON.stringify(null)` and `String(null)` both produce `"null"`, so existing output remains stable.

- [x] **Step 5: Verify cache hardening**

Run:

```bash
npm test -- tests/cache.test.ts
npm run build
rg -n "\bany\b" src/utils/cache.ts
```

Expected:

```text
Cache tests pass.
TypeScript build passes.
No `any` remains in src/utils/cache.ts.
```

---

### Task 3: Add API Response Interfaces

**Files:**

- Modify: `src/bilibili/types.ts`
- Test: `tests/bilibili-metadata.test.ts`
- Test: `tests/bilibili-transcript.test.ts`

- [x] **Step 1: Add typed API response aliases after `VideoInfo`**

In `src/bilibili/types.ts`, add these interfaces after the existing `VideoInfo` interface:

```ts
export interface BilibiliVideoInfoData extends VideoInfo {
  bvid?: string;
  aid?: number;
  need_login_subtitle?: boolean;
  preview_toast?: string;
}

export interface BilibiliSubtitleItem {
  id: number;
  lan: string;
  lan_doc: string;
  subtitle_url: string;
}
```

- [x] **Step 2: Reuse subtitle item type in `SubtitleInfo`**

Change `SubtitleInfo` from the inline subtitle object array to:

```ts
export interface SubtitleInfo {
  subtitle: {
    subtitles: BilibiliSubtitleItem[];
  };
}
```

- [x] **Step 3: Add a subtitle body item type**

Add this before `SubtitleContent`:

```ts
export interface SubtitleBodyItem {
  from: number;
  to: number;
  location?: number;
  content: string;
}
```

Then update `SubtitleContent` to:

```ts
export interface SubtitleContent {
  body: SubtitleBodyItem[];
}
```

`location` must be optional because current tests build subtitle body rows without `location`.

- [x] **Step 4: Verify interface-only change**

Run:

```bash
npm test -- tests/bilibili-metadata.test.ts tests/bilibili-transcript.test.ts
npm run build
```

Expected:

```text
Focused tests pass.
TypeScript build passes.
```

---

### Task 4: Tighten Subtitle Wrapper Types

**Files:**

- Modify: `src/bilibili/subtitle.ts`
- Test: `tests/bilibili-transcript.test.ts`
- Test: `tests/bilibili-metadata.test.ts`

- [x] **Step 1: Import typed response interfaces**

In `src/bilibili/subtitle.ts`, replace the inline return type import usage with top-level type imports:

```ts
import type {
  BilibiliSubtitleItem,
  BilibiliVideoInfoData,
  SubtitleBodyItem,
  VideoTranscriptData,
} from "./types.js";
```

Then change:

```ts
): Promise<import("./types.js").VideoTranscriptData> {
```

to:

```ts
): Promise<VideoTranscriptData> {
```

- [x] **Step 2: Type subtitle helper inputs**

Change:

```ts
function selectBestSubtitle(
  subtitles: Array<{ id: number; lan: string; lan_doc: string; subtitle_url: string }>,
  preferredLang?: string
): { id: number; lan: string; lan_doc: string; subtitle_url: string } | null {
```

to:

```ts
function selectBestSubtitle(
  subtitles: BilibiliSubtitleItem[],
  preferredLang?: string,
): BilibiliSubtitleItem | null {
```

Change:

```ts
function mergeSubtitleText(
  body: Array<{ from: number; to: number; content: string }>
): string {
```

to:

```ts
function mergeSubtitleText(body: SubtitleBodyItem[]): string {
```

- [x] **Step 3: Type tag extraction**

Change:

```ts
function extractTags(videoData: any): string[] {
  const tags = videoData.tag || [];
  return tags.map((tag: { tag_name: string }) => tag.tag_name);
}
```

to:

```ts
function extractTags(videoData: BilibiliVideoInfoData): string[] {
  const tags = videoData.tag ?? [];
  return tags.map((tag) => tag.tag_name);
}
```

- [x] **Step 4: Type video info results**

Change both `getVideoInfo` result casts in `src/bilibili/subtitle.ts`:

```ts
const videoData = (await getVideoInfo(bvid)) as any;
```

and:

```ts
const videoData = await getVideoInfo(bvid) as any;
```

to:

```ts
const videoData = (await getVideoInfo(bvid)) as BilibiliVideoInfoData;
```

Do not change the `getVideoInfo` function itself in this task.

- [x] **Step 5: Verify subtitle typing**

Run:

```bash
npm test -- tests/bilibili-transcript.test.ts tests/bilibili-metadata.test.ts
npm run build
rg -n "\bany\b|as any" src/bilibili/subtitle.ts
```

Expected:

```text
Focused tests pass.
Build passes.
No `any` or `as any` remains in src/bilibili/subtitle.ts.
```

---

### Task 5: Tighten Comments API Casts Without Behavior Changes

**Files:**

- Modify: `src/bilibili/comments-api.ts`
- Modify if needed: `src/bilibili/comments.ts`
- Test: `tests/bilibili-comments-tool.test.ts`

- [x] **Step 1: Import `CommentsResponse` in `comments-api.ts`**

In `src/bilibili/comments-api.ts`, add or extend the type import:

```ts
import type { CommentsResponse } from "./types.js";
```

If the file already has a type import from `./types.js`, merge this symbol into the existing import.

- [x] **Step 2: Replace WBI result `any` cast**

Change:

```ts
const mainResult = (await fetchWithWBI(
  wbiPath,
  params,
  customHeaders,
)) as any;
```

to:

```ts
const mainResult = (await fetchWithWBI(
  wbiPath,
  params,
  customHeaders,
)) as CommentsResponse;
```

Do not change fallback logic.

- [x] **Step 3: Keep comments wrapper behavior unchanged**

Inspect `src/bilibili/comments.ts`. If TypeScript build passes after Step 2, do not modify it. If build requires a local type annotation, only add `CommentsResponse` where the current code already casts:

```ts
const commentsData = (await getVideoComments(
  bvidOrUrl,
  1,
  commentCount,
  sort,
  includeReplies,
)) as CommentsResponse;
```

Do not change `bvidOrUrl` to `bvid` in the `getVideoComments` call because existing tests assert the old public call behavior.

- [x] **Step 4: Verify comments behavior**

Run:

```bash
npm test -- tests/bilibili-comments-tool.test.ts
npm run build
rg -n "\bas any\b" src/bilibili/comments-api.ts src/bilibili/comments.ts
```

Expected:

```text
Comment tests pass.
Build passes.
The `comments-api.ts` WBI result cast is no longer `as any`.
No behavior changes appear in comment API fallback logic.
```

---

### Task 6: Full Verification And Memory Record

**Files:**

- Modify if completed: `docs/agent-memory/verification-log.md`
- Inspect: `src/utils/cache.ts`
- Inspect: `src/bilibili/types.ts`
- Inspect: `src/bilibili/subtitle.ts`
- Inspect: `src/bilibili/comments-api.ts`
- Inspect: `tests/cache.test.ts`

- [x] **Step 1: Run focused and global verification**

Run:

```bash
npm test -- tests/cache.test.ts tests/bilibili-metadata.test.ts tests/bilibili-comments-tool.test.ts tests/bilibili-transcript.test.ts
npm test
npm run build
```

Expected:

```text
Focused tests pass.
Full Vitest suite passes.
TypeScript build passes.
```

- [x] **Step 2: Inspect type-hardening scope**

Run:

```bash
rg -n "\bany\b|as any" src/utils/cache.ts src/bilibili/subtitle.ts src/bilibili/comments-api.ts src/bilibili/comments.ts
git diff -- src/utils/cache.ts src/bilibili/types.ts src/bilibili/subtitle.ts src/bilibili/comments-api.ts src/bilibili/comments.ts tests/cache.test.ts docs/agent-memory/verification-log.md
git status --short
```

Expected:

```text
`src/utils/cache.ts` has no `any`.
`src/bilibili/subtitle.ts` has no `any` or `as any`.
`src/bilibili/comments-api.ts` no longer uses `as any` for the WBI comments result.
Diff is limited to Task 4 type/cache files, tests/cache.test.ts, and verification-log append.
Existing unrelated dirty files remain unstaged and untouched.
```

- [x] **Step 3: Record Task 4 verification**

If Step 1 and Step 2 pass, append this entry to `docs/agent-memory/verification-log.md`:

```markdown
## 2026-06-14 Task 4 Type And Cache Hardening

- Commands: `npm test -- tests/cache.test.ts tests/bilibili-metadata.test.ts tests/bilibili-comments-tool.test.ts tests/bilibili-transcript.test.ts`; `npm test`; `npm run build`; type-hardening scan with `rg`.
- Result: `CacheManager` now uses generic value types and preserves cache key/stat behavior, selected Bilibili wrapper casts are replaced with typed response interfaces, focused behavior tests and full tests/build pass.
- Caveat: No cache key format, MCP public contract, credential loading, logging behavior, source encoding, package metadata, tag, push, publish, or GitHub release was changed.
```

Do not update `docs/agent-memory/decisions.md` or `docs/agent-memory/lessons-learned.md` unless implementation discovers a new durable decision or repeated pitfall.

---

## Acceptance Criteria

- `tests/cache.test.ts` covers current primitive cache key behavior, current object insertion-order serialization, cache stats, and separate video/comment value types.
- `src/utils/cache.ts` uses generic cache value types instead of `any`.
- `CacheManager.generateKey()` accepts `unknown[]` key parts and keeps existing output format.
- `src/bilibili/types.ts` defines reusable response interfaces for video info, subtitle items, and subtitle body rows.
- `src/bilibili/subtitle.ts` uses typed interfaces instead of local `any` casts.
- `src/bilibili/comments-api.ts` no longer casts the WBI comments response to `any`.
- Existing metadata, comments, and transcript behavior remains unchanged.
- `npm test` passes.
- `npm run build` passes.
- No source comment/mojibake cleanup is mixed into this task.
- No MCP tool contract, logging, credential loading, README, package, release workflow, or package contents changes are mixed into this task.

## Rollback Point

If this task breaks tests, build, cache keys, subtitle fallback behavior, or comment fallback behavior, revert only Task 4 files:

```bash
git restore -- src/utils/cache.ts src/bilibili/types.ts src/bilibili/subtitle.ts src/bilibili/comments-api.ts src/bilibili/comments.ts tests/cache.test.ts docs/agent-memory/verification-log.md
```

Use the restore command only if those files contain no unrelated user changes. If unrelated user changes are present in any file, stop and report the conflicting paths instead of restoring.

## Commit Boundary

If the user asks for a local commit after successful verification, use the configured `git-local-commit` skill and stage only Task 4 files:

```bash
git add src/utils/cache.ts src/bilibili/types.ts src/bilibili/subtitle.ts src/bilibili/comments-api.ts tests/cache.test.ts docs/agent-memory/verification-log.md
git commit -m "refactor: tighten cache and API wrapper types"
```

If `src/bilibili/comments.ts` is modified because TypeScript required a local annotation, include it in the `git add` command. If the user has not asked for a commit, stop after reporting changed files, verification commands, skipped checks, and remaining dirty worktree state.

## Self-Review

- Spec coverage: This plan covers cache key/stat baselines, cache generics, API response interfaces, subtitle wrapper type tightening, comments API cast tightening, focused tests, full tests, build, diff scope, and verification memory.
- Placeholder scan: The plan names exact files, commands, expected outputs, interfaces, method signatures, and rollback paths. It does not leave Task 4 behavior or tests open-ended.
- Scope control: The plan explicitly excludes Task 5 encoding cleanup, MCP contract changes, credential changes, logging changes, package changes, release actions, and commits without user approval.
