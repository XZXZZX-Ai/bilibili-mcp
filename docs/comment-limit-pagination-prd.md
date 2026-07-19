# Product Requirements Document: Comment Limit Pagination

**Version**: 1.0
**Date**: 2026-07-19
**Author**: Sarah (Product Owner)
**Quality Score**: 94/100

## Executive Summary

`get_video_comments` publicly accepts `limit` values from 1 through 50, but the Bilibili request layer caps each page at 20 and the current orchestration fetches only page 1. As a result, values above 20 are silently under-fulfilled.

The minimum fix is to fetch sequential pages of at most 20 top-level comments, merge them, stop when the requested top-level count is reached or the upstream API has no more comments, and preserve the existing response shape and detailed-mode reply expansion.

## Problem Statement

- Current contract: schema, validation, and both READMEs advertise `limit: 1-50`.
- Current behavior: one request is made and its `ps` value is capped at 20.
- Expected behavior: a valid limit above 20 should return up to that many available top-level comments instead of silently behaving like 20.

## Success Metrics

- A deterministic test proves `limit: 50` requests pages with sizes 20, 20, and 10.
- Pagination stops early after an empty or short page.
- Existing comment tests, the full test suite, and TypeScript build pass.

## User Story And Acceptance Criteria

As an MCP client requesting comments, I want the documented `limit` to be honored so that I receive the requested number of available top-level comments without issuing multiple tool calls myself.

- For limits at or below 20, preserve the current single-request behavior.
- For limits above 20, request sequential pages with each page size no greater than 20.
- Merge pages in upstream order and never retain more top-level comments than the requested limit.
- Stop when the limit is reached, a page is empty, or a page contains fewer entries than requested for that page.
- In `detailed` mode, `limit` continues to count top-level comments; the existing addition of up to three child replies per top-level comment remains unchanged.
- Preserve tool names, input schema, validation range, sorting, reply handling, cache behavior, errors, and response shape.

## Technical Constraints

- Keep the change local to comment orchestration and its unit tests unless a directly necessary type adjustment is identified.
- Do not perform parallel page requests; sequential requests reduce ordering and rate-limit risk.
- Do not add network-dependent tests or credentials.
- Do not broaden this task into comment API redesign, metadata caching, or cursor-based pagination.

## Risks And Mitigations

- More requests for limits above 20: bounded to three pages because the public maximum is 50.
- Upstream page exhaustion: stop on empty or short pages.
- Child replies can make the final processed array larger than `limit`: preserve this documented detailed-mode behavior and test top-level pagination separately.

## Out Of Scope

- Raising the maximum above 50.
- Changing how child replies contribute to the final response count.
- Parallel fetching, retries beyond the existing HTTP policy, or a new public pagination cursor.
