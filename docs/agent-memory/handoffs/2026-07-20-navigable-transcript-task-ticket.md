# Task Ticket: Navigable Transcript

## Ticket

- ID: local-2026-07-20-navigable-transcript
- Title: Add timed ranges, multi-Part selection, and Bilibili Chapters
- Status: `done`
- Owner: `Claude Code`
- Source: User-approved top three feature opportunities
- Parent PRD: `docs/navigable-transcript-prd.md`

## Objective

Implement all three PRD capabilities as compatible public MCP behavior, prepare version `1.7.0`, and return a fully verified report for Codex commit/push review.

## Scope

In scope:

- Shared one-based Part/page resolution and normalized page metadata.
- Timed/range transcript options on `get_video_transcript`.
- Part selection on transcript and video-info tools.
- New `get_video_chapters` tool.
- Types, validation, tests, README/changelog, package metadata, codemap, and QA evidence.

Out of scope:

- Search, batch crawling, inferred Chapters, danmaku, recommendations, writes, new dependencies, tag, npm publish, release, or PR.

## Expected Files

- `src/bilibili/types.ts`, `video-api.ts`, `subtitle.ts`, `metadata.ts`
- One focused navigation module if it earns reuse across callers
- `src/utils/validation.ts`
- `src/server/tool-schemas.ts`, `tool-handlers.ts`
- Focused existing/new tests
- `README.md`, `README_EN.md`, changelogs, package files
- `docs/agent-memory/codemap.md`, QA checklist, Claude report

Do not touch `docs/agent-memory/pending-learning-proposals.md`, credentials, hooks, workflow YAML, or generated `dist/`.

## Required Capabilities

- Skills: `domain-modeling`, `codebase-design`, `vitest`, `secret-scanning`
- Subagents: `test-baseline-builder`, `package-maintainer`, `risk-reviewer`, `release-verifier`
- CLI: npm/node/tsc/vitest/git diff and pack checks
- Deliberately skipped: `system-design`, because runtime/deployment shape is unchanged and the codebase module seam is sufficient.

## Acceptance Criteria

- [x] Every functional and compatibility requirement in the PRD is implemented.
- [x] No new dependency or extra default-flow request is introduced.
- [x] Tool list contains 8 tools in documented order.
- [x] New inputs are validated before player/subtitle requests.
- [x] Build, full tests, production audit, package dry-run, diff, UTF-8, and secret checks pass.
- [x] Public docs, version `1.7.0`, codemap, and QA evidence are accurate.
- [x] No commit, tag, push, publish, release, or PR is performed by Claude Code.

## Stop And Report Conditions

Stop on a required architecture/product decision outside the PRD, a real secret, need for a new dependency, an incompatible default behavior, unexplained verification failure, or edits outside scope.
