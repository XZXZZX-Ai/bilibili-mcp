# MCP Tool Surface Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` or `superpowers:executing-plans` to execute this plan task by task. Use the `vitest` skill for test work. Use `risk-reviewer` before completion.

**Goal:** Add transcript and metadata MCP tools, and extend comment controls, while preserving existing tool compatibility.

**Architecture:** Add tests first, add service-level wrappers, then update MCP schemas and docs. Do not edit low-level WBI, HTTP, Cookie, or retry behavior unless a test proves the current behavior blocks the tool surface.

**Tech Stack:** TypeScript, Node.js ESM, MCP SDK, Vitest, npm.

---

## Current Constraints

- Preserve existing `get_video_info` and `get_video_comments` behavior.
- Preserve Cookie-based subtitle access through existing credential helpers.
- Do not hard-code or print Cookie values.
- Do not recreate Smithery configuration.
- Do not call live Bilibili APIs in tests.
- Keep MCP responses JSON-serializable.
- Keep changes scoped to tool surface, validation, wrappers, tests, and docs.

## Target Files

- Modify: `src/server.ts`
- Modify: `src/bilibili/subtitle.ts`
- Modify: `src/bilibili/comments.ts`
- Modify: `src/bilibili/types.ts` if shared response types are needed
- Modify: `src/utils/validation.ts`
- Create or modify: `tests/server-tools.test.ts`
- Create or modify: `tests/bilibili-comments-tool.test.ts`
- Update docs in Phase 3 only where tool examples would otherwise be wrong: `README.md`, `README_EN.md`

---

### Task 1: Add Tool Surface Baseline Tests

**Recommended Claude Code subagent:** `test-baseline-builder`

**Files:**
- Create: `tests/server-tools.test.ts`
- Inspect: `src/server.ts`

- [x] Add a test that lists tools and asserts existing tools remain present:
  - `get_video_info`
  - `get_video_comments`
- [x] Add pending or failing assertions for new tools:
  - `get_video_transcript`
  - `get_video_metadata`
- [x] Assert existing `get_video_comments` schema still accepts `detail_level`.
- [x] Do not require real MCP stdio transport. Call the exported server handlers or use the MCP request schema path already available in the project.
- [x] Run:

```bash
npm test -- tests/server-tools.test.ts
```

Expected at this point: current-tool assertions pass; new-tool assertions fail until implementation, unless the test is written after schema update.

Status: Completed with `tests/server-tools.test.ts`. Existing tool schema assertions pass; planned Phase 3 tools are represented with `it.todo` so the full suite remains green.

---

### Task 2: Add Comment Option Validation

**Files:**
- Modify: `src/utils/validation.ts`
- Modify or create: `tests/validation.test.ts`

- [x] Add `validateCommentLimit(limit)`:
  - accepts `undefined`
  - accepts integers from `1` through `50`
  - rejects `0`, negative values, non-integers, and values above `50`
- [x] Add `validateCommentSort(sort)`:
  - accepts `undefined`, `"hot"`, and `"time"`
  - rejects unknown strings
- [x] Keep `validateDetailLevel` unchanged for backward compatibility.
- [x] Run:

```bash
npm test -- tests/validation.test.ts
```

Expected: validation tests pass.

Status: Completed. `validateCommentLimit()` accepts only integer `1..50` or `undefined`; `validateCommentSort()` accepts only `undefined`, `"hot"`, or `"time"` and rejects `""`.

---

### Task 3: Extend Comment Wrapper Controls

**Recommended Claude Code subagent:** `test-baseline-builder`

**Files:**
- Modify: `src/bilibili/comments.ts`
- Create or modify: `tests/bilibili-comments-tool.test.ts`

- [x] Update `getVideoCommentsData()` to accept an options object while preserving the old positional signature if needed by current callers.
- [x] Support:
  - `detailLevel`
  - `limit`
  - `sort: "hot" | "time"`
  - `includeReplies`
- [x] Map sort strings:
  - `"hot"` -> `1`
  - `"time"` -> `0`
- [x] Preserve existing defaults:
  - brief -> 10 comments
  - detailed -> 20 comments
  - include replies by default
- [x] Cache keys must include effective limit, sort, and includeReplies values.
- [x] Add tests for:
  - old brief default
  - old detailed default
  - explicit `limit`
  - explicit `sort`
  - `include_replies: false`
- [x] Run:

```bash
npm test -- tests/bilibili-comments-tool.test.ts
npm test
```

Expected: old and new comment behavior pass.

Status: Completed. `getVideoCommentsData()` now supports old positional calls and new options calls. Tests cover defaults, explicit limit/sort/includeReplies, and cache key behavior.

---

### Task 4: Add Metadata Wrapper

**Files:**
- Modify: `src/bilibili/subtitle.ts` or create `src/bilibili/metadata.ts`
- Create or modify: metadata-focused tests

- [x] Add `getVideoMetadataData(bvidOrUrl)` that:
  - extracts and returns `bvid`
  - calls `getVideoInfo()`
  - maps title, owner/author, duration, pubdate, description, tags, and stat fields
  - does not fetch subtitles
- [x] Keep stats field names stable and lower_snake_case only when the source field is already lower_snake_case; do not invent extra metrics.
- [x] Add tests with mocked `getVideoInfo()` or mocked fetch.
- [x] Run:

```bash
npm test
```

Expected: metadata wrapper tests pass without network or Cookie.

Status: Completed. `src/bilibili/metadata.ts` adds `getVideoMetadataData()`, maps video info metadata without fetching subtitles or comments, and is covered by `tests/bilibili-metadata.test.ts`.

---

### Task 5: Add Transcript Wrapper

**Files:**
- Modify: `src/bilibili/subtitle.ts`
- Create or modify: transcript-focused tests

- [x] Add `getVideoTranscriptData(bvidOrUrl, preferredLang?, fallbackToDescription = false)`.
- [x] Reuse existing subtitle selection and merge behavior where practical.
- [x] Return only transcript-oriented fields:
  - `bvid`
  - `data_source`
  - `language` if known
  - `transcript`
  - `title`
- [x] If subtitle is unavailable and fallback is disabled, return or throw a stable `SUBTITLE_UNAVAILABLE` error.
- [x] If fallback is enabled, return description as transcript with `data_source: "description"`.
- [x] Preserve `COOKIE_EXPIRED` propagation.
- [x] Add tests for subtitle success, fallback disabled, fallback enabled, and invalid Cookie propagation if already practical.
- [x] Run:

```bash
npm test
```

Expected: transcript wrapper tests pass without live Bilibili calls.

Status: Completed. `getVideoTranscriptData()` supports subtitle-only transcript output, optional description fallback, language selection, and `COOKIE_EXPIRED` propagation. Tests cover success, language priority, fallback behavior, and Cookie-expired propagation.

---

### Task 6: Register MCP Tool Schemas And Handlers

**Recommended Claude Code subagent:** `build-error-resolver` if MCP SDK typing fails.

**Files:**
- Modify: `src/server.ts`
- Modify tests from Task 1

- [x] Add `get_video_transcript` to `ListToolsRequestSchema` response.
- [x] Add `get_video_metadata` to `ListToolsRequestSchema` response.
- [x] Extend `get_video_comments` schema with optional:
  - `limit`
  - `sort`
  - `include_replies`
- [x] Add handler for `get_video_transcript`.
- [x] Add handler for `get_video_metadata`.
- [x] Update `get_video_comments` handler to validate and pass explicit controls.
- [x] Keep `get_video_info` handler unchanged unless extracting duplicated validation helpers.
- [x] Ensure every validation failure returns stable `VALIDATION_ERROR` JSON.
- [x] Run:

```bash
npm test -- tests/server-tools.test.ts
npm test
npm run build
```

Expected: tool list and handler tests pass; TypeScript compiles.

Status: Completed. `src/server.ts` now registers `get_video_transcript` and `get_video_metadata`, extends `get_video_comments` with `limit`, `sort`, and `include_replies`, and wires handlers to the Phase 3 service wrappers. `tests/server-tools.test.ts` now has 17 schema assertions and no todo tests. Full handler-level tests remain a possible follow-up, but wrapper behavior is covered by focused service tests.

---

### Task 7: Update Tool Documentation

**Files:**
- Modify: `README.md`
- Modify: `README_EN.md`

- [x] Add `get_video_transcript` and `get_video_metadata` to tool lists.
- [x] Document new `get_video_comments` parameters.
- [x] Document defaults and backward compatibility.
- [x] Keep credential examples redacted.
- [x] Do not do broad README rewrites outside relevant tool sections.

Status: Completed. `README.md` and `README_EN.md` now document `get_video_transcript`, `get_video_metadata`, and the explicit `get_video_comments` controls. A review correction aligned `detailed` defaults to 20 comments in both READMEs and `src/server.ts` schema descriptions, matching implementation and tests.

---

### Task 8: Final Phase 3 Verification

**Recommended Claude Code subagent:** `release-verifier`

> **Status (2026-06-04):** Completed. 110 tests pass, build green, package clean (98 files). 4 tools registered, no regressions, no secret/Mojibake/artifact leaks. Phase 3 ready for commit.

- [x] Run: git status --short, npm test, npm run build, npm pack --dry-run
- [x] Confirm: existing tools present, new schemas stable, package excludes tests/.env/Smithery/debug, no Cookie leaks
- [x] Report: see verification-log.md

---

## Acceptance Criteria

- `get_video_info` remains backward compatible.
- `get_video_comments` remains backward compatible and supports explicit controls.
- `get_video_transcript` is available and returns transcript-only data.
- `get_video_metadata` is available and returns metadata-only data.
- Tool schemas are documented.
- `npm test` passes.
- `npm run build` passes.
- `npm pack --dry-run` passes.

## Rollback Points

- After Task 2, validation additions can be reverted independently.
- After Task 3, comment control changes can be reverted without affecting new tools.
- After Tasks 4-5, wrappers can be kept internal until server registration is complete.
- If MCP handler changes break existing tools, revert `src/server.ts` first and keep service wrappers/tests for follow-up.

## Self-Review

- Scope check: Phase 3 changes tool surface only.
- Compatibility check: existing tools stay registered and keep old parameter paths.
- Security check: no credential values in tests, docs, or logs.
- Test check: all new behavior has deterministic tests without live API calls.
