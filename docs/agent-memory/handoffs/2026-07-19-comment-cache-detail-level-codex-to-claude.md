# Codex To Claude Handoff: Comment Cache Detail Level

## Update Goal

Implement GitHub Issue #5: https://github.com/XZXZZX-Ai/bilibili-mcp/issues/5

Prevent comment-result cache collisions between `brief` and `detailed` calls when both use the same explicit `limit`.

## Current Judgment

Codex added a deterministic red regression to `tests/bilibili-comments-tool.test.ts`. It calls `getVideoCommentsData` twice with the same BVID, `limit: 5`, and `includeReplies: true`, changing only `detailLevel` from `brief` to `detailed`.

Current behavior returns the cached brief result for the detailed call: 1 comment instead of 4. The direct cause is `cacheDetail = limit !== undefined ? \`limit-${limit}\` : detailLevel`, which discards `detailLevel` whenever `limit` exists.

## Recommended Approach

Make the smallest change in `getVideoCommentsData`: include `detailLevel` as its own cache-key component while preserving the existing `cacheDetail`, sort, and includeReplies components. This should be a one-line source change. Do not redesign `CacheManager`.

## Files To Inspect

- `C:/Users/ZX/bilibili-mcp/src/bilibili/comments.ts`
- `C:/Users/ZX/bilibili-mcp/tests/bilibili-comments-tool.test.ts`
- `C:/Users/ZX/bilibili-mcp/src/utils/cache.ts`
- `C:/Users/ZX/bilibili-mcp/src/server/tool-handlers.ts`
- `C:/Users/ZX/bilibili-mcp/docs/agent-memory/codemap.md`

## Files To Edit

- Expected: `C:/Users/ZX/bilibili-mcp/src/bilibili/comments.ts`
- Edit the Codex-authored regression only if a correctness problem is demonstrated.
- Write the report to `C:/Users/ZX/bilibili-mcp/docs/agent-memory/handoffs/2026-07-19-comment-cache-detail-level-claude-report.md`.

## Required Capability

- Use the installed `vitest` skill.
- Use the project `test-baseline-builder` subagent for a bounded assessment of the regression.
- Use the project `risk-reviewer` subagent after the fix for a bounded cache/behavior review.
- If either subagent is unavailable or stalls, finish the same bounded task at the top level and record that fact. Do not start an agent tree.
- `product-requirements` is not needed because this is a scoped correctness bug with no new public behavior.
- `codebase-design` is not needed because no interface, seam, or adapter changes.
- Do not use Superpowers skills.

## Constraints

- Preserve comment API arguments, sorting, reply inclusion, response shapes, and identical-options cache hits.
- Do not change cache TTLs, cache capacity, or `CacheManager`.
- Keep the test deterministic and network-free.
- Do not modify generated `dist/` output.
- Preserve all unrelated dirty-worktree changes, including Issues #2-#4.
- Do not stage, commit, or push.

## Claude Code Execution Steps

1. Read this handoff, AGENTS.md, CLAUDE.md, and the listed source/test files.
2. Run the focused regression before editing and confirm the expected 1-versus-4 failure.
3. Perform the bounded test assessment.
4. Add `detailLevel` to the existing comment cache-key inputs with the smallest source diff.
5. Run the focused test, full comments test file, full suite, build, and diff check.
6. Run the bounded risk review and address only same-scope findings.
7. Check `codemap.md`; it should remain unchanged unless navigation or ownership changed.
8. Write the required Markdown report.

## Verification Commands

```powershell
$env:PATH='D:\Node24;' + $env:PATH
npm test -- --run tests/bilibili-comments-tool.test.ts -t "does not share cached results between brief and detailed modes with the same limit"
npm test -- --run tests/bilibili-comments-tool.test.ts
npm test
npm run build
git diff --check
```

## Acceptance Criteria

- Brief and detailed calls with the same explicit limit do not share cache entries.
- The detailed call returns the child replies and invokes the comments API a second time.
- Identical option sets still reuse the cache.
- Existing positional and options APIs remain unchanged.
- All required checks pass.
- No dependency, public schema, secret, commit, or push changes.

## Things To Avoid

- Do not disable comment caching.
- Do not create a cache-options object or new helper.
- Do not alter reply processing or sorting.
- Do not broaden into comment API fallback changes.
- Do not touch unrelated tests or documentation.

## Risks

- Omitting another output-affecting option would leave a sibling collision.
- Replacing rather than extending the key could accidentally remove existing separation by limit, sort, or includeReplies.
- Existing dirty changes must not be reverted.

Rollback is the single cache-key argument change; preserve the red-capable regression unless it is proven invalid.

## Stop And Report If

- The red failure cannot be reproduced.
- The fix requires a public response or schema change.
- The task requires changing `CacheManager` or broader comment architecture.
- A required check fails for an unrelated reason.
- A real secret is discovered.

## Expected Claude Report

Use the repository report template and include files changed, commands/results, capabilities used, diff notes, risks/skips, the complete `Harness Artifacts` section, decision points, and suggested Codex review focus.
