# MCP Tool Surface Design

## Purpose

Phase 3 improves the MCP tool surface after the stabilization baseline and `src/bilibili/client.ts` split are complete. The goal is to make common consumer intents explicit without breaking existing clients:

- transcript-only retrieval for agents that want plain subtitle text
- metadata-only retrieval for agents that do not want subtitles
- more controllable comment retrieval with explicit `limit`, `sort`, and `include_replies`

This phase is additive and compatibility-first. Existing `get_video_info` and `get_video_comments` calls must keep working.

## Current State

The MCP server currently exposes two tools from `src/server.ts`:

- `get_video_info`: accepts `bvid_or_url` and optional `preferred_lang`; returns `SubtitleData`, which may contain subtitle text or description fallback.
- `get_video_comments`: accepts `bvid_or_url` and optional `detail_level`; returns processed popular comments.

After Phase 2, Bilibili API integration is split into focused modules:

- `src/bilibili/video-api.ts`: raw video, subtitle, and subtitle content API calls.
- `src/bilibili/comments-api.ts`: raw comment API calls.
- `src/bilibili/subtitle.ts`: subtitle-oriented aggregate behavior.
- `src/bilibili/comments.ts`: processed comment aggregate behavior.
- `src/bilibili/client.ts`: compatibility re-exports.

This gives Phase 3 a safer place to add tool-level wrappers without editing low-level HTTP, WBI, or credential code.

## Selected Approach

Add small service-level wrappers first, then expose them through MCP schemas.

Keep `src/server.ts` as the only MCP registration and request routing module, but avoid putting new business logic directly inside request handlers. New behavior should live in `src/bilibili/subtitle.ts`, `src/bilibili/comments.ts`, or a focused new file if needed.

The first implementation should prefer predictable output shapes over highly configurable responses. Tool schemas should be explicit, narrow, and easy for MCP clients to generate.

## Tool Changes

### New Tool: `get_video_transcript`

Intent: return clean transcript text only.

Input schema:

- `bvid_or_url`: required string.
- `preferred_lang`: optional string; same semantics as `get_video_info`.
- `fallback_to_description`: optional boolean, default `false`.

Response shape:

```json
{
  "bvid": "BV...",
  "data_source": "subtitle",
  "language": "zh-Hans",
  "transcript": "line 1\nline 2",
  "title": "video title"
}
```

If subtitles are unavailable:

- when `fallback_to_description` is `false`, return an MCP error with a stable code such as `SUBTITLE_UNAVAILABLE`.
- when `fallback_to_description` is `true`, return `data_source: "description"` and put the video description in `transcript`.
- when Cookie is invalid and login verification proves it, preserve the existing `COOKIE_EXPIRED` behavior.

### New Tool: `get_video_metadata`

Intent: return metadata without subtitle text.

Input schema:

- `bvid_or_url`: required string.

Response shape:

```json
{
  "bvid": "BV...",
  "title": "video title",
  "author": "up name",
  "duration": 123,
  "pubdate": "2026-05-28T00:00:00.000Z",
  "pubdate_timestamp": 1779926400,
  "description": "description",
  "tags": ["tag"],
  "stats": {
    "view": 0,
    "like": 0,
    "coin": 0,
    "favorite": 0,
    "share": 0,
    "reply": 0,
    "danmaku": 0
  }
}
```

The implementation should normalize only fields that are already present in `/x/web-interface/view`. Missing optional fields should become `undefined`, empty arrays, or `0` only when that matches existing Bilibili response conventions.

### Existing Tool: `get_video_comments`

Add optional explicit controls while preserving `detail_level`:

- `limit`: optional integer, default derived from `detail_level`; allowed range `1..50`.
- `sort`: optional enum, default existing hot behavior. Use stable string names in MCP schema:
  - `"hot"` maps to Bilibili sort `1`
  - `"time"` maps to Bilibili sort `0`
- `include_replies`: optional boolean, default existing behavior `true`.

Backward compatibility:

- Calls with only `bvid_or_url` still return brief comments.
- Calls with `detail_level: "brief"` still return the current brief default.
- Calls with `detail_level: "detailed"` still include the detailed default count and replies unless overridden.
- Existing response shape remains compatible: `comments` and `summary` stay present.

## Validation

Use existing validation utilities where possible:

- `validateBVInput`
- `validateLanguage`
- `validateDetailLevel`
- `sanitizeBVInput`

Add new validation helpers only when needed:

- `validateCommentLimit(limit)`
- `validateCommentSort(sort)`
- `validateBooleanOption(value, name)` only if current schema parsing needs it.

Validation failures should return MCP `isError: true` responses with stable JSON:

```json
{
  "error": true,
  "message": "Invalid input",
  "code": "VALIDATION_ERROR"
}
```

Do not leak Cookie values in validation errors or logs.

## Error Semantics

Keep the distinction between:

- validation failure: client supplied invalid input
- subtitle unavailable: valid video, no usable subtitle
- cookie expired: authenticated subtitle path required but current Cookie is invalid
- upstream/network failure: Bilibili or network error

The new transcript tool should not silently return description fallback unless the caller explicitly opts in with `fallback_to_description: true`.

## Documentation Impact

README and README_EN should document:

- all four tools
- parameter defaults
- `get_video_comments` backward compatibility
- no-cookie vs Cookie behavior
- example MCP calls
- expected error codes

Detailed release documentation belongs to Phase 4, but Phase 3 should update any tool tables or examples that would otherwise become wrong.

## Non-Goals

- Do not change the low-level WBI, buvid, retry, or credential strategy.
- Do not remove `get_video_info`.
- Do not rename `get_video_comments`.
- Do not change existing MCP response shapes except for additive fields that do not break old clients.
- Do not introduce Smithery.
- Do not add live Bilibili integration tests requiring real Cookie values.
- Do not perform broad mojibake cleanup outside touched sections.

## Testing Strategy

Add deterministic Vitest coverage for MCP request routing and service wrappers:

- list tools includes `get_video_transcript` and `get_video_metadata`.
- transcript tool returns subtitle text when subtitle data is available.
- transcript tool errors when subtitle data is unavailable and fallback is disabled.
- transcript tool returns description when fallback is enabled.
- metadata tool maps `/x/web-interface/view` fields into the stable metadata response.
- comments tool honors `limit`, `sort`, and `include_replies`.
- old comments calls still behave like brief/detailed defaults.

Tests should mock fetch or module boundaries. They must not call live Bilibili APIs and must not require real Cookie values.

## Acceptance Criteria

- Existing `get_video_info` and `get_video_comments` calls remain backward compatible.
- `get_video_transcript` and `get_video_metadata` are registered with stable schemas.
- Comment controls are explicit, validated, and documented.
- `npm test` passes.
- `npm run build` passes.
- `npm pack --dry-run` passes.
- No full Cookie value is logged, committed, or included in examples.

