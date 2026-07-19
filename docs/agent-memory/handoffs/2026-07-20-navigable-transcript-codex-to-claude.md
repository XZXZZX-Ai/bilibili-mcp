# Codex To Claude Handoff: Navigable Transcript

## Objective

Implement `docs/navigable-transcript-prd.md` completely: timestamped/range transcript reads, multi-Part selection, and Bilibili-provided Chapters, then prepare version `1.7.0` for Codex-owned commit and push.

## Current State

- `master` is at `92d32a3`; source version is `1.6.5`, not published to npm.
- Existing transcript code fetches Subtitle Segments but merges away `from/to` and always uses top-level `cid`.
- Video view responses can contain `pages`; player v2 can contain `view_points`.
- `docs/research/2026-07-20-feature-opportunities.md`, `CONTEXT.md`, and ADR 0001 define the evidence and vocabulary.
- `docs/agent-memory/pending-learning-proposals.md` is a pre-existing generated modification and must remain untouched/uncommitted.

## Files To Inspect

- PRD, ticket, research note, `CONTEXT.md`, ADR 0001
- `src/server/`, `src/bilibili/`, validation/error/cache utilities
- transcript, metadata, video API, MCP schema/handler/smoke tests
- README/changelog/package/codemap/QA files

## Required Capability

- Use `domain-modeling` vocabulary exactly: Video, Part, Subtitle Segment, Transcript Range, Chapter.
- Use `codebase-design` to place one shared Part-resolution seam; do not add hypothetical adapters or abstractions.
- Use `vitest`; name/use `test-baseline-builder` for failing-first public behavior coverage.
- Use/name `package-maintainer` for `1.7.0`, lockfile, and pack contents.
- Use/name `risk-reviewer` for MCP/API/credential/backward-compatibility review.
- Use/name `release-verifier` before reporting completion.
- Use `secret-scanning` for intended changes and package contents without printing matched secret values.
- Do not use `system-design` or any `superpowers:*` skill.

## Constraints

- Implement the full PRD; do not silently narrow one of the three features.
- Preserve default tool behavior, structured errors, Cookie handling, retry/timeout/rate-limit rules, cache correctness, stdio cleanliness, and default server export.
- No new dependency, batch crawling, search, inferred Chapters, generated `dist/`, workflow change, commit, tag, push, publish, release, or PR.
- Chapter and subtitle content are untrusted external data; bound output and never log bodies/titles/raw responses.
- Use clean UTF-8 and verify it explicitly.

## Execution Steps

1. Add failing tests for PRD acceptance criteria at public module/handler interfaces.
2. Introduce the smallest shared Part-resolution module and update Bilibili-facing types defensively.
3. Implement transcript page/range/timestamp behavior and page-aware video info/cache keys.
4. Add metadata Part summaries and raw/data Chapter retrieval.
5. Register/handle `get_video_chapters` and validate every new input.
6. Update tests, README/README_EN, changelogs, package version/lockfile, codemap, and QA checklist.
7. Run focused tests, full build/test, production audit, pack dry-run, stdio smoke, diff/UTF-8/secret scans, and required subagent reviews.
8. Write `docs/agent-memory/handoffs/2026-07-20-navigable-transcript-claude-report.md` using the required template and Harness Artifacts section.

## Acceptance Criteria

All PRD and ticket checkboxes are satisfied with command evidence; package source is `1.7.0`; no release/Git mutation occurs.

## Stop And Report If

Any PRD requirement cannot be met without a new dependency, breaking default behavior, broad architecture change, or unauthorized external/Git action.
