# Codex To Claude Handoff: Transcript Keyword Search

## Objective

Implement `docs/transcript-keyword-search-prd.md` as a backward-compatible extension of `get_video_transcript`.

## Current State

- The tool already supports language, Part, timestamps, and Transcript Range filtering.
- `getVideoTranscriptData` fetches timed Subtitle Segments and currently exposes a seven-argument interface.
- Public tool count is eight; do not add a ninth tool.
- The research note at `docs/research/2026-07-20-bilibili-mcp-feature-opportunities.md` selected this feature because it reuses existing subtitle/cache/request paths.
- Pre-existing worktree state includes the generated `pending-learning-proposals.md` date change and a stat-only README observation; preserve user/runtime state and do not revert it.

## Recommended Interface

- Add optional public fields: `query`, `max_matches`, `context_segments`.
- Avoid adding three more positional parameters. Add one optional internal search-options object at the end of `getVideoTranscriptData`, preserving every existing call.
- Keep exact search/filter implementation private to the subtitle module; do not add an adapter, class, dependency, or parallel fetch path.
- Use the canonical `Transcript Match` and `Transcript Context` terms from `CONTEXT.md`.

## Required Behavior

- Follow every requirement and exclusion in the PRD.
- Range-filter Subtitle Segments first, then find case-insensitive literal matches.
- Count matching Subtitle Segments, not occurrences.
- Default `max_matches=10`, `context_segments=1`; validate bounds 1-20 and 0-5.
- Return matches chronologically. Each match includes hit time/content and timestamped bounded context.
- Search mode returns compact transcript text derived only from returned contexts plus query/count/truncation/matches metadata.
- Query search is incompatible with description fallback and must never search a description.
- No-query behavior and request counts remain unchanged.

## Execution Steps

1. Read the PRD, ticket, `CONTEXT.md`, current transcript flow, and existing tests.
2. Use `test-baseline-builder` and Vitest to add failing schema, validation, handler, matching/context, compatibility, and request-count tests first.
3. Implement the smallest private search helper and one optional internal options object.
4. Update bilingual README feature/tool/example sections and add bilingual `Unreleased` changelog entries. Update current test counts only after the final full run.
5. Update the codemap and concise durable project memory because public transcript semantics changed.
6. Run a bounded `risk-reviewer` focused on compatibility, output size, validation, credential/fallback behavior, and secret leakage.
7. Write `docs/agent-memory/handoffs/2026-07-20-transcript-keyword-search-claude-report.md` using the repository report template.

## Things To Avoid

- No semantic search, fuzzy matching, regex, normalization library, ranking, cross-Part search, new tool, endpoint, request, dependency, or version/release change.
- Do not mutate, stage, or revert unrelated worktree files.
- Do not commit, push, tag, publish, or create/close remote objects.
- Do not print Cookies, tokens, `.env` content, or private credentials.
- Do not use Superpowers.

## Verification Commands

```bash
npx vitest run tests/bilibili-transcript.test.ts tests/server-tools.test.ts tests/validation.test.ts tests/server-handler-sanitization.test.ts
npm test
npm run build
npx vitest run tests/mcp-server-smoke.test.ts
npm pack --dry-run --json
git diff --check
```

Also verify strict UTF-8, eight-tool stdio discovery, compiled server version, unchanged package/lock versions, no added-content high-confidence secret patterns, and no extra Bilibili request in search mode.

## Expected Claude Report

List files changed, failing-first evidence, exact command results, skipped checks, subagents/capabilities used, `Harness Artifacts`, codemap status, risks, and suggested Codex review focus.
