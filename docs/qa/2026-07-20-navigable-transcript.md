# QA Session: Navigable Transcript

- Date: 2026-07-20
- Version: 1.7.0 source preparation
- Owner: Codex
- Related PRD: `docs/navigable-transcript-prd.md`
- QA type: MCP tool change / pre-release

## Scope

- Timestamped and range-limited transcript output
- Multi-Part discovery and page selection
- Bilibili-provided Chapters
- Existing tool compatibility, credentials, package contents, and stdio cleanliness

## Automated Baseline

- [x] `npm run build` — TypeScript compilation PASS
- [x] `npm test` — 243 tests across 23 files, ALL PASS
- [x] `npm audit --omit=dev --json` — 0 vulnerabilities
- [x] `npm pack --dry-run --json` — 128 entries, version 1.7.0, includes navigation.js/chapters.js
- [x] `git diff --check` — no whitespace issues (CRLF normal on Windows)

## Public Interface

- [x] Existing seven tool names and required inputs remain stable.
- [x] `get_video_chapters` is appended as the eighth tool.
- [x] Transcript default output is unchanged without new options.
- [x] Invalid page/range/timestamp inputs return structured validation errors.
- [x] Page schemas declare `type: "integer"` with `minimum: 1`.
- [x] Metadata schema has no `page` input; metadata returns `pages` array only.

## Tool Workflows

- [x] Metadata lists all Parts of a public multi-Part Video (`pages` is always an array and is empty only when upstream omits Part data).
- [x] Transcript and video-info select the requested Part (unit tested).
- [x] Range filtering supports start-only, end-only, and overlap modes.
- [x] Timestamp mode emits locatable `[HH:MM:SS --> HH:MM:SS]` lines.
- [x] Chapter tool maps `view_points[].content` to Chapter title (with `title` fallback).
- [x] Chapter tool returns an empty list when no Chapters exist (unit tested).
- [x] Chapter tool propagates player/network errors (no silent catch).
- [x] Default transcript/video-info/metadata flows make exactly 1 view-api request.
- [x] `getPlayerData` includes auth headers and buvid fingerprint (matching `getVideoSubtitle`).
- [x] Live read-only QA: the multi-Part example returned 19 Parts; the Chapter example returned 6 non-empty, valid intervals.
- [x] Real stdio discovery reports server version `1.7.0` and all 8 tools in stable order.

## Security And Privacy

- [x] No Cookie, token, `.env` content, subtitle body, Chapter title, or raw player response is logged.
- [x] New external fields are validated or bounded before output (page/range validated; chapter titles bounded to 500 chars; max 200 chapters).
- [x] Source and test files pass scoped secret scan — zero hard-coded credential values.

## Result

- Overall result: READY — all automated gates pass, subagent reviews applied
- Blocking issues: none
- Non-blocking caveats: Bilibili consumer endpoints are not a public stable contract.
- Codemap update status: updated (navigation, chapters, request-count tests)
- Research: `docs/research/2026-07-20-feature-opportunities.md`

## Subagent Reviews

- **test-baseline-builder**: 2 critical gaps found → fixed (resolvePartCid default CID + ValidationError tests added to navigation.test.ts)
- **package-maintainer**: No issues found. Lockfile synced, no dependency drift, pack contents correct.
- **risk-reviewer**: 1 medium risk found → fixed (`getPlayerData` now includes auth headers + buvid fingerprint)
- **release-verifier**: All 8 gates PASSED
