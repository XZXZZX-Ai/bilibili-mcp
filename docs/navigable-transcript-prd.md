# Product Requirements Document: Navigable Transcript

**Version**: 1.0
**Date**: 2026-07-20
**Author**: Sarah (Product Owner)
**Quality Score**: 94/100

## Executive Summary

Add three related capabilities to `@xzxzzx/bilibili-mcp`: timestamped and range-limited transcripts, multi-Part Video selection, and Bilibili-provided Chapters. The feature targets learners and MCP agents that need to locate precise moments without loading an entire long transcript.

The implementation must reuse existing Video/subtitle requests, preserve current default tool behavior, keep Cookie handling external, and avoid automatic whole-series crawling.

## Problem Statement

Current transcripts discard subtitle timing, all content flows implicitly use the top-level CID, and the server ignores Chapters returned by the player endpoint. Users cannot reliably ask what happened around a timestamp, select P2/P19, or navigate creator-defined sections.

## Success Metrics

- Existing tool calls with no new arguments retain their required fields and current behavior.
- A transcript call can select any valid one-based page and return only Subtitle Segments overlapping a requested range.
- Timestamp mode makes every returned subtitle line locatable in the Video.
- Metadata exposes all available Parts without additional upstream requests.
- Chapter calls return Bilibili-provided intervals or an empty list; they never invent Chapters.
- Build, full Vitest suite, stdio tool discovery, package dry-run, and secret scan pass.

## User Personas

### Primary: Learner Or Researcher

- Wants a precise answer from a long course, tutorial, or recorded talk.
- Needs page titles, timestamps, and Chapters to verify or revisit the source.

### Secondary: MCP Host Or Agent

- Needs bounded structured data and predictable validation instead of ingesting an entire multi-Part Video.

## User Stories And Acceptance Criteria

### Timed Range Transcript

As a user, I want transcript text from a time interval so that I can inspect a precise moment.

- Optional `start_seconds` and `end_seconds` are finite non-negative numbers.
- When both are provided, `end_seconds >= start_seconds`.
- A Subtitle Segment is included when it overlaps the requested range.
- `include_timestamps: true` prefixes each returned line with its start and end time.
- Default transcript output remains unchanged when none of these options is provided.
- Description fallback is rejected when timestamps or a range are requested because it cannot satisfy timed semantics.

### Multi-Part Selection

As a user, I want to discover and select P2/P19 so that I receive content from the intended Part.

- `get_video_metadata` returns `pages` entries containing `page`, `cid`, `title`, and `duration`.
- `get_video_transcript`, `get_video_info`, and `get_video_chapters` accept an optional one-based integer `page`.
- Missing `page` preserves current top-level/default-Part behavior.
- An out-of-range page returns a structured validation error before any player/subtitle request.
- No tool automatically iterates every Part.

### Bilibili Chapters

As a user, I want platform-provided Chapters so that I can navigate creator-defined sections.

- Add `get_video_chapters` with required `bvid_or_url` and optional `page`.
- Return `bvid`, Part identity, and `chapters` containing only `title`, `start_seconds`, and `end_seconds`.
- Missing Chapters produce `chapters: []`, not inferred data and not an error.
- Chapter titles are treated as untrusted external content and bounded before output.

## Functional Requirements

### Public Interface

- Existing tool names and required inputs remain unchanged.
- Tool count changes from 7 to 8 with `get_video_chapters` appended after `get_video_metadata`.
- New transcript inputs: `page`, `include_timestamps`, `start_seconds`, `end_seconds`.
- New video-info input: `page`.
- Metadata response gains `pages` additively.
- Package source version becomes `1.7.0`; no tag or npm publication is part of this task.

### Shared Navigation Module

- Normalize upstream `pages` into Parts once.
- Resolve page-to-CID in one shared module.
- Reuse the same resolution for transcript, video info, metadata, and Chapters.
- Keep raw Bilibili transport access in the existing video API module.

### Limits And Error Handling

- Reuse existing BVID, language, output-size, timeout, retry, redaction, and credential behavior.
- Validate all new inputs before player/subtitle requests.
- Preserve structured MCP validation and network error payloads.
- Do not log subtitle text, Chapter titles, Cookies, or raw player responses.

## Out Of Scope

- Transcript keyword search or vector indexing.
- Automatic full-series transcript collection.
- AI-inferred Chapters.
- Danmaku, recommendations, likes, coins, favorites, follows, or other write operations.
- New dependencies, database, remote HTTP transport, tag, npm publish, or GitHub Release.

## Technical Constraints

- TypeScript ESM with Node16 module resolution and the existing MCP SDK.
- No new runtime dependency.
- Default flows must not add an upstream request.
- Chapter retrieval may add one player request only when the new tool is called.
- Bilibili consumer webpage endpoints have no public stability guarantee; response parsing must be defensive.

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Player `view_points` changes | Medium | Medium | Defensive optional mapping and empty-list fallback |
| Page/CID mismatch | Medium | High | One shared resolver with boundary tests |
| Timed output becomes too large | Low | Medium | Preserve existing subtitle item/text limits and range filtering |
| Cookie or UGC leakage | Low | High | Existing credential manager, redaction, no raw-response logging, scoped secret scan |
| Existing callers break | Low | High | Additive schemas, unchanged defaults, MCP handler regressions |

## Verification

- Focused Vitest coverage for page resolution, range overlap, timestamp formatting, chapter mapping, schemas, handlers, and unchanged defaults.
- `npm run build`
- `npm test`
- `npm audit --omit=dev --json`
- `npm pack --dry-run --json`
- MCP stdio/tool-list smoke and scoped secret scan.
- Optional live read-only QA against public multi-Part and Chapter examples, without recording credentials.
