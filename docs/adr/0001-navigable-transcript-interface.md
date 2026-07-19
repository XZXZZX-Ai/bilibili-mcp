# ADR 0001: Add Navigable Transcript Capabilities Through Existing Video Tools

## Status

Accepted on 2026-07-20.

## Context

The server currently treats each BVID as one playable item, merges subtitle timing away, and exposes no Bilibili-provided Chapters. We need timed range reads, Part selection, and Chapters without breaking existing callers or adding batch crawling.

## Decision

- Extend `get_video_transcript` and `get_video_info` with an optional one-based `page` selector.
- Extend `get_video_transcript` with optional `include_timestamps`, `start_seconds`, and `end_seconds` inputs while preserving current defaults.
- Add normalized Part summaries to `get_video_metadata` so callers can discover valid page numbers before selecting one.
- Add one dedicated `get_video_chapters` tool because Chapters have their own availability and upstream request semantics.
- Keep Part resolution behind one shared Bilibili navigation module used by metadata, transcript, video-info, and chapter flows.

## Consequences

- Existing calls retain their current defaults and required fields.
- The public tool list grows by one tool.
- Page validation and CID selection are centralized instead of repeated in handlers.
- Chapter retrieval depends on an undocumented Bilibili consumer webpage response and must return an empty list when Chapters are absent.
- Whole-series crawling, inferred Chapters, search, and write operations remain out of scope.
