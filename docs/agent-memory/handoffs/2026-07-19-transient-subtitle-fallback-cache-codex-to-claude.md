# Codex To Claude Handoff: Transient Subtitle Fallback Cache

## Update Goal

Implement GitHub Issue #4: https://github.com/XZXZZX-Ai/bilibili-mcp/issues/4

Ensure a temporary, non-`COOKIE_EXPIRED` subtitle retrieval failure can return the existing description fallback without caching that fallback and preventing a later subtitle retry.

## Current Judgment

Codex added a deterministic red regression in `tests/bilibili-transcript.test.ts`. The first call receives a temporary subtitle error and returns `data_source: "description"`; the second call uses the same BVID and has a successful mocked subtitle response. Current code returns `description` again because the catch branch in `getVideoInfoWithSubtitle` caches its fallback.

The focused failure is:

```text
expected second result data_source "subtitle", received "description"
```

The direct cause is the `cacheManager.setVideoInfo(cacheKey, result)` call in the general subtitle-error catch branch. The adjacent comment incorrectly describes this fallback as a successful subtitle result.

## Recommended Approach

Make the smallest source change: do not cache the description fallback created by a transient/general subtitle retrieval error. Keep successful subtitle results cached. Align the branch comment/logging with the existing no-subtitle branches if clarification is useful, without extracting new helpers or changing interfaces.

## Files To Inspect

- `C:/Users/ZX/bilibili-mcp/src/bilibili/subtitle.ts`
- `C:/Users/ZX/bilibili-mcp/tests/bilibili-transcript.test.ts`
- `C:/Users/ZX/bilibili-mcp/src/utils/cache.ts`
- `C:/Users/ZX/bilibili-mcp/docs/agent-memory/codemap.md`

## Files To Edit

- Expected: `C:/Users/ZX/bilibili-mcp/src/bilibili/subtitle.ts`
- Edit the existing regression test only if a correctness issue in the test is demonstrated.
- Write the report to `C:/Users/ZX/bilibili-mcp/docs/agent-memory/handoffs/2026-07-19-transient-subtitle-fallback-cache-claude-report.md`.

## Required Capability

- Use the installed `vitest` skill for the regression and test verification.
- Use the project `test-baseline-builder` Claude Code subagent for a bounded assessment of the red test and minimal fix.
- After implementation, use the project `risk-reviewer` subagent for a bounded review of shared subtitle behavior.
- If either subagent is unavailable or stalls, continue the same bounded task at the top level and record that fact; do not start an agent tree.
- `codebase-design` is intentionally not required because the expected fix does not change a module interface, seam, or adapter boundary.
- Do not use Superpowers skills.

## Constraints

- Preserve `COOKIE_EXPIRED` propagation.
- Preserve successful subtitle caching.
- Preserve all MCP tool names, schemas, and response shapes.
- Keep tests deterministic and network-free; do not use real Cookies or credentials.
- Do not refactor `src/bilibili/client.ts` or introduce new abstractions.
- Do not edit generated `dist/` output.
- Do not modify, revert, stage, or commit unrelated dirty-worktree changes.
- Do not commit or push.

## Claude Code Execution Steps

1. Read this handoff, Issue #4 context above, and the relevant source/test/cache files.
2. Run the focused test before editing and confirm the expected red failure.
3. Review the regression with `test-baseline-builder` or record a bounded fallback if unavailable.
4. Remove only the erroneous caching of the general-error description fallback and correct the misleading local comment if needed.
5. Run the focused test, the full transcript test file, the full suite, build, and diff check.
6. Run a bounded `risk-reviewer` review; address only same-scope findings.
7. Check whether `docs/agent-memory/codemap.md` became stale. It should normally remain unchanged for this local behavior fix.
8. Write the required Markdown report.

## Verification Commands

```powershell
$env:PATH='D:\Node24;' + $env:PATH
npm test -- --run tests/bilibili-transcript.test.ts -t "retries subtitle retrieval after a temporary error fallback"
npm test -- --run tests/bilibili-transcript.test.ts
npm test
npm run build
git diff --check
```

## Acceptance Criteria

- The first call in the regression still returns the description fallback.
- The second call retries `getVideoSubtitle`, returns subtitle data, and the mock is called twice.
- Successful subtitle results remain cacheable.
- `COOKIE_EXPIRED` still propagates.
- Focused tests, full tests, build, and `git diff --check` pass.
- No secrets, network fixtures, public response changes, commits, or pushes are introduced.

## Things To Avoid

- Do not disable caching globally.
- Do not change cache TTLs or cache-key generation.
- Do not change fallback response fields.
- Do not broaden this into subtitle architecture cleanup.
- Do not rewrite nearby Chinese documentation or unrelated tests.

## Risks

- Removing the wrong cache write could disable successful subtitle caching.
- A test that does not clear the singleton cache could become order-dependent.
- Broad edits could collide with the already-present Issue #3 changes in the same source/test files.

Rollback is limited to the one catch-branch source edit; preserve the Codex-authored regression for diagnosis unless it is proven invalid.

## Stop And Report If

- The fix requires changing a public MCP response shape or tool behavior beyond retry timing.
- The focused red failure cannot be reproduced.
- The existing Issue #3 changes must be rewritten or reverted.
- A real credential or secret appears.
- Required verification fails for reasons outside this task.

## Expected Claude Report

Use the repository report template and include:

- files changed
- commands run and exact pass/fail results
- subagents/skills used and their conclusions
- diff notes
- unresolved risks or skipped checks
- a `Harness Artifacts` section covering Issue #4 as the task ticket, research note, QA checklist, codemap, harness-security, and harness-eval status
- decision points, if any
- suggested Codex review focus
