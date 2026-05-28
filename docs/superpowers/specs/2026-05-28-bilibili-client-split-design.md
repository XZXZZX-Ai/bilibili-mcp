# Bilibili Client Split Design

## Purpose

Phase 2 splits `src/bilibili/client.ts` into focused modules without changing MCP tool behavior. The current subtitle strategy is valuable and must stay intact: fetch video metadata for `cid`, prefer `/x/player/wbi/v2`, fall back to `/x/player/v2` when the WBI response has no subtitles, then download and merge `subtitle_url` content.

## Current Problem

`src/bilibili/client.ts` currently owns unrelated responsibilities:

- request timeout, rate limiting, retry, and response parsing
- WBI key retrieval and signature generation
- buvid fingerprint fetching and cache
- video metadata and subtitle API calls
- subtitle content downloading
- comments API calls and fallback behavior
- compatibility exports used by `subtitle.ts` and `comments.ts`

This makes API behavior hard to test in isolation. It also raises the risk that a comments change accidentally breaks subtitle retrieval, WBI signing, or package exports.

## Selected Approach

Use a compatibility-first staged split.

Add tests around the highest-risk behavior before moving code. Then extract one responsibility at a time while keeping the existing public imports from `./client.js` working. `client.ts` should become a small re-export layer after the split.

This is intentionally not a feature expansion. Phase 2 does not add new MCP tools, does not change tool schemas, and does not change response shapes.

## Target Files

- `src/bilibili/http.ts`: shared HTTP helpers, timeout, rate limiting, retry, JSON response handling, `fetchWithWBI`, and `fetchWithoutWBI`.
- `src/bilibili/wbi.ts`: WBI key retrieval, mix key calculation, MD5 signing, and WBI cache.
- `src/bilibili/fingerprint.ts`: buvid3/buvid4 retrieval and cache.
- `src/bilibili/video-api.ts`: `getVideoInfo`, `getVideoSubtitle`, and `getSubtitleContent`.
- `src/bilibili/comments-api.ts`: `getVideoComments` and comment fallback logic.
- `src/bilibili/client.ts`: compatibility re-exports for existing callers.
- `tests/bilibili-video-api.test.ts`: deterministic tests for subtitle fallback and subtitle content URL handling.

## Public Compatibility

These existing exports must continue to work from `src/bilibili/client.ts`:

- `checkLoginStatus`
- `fetchWithWBI`
- `fetchWithoutWBI`
- `getVideoInfo`
- `getVideoSubtitle`
- `getSubtitleContent`
- `getVideoComments`

Existing imports in `src/bilibili/subtitle.ts` and `src/bilibili/comments.ts` may remain pointed at `./client.js` during Phase 2. Directly changing those imports is optional, not required.

## Data Flow

The `get_video_info` MCP flow remains:

1. `src/server.ts` validates `bvid_or_url` and `preferred_lang`.
2. `getVideoInfoWithSubtitle()` extracts the BV id and checks cache.
3. `getVideoInfo()` fetches `/x/web-interface/view` and provides `cid`.
4. `getVideoSubtitle()` builds authenticated headers, appends buvid cookies when available, and calls `/x/player/wbi/v2`.
5. If the WBI response has no subtitles, `getVideoSubtitle()` calls `/x/player/v2` with the same auth/buvid header strategy.
6. `selectBestSubtitle()` chooses the preferred language.
7. `getSubtitleContent()` downloads the subtitle JSON and supports both absolute URLs and `//` protocol-relative URLs.
8. `mergeSubtitleText()` returns newline-joined subtitle text.

## Error Handling

Preserve current error semantics:

- Expired or invalid Cookie detection must not print credential values.
- Empty subtitle lists should trigger login verification in `getVideoInfoWithSubtitle()`.
- `COOKIE_EXPIRED` must propagate instead of silently falling back to description.
- Non-auth subtitle failures may fall back to description.
- Network and timeout failures should keep using the existing error classes from `src/utils/errors.ts`.

## Testing

Add deterministic Vitest tests that mock `globalThis.fetch`. Do not call live Bilibili APIs and do not require real Cookie values.

Minimum behavior to pin before or during extraction:

- WBI subtitle response with subtitles returns immediately and does not call `/x/player/v2`.
- Empty WBI subtitle response falls back to `/x/player/v2`.
- Fallback subtitle response is returned when `/x/player/v2` has subtitles.
- `getSubtitleContent("//example.test/subtitle.json")` calls `https://example.test/subtitle.json`.
- `client.ts` still exports the expected compatibility functions.

## Non-Goals

- Do not add `get_video_transcript`, `get_video_metadata`, or other new MCP tools.
- Do not change `get_video_info` or `get_video_comments` schemas.
- Do not rewrite `src/server.ts` except for a required import fix if compilation demands it.
- Do not remove Cookie-based subtitle access.
- Do not introduce Smithery configuration.
- Do not perform broad documentation or mojibake cleanup.

## Verification

Phase 2 is complete only when:

- `npm test` passes.
- `npm run build` passes.
- `npm pack --dry-run` passes.
- `src/bilibili/client.ts` remains a compatibility export layer.
- Existing MCP response shapes remain unchanged.
- No test, log, or report prints full Cookie values.
