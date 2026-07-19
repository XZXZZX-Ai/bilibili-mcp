# Codex To Claude Handoff: Empty Transcript Credential Detection

## Objective

Implement GitHub Issue #3 so `getVideoTranscriptData` verifies login status when Bilibili returns an empty subtitle list and propagates `COOKIE_EXPIRED` before any description fallback.

Issue: https://github.com/XZXZZX-Ai/bilibili-mcp/issues/3

## Current State

- README and changelogs promise that empty subtitle results trigger login verification and that Cookie expiration never silently falls back.
- `getVideoInfoWithSubtitle` already implements that policy inline.
- `getVideoTranscriptData` skips `checkLoginStatus`; with `fallbackToDescription=true`, it returns description for a logged-out empty list.
- Codex added a focused regression test to `tests/bilibili-transcript.test.ts`.
- Red command:

```powershell
npm test -- tests/bilibili-transcript.test.ts -t "checks login status when an empty subtitle list would otherwise fall back"
```

- Current red result: the promise resolves with `data_source: "description"` instead of rejecting with `{ code: "COOKIE_EXPIRED" }`; 1 test fails in about 9ms.
- The worktree contains unrelated uncommitted Issue #2 HTTP-throttling and harness changes. Preserve them.

## Files To Inspect

- `AGENTS.md`
- `CLAUDE.md`
- `docs/agent-memory/active-work.md`
- `README.md` lines 123-143
- `CHANGELOG.md` lines 70-76
- `src/bilibili/subtitle.ts`
- `tests/bilibili-transcript.test.ts`

## Files To Edit

- `src/bilibili/subtitle.ts`
- `tests/bilibili-transcript.test.ts`
- `docs/agent-memory/handoffs/2026-07-19-empty-transcript-credentials-claude-report.md`

Do not edit other files unless a required check proves one is necessary; stop and report first.

## Required Capability

- Use `diagnosing-bugs`: run the provided red test before editing and preserve the exact resolved-instead-of-rejected symptom.
- Use `vitest` for the focused regression and existing branch coverage.
- Use `codebase-design` to keep the credential policy behind one private in-process helper. Do not create an exported interface, adapter, class, or new module.
- Invoke the single `test-baseline-builder` subagent once for the focused test review. If it does not return promptly, record that and continue at top level; do not wait indefinitely or create a subagent tree.
- Before reporting acceptance, invoke `risk-reviewer` once for a read-only review of the scoped source/test diff, with the same bounded fallback if it stalls.
- `product-requirements` is intentionally not used: README/CHANGELOG already define the public behavior and this task restores it.
- Do not use any `superpowers:*` skill.

## Constraints

- Add the minimum private helper needed to verify login for an empty subtitle list and throw the existing safe `COOKIE_EXPIRED` error.
- Reuse the helper from both public functions; do not duplicate a second credential policy.
- Preserve the existing error message/code/details and safe credential next-step wording from `getVideoInfoWithSubtitle`.
- Preserve logged-in behavior, fallback flag behavior, cache behavior, language selection, subtitle-body behavior, response shapes, logging destinations, and public exports.
- Do not refactor description result construction or move code to another module.
- Preserve all unrelated dirty worktree changes.
- Do not commit, push, close Issues, create a pull request, tag, publish, or edit generated `dist/` files.

## Execution Steps

1. Read project instructions, Issue #3, this handoff, and inspect `git status --short`.
2. Run the exact focused command and confirm the red resolved-instead-of-rejected symptom.
3. Ensure the test default mocks a logged-in status so existing legitimate empty-list tests retain their behavior.
4. Add one private helper in `subtitle.ts` containing the existing empty-list login warning, `checkLoginStatus` call, and safe `COOKIE_EXPIRED` throw.
5. Call it in `getVideoTranscriptData` before fallback/`NoSubtitleError`, and replace the inline login-verification block in `getVideoInfoWithSubtitle` with the same helper.
6. Run the focused test, the full transcript file, full suite, build, and diff checks.
7. Perform the required focused risk review and write the Claude report.

## Verification Commands

```powershell
npm test -- tests/bilibili-transcript.test.ts -t "checks login status when an empty subtitle list would otherwise fall back"
npm test -- tests/bilibili-transcript.test.ts
npm test
npm run build
git diff --check
git diff -- src/bilibili/subtitle.ts tests/bilibili-transcript.test.ts
```

Also confirm no `[DEBUG-` instrumentation, new export, or unrelated source/test file was added.

## Acceptance Criteria

- Logged-out empty list throws `COOKIE_EXPIRED` even with fallback enabled.
- Logged-in empty list still returns description with fallback enabled and throws `NoSubtitleError` when disabled.
- Both public functions use one private login-verification implementation.
- Existing direct `COOKIE_EXPIRED` propagation, cache behavior, response shapes, and exports remain unchanged.
- Focused, transcript, full, build, and diff checks pass.
- Risk review finds no unaddressed credential, behavior, cache, or regression issue.
- Only the scoped source/test files plus the report are changed by this task.

## Things Not To Change

- Description fallback construction, cache decisions, language matching, subtitle-body limits, metadata, tool schemas/handlers, README/changelogs, HTTP throttling, package metadata, hooks, or workflow rules.

## Stop And Report If

- The red test does not reproduce the documented failure.
- Preserving the policy requires a cache, schema, response-shape, or cross-module change.
- Existing logged-in fallback behavior cannot remain unchanged.
- A real credential or secret is found.
- An unrelated existing test fails and the cause is unclear.

## Expected Claude Report

Write `docs/agent-memory/handoffs/2026-07-19-empty-transcript-credentials-claude-report.md` using `docs/agent-memory/agent-communication.md`. Include red-before-green evidence, exact commands/results, the private-helper design, subagent/risk-review results or timeout caveats, scoped diff summary, and the full `Harness Artifacts` section.
