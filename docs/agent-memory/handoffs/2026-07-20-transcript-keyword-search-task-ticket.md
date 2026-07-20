# Task Ticket: Transcript Keyword Search

- ID: TRANSCRIPT-SEARCH-P0
- Status: `done`
- Owner: `Claude Code` implementation, `Codex` review and bounded repair
- Source: User-approved P0 feature and `docs/transcript-keyword-search-prd.md`

## Objective

Implement backward-compatible, bounded keyword location inside `get_video_transcript`.

## Scope

In scope:

- Public transcript input schema, validation, subtitle search logic, typed response, deterministic tests, bilingual docs/changelog, codemap, and project memory.

Out of scope:

- New MCP tool, new external endpoint/dependency, semantic search, version bump, commit, push, tag, publish, or GitHub Release.

## Files To Inspect Or Edit

Expected edit: `src/server/tool-schemas.ts`, `src/server/tool-handlers.ts`, `src/bilibili/subtitle.ts`, `src/bilibili/types.ts`, `src/utils/validation.ts`, focused tests, `README.md`, `README_EN.md`, `CHANGELOG.md`, `CHANGELOG_EN.md`, and directly relevant agent-memory files.

Do not touch: `docs/agent-memory/pending-learning-proposals.md`, unrelated runtime/config/workflow files, package version, dependencies, credentials, or generated `dist/`.

## Required Capabilities

- `vitest`; Claude Code `test-baseline-builder` for failing-first coverage.
- `codebase-design` for the existing transcript module interface.
- `domain-modeling` vocabulary from `CONTEXT.md`.
- `risk-reviewer` after implementation.

## Acceptance Criteria

- [x] The PRD's complete MVP behavior is implemented without a ninth tool or extra request.
- [x] Existing no-query behavior remains backward-compatible.
- [x] Trust-boundary validation returns structured `VALIDATION_ERROR` payloads.
- [x] Focused and full verification gates pass.
- [x] Documentation and durable project records are current.
- [x] No Git or release operation is performed.

## Verification

```bash
npx vitest run tests/bilibili-transcript.test.ts tests/server-tools.test.ts tests/validation.test.ts tests/server-handler-sanitization.test.ts
npm test
npm run build
npx vitest run tests/mcp-server-smoke.test.ts
npm pack --dry-run --json
git diff --check
```

## Stop And Report Conditions

Stop if the PRD requires a new endpoint/dependency/tool, breaks no-query compatibility, exposes credentials, or needs a product decision beyond the specified literal-search MVP.

## Completion Note

Completed on 2026-07-20. Codex independently verified 154 focused tests, 286 full-suite tests, TypeScript build, MCP smoke, a 124-file package dry run, strict UTF-8 decoding, high-confidence secret scanning, and `git diff --check`. No live Bilibili request or Git/release action was performed.
