# Product Requirements Document: Transcript Keyword Search

**Version**: 1.0

**Date**: 2026-07-20

**Owner**: Codex
**Quality Score**: 92/100

## Executive Summary

Extend `get_video_transcript` with optional keyword search so an MCP client can locate relevant moments in a long Bilibili video without receiving the full transcript. The feature returns timestamped matches plus bounded neighboring Subtitle Segments and preserves existing behavior when no query is supplied.

## Problem Statement

Today a user must either request the full transcript or already know a time range. For long videos this wastes context tokens and makes “where did the speaker discuss X?” unnecessarily expensive.

## User Story

As an MCP user, I want to search one Part's subtitles for a phrase and receive the matching times with nearby context, so that an AI client can answer and point me to the relevant playback position without reading the full transcript.

## MVP Requirements

- Add optional `query`, `max_matches`, and `context_segments` inputs to `get_video_transcript`.
- `query` is trimmed, non-empty, at most 100 characters, and matched as a case-insensitive literal substring; no regex or semantic search.
- `max_matches` is an integer from 1 to 20, default 10.
- `context_segments` is an integer from 0 to 5, default 1 on each side.
- Existing Part, language, and Transcript Range selection run before keyword matching.
- Each matching Subtitle Segment counts once and is returned in chronological order.
- Each result exposes hit start/end seconds, hit content, and timestamped Transcript Context.
- Search mode returns query metadata, total/returned counts, truncation status, structured matches, and a compact `transcript` assembled from returned contexts.
- No match is a successful result with empty `matches` and empty `transcript`.
- Search mode requires real subtitles and is incompatible with description fallback.
- Calls without `query` preserve current inputs, output, errors, request count, and defaults.

## Out Of Scope

- Semantic/fuzzy search, embeddings, vector databases, regex, stemming, translation, ranking, or inferred Chapters.
- Cross-Part or cross-video search.
- New Bilibili endpoints, dependencies, credentials, tools, or network requests.

## Acceptance Criteria

- The MCP tool count remains eight and `bvid_or_url` remains the only required transcript field.
- Chinese and Latin queries work; Latin matching is case-insensitive.
- Range filtering, maximum match count, context bounds, adjacent matches, zero matches, and invalid inputs have deterministic tests.
- Cookie expiration and no-subtitle behavior remain unchanged; description fallback is never searched.
- Bilingual README and changelog documentation match the implemented schema and response.
- Focused tests, full tests, build, stdio smoke, package dry run, UTF-8, diff, and secret checks pass.

## Success Metrics

- A query can return at most 20 bounded contexts instead of the full transcript.
- Existing no-query transcript regressions remain green.
- Keyword search adds zero Bilibili requests and zero dependencies.

## Risks

- Literal matching may miss paraphrases; this is intentional for the first version.
- Neighboring matches may contain overlapping context; each match remains self-contained and bounded.
- Bilibili subtitle text quality still limits match quality.
