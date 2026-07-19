# Codex To Claude Handoff: Concurrent HTTP Throttling

## Objective

Implement GitHub Issue #2 so concurrent `throttledFetch` calls start at least one configured rate-limit interval apart.

Issue: https://github.com/XZXZZX-Ai/bilibili-mcp/issues/2

## Current State

- `src/bilibili/http.ts` stores a global `pendingPromise` that represents only `waitForRateLimit()`.
- Concurrent callers can await the same old promise, then create separate waits that finish together.
- Codex created `tests/.tmp-http-throttle-repro.test.ts` as a temporary red-capable harness.
- `npm test -- tests/.tmp-http-throttle-repro.test.ts` fails deterministically: the minimum start gap was about `0.155ms`, below the `400ms` threshold for the configured `500ms` interval.
- The worktree already contains unrelated uncommitted harness/documentation changes. Preserve them.

## Files To Inspect

- `AGENTS.md`
- `CLAUDE.md`
- `docs/agent-memory/active-work.md`
- `docs/agent-memory/project-facts.md`
- `docs/agent-memory/decisions.md`
- `src/bilibili/http.ts`
- `tests/.tmp-http-throttle-repro.test.ts`
- `tests/bilibili-video-api.test.ts` for local Vitest style only

## Files To Edit

- `src/bilibili/http.ts`
- Replace the temporary repro with `tests/bilibili-http.test.ts`
- `docs/agent-memory/handoffs/2026-07-19-http-throttling-claude-report.md`

Do not edit other files unless a required check proves one is necessary; stop and report first.

## Required Capability

- Use the installed `diagnosing-bugs` skill: run the existing red repro before the fix and preserve the exact symptom.
- Use the installed `vitest` skill for one deterministic direct regression test.
- Use `codebase-design` only to keep the `throttledFetch` interface stable and the request-admission implementation local; do not introduce a new exported interface or adapter.
- Use the project `test-baseline-builder` subagent for the focused Vitest change. Do not create a subagent tree.
- Do not use any `superpowers:*` skill.

## Constraints

- Apply the smallest root-cause fix. A promise chain/queue inside `http.ts` is preferred over a class, dependency, new module, or configuration.
- Serialize request starts, not full response completion; admitted request bodies may overlap.
- A rejected or aborted request must not poison the admission chain.
- Preserve timeout, retry, error mapping, logging, exports, MCP tools, schemas, and response shapes.
- Preserve all unrelated dirty worktree changes.
- Do not commit, push, close the issue, create a pull request, tag, publish, or edit generated `dist/` files.
- Do not add dependencies.

## Execution Steps

1. Read the required project instructions and inspect `git status --short`.
2. Run `npm test -- tests/.tmp-http-throttle-repro.test.ts` and confirm the current failure is the near-zero second start gap.
3. Convert the temporary repro into `tests/bilibili-http.test.ts`. Use Vitest fake timers or another deterministic fast clock so the test does not add a real one-second delay.
4. Run the formal test before the production fix and confirm it fails for the same batching behavior.
5. Replace `pendingPromise` with the minimum internal admission chain needed to serialize request starts.
6. Run the focused test, full suite, and build.
7. Inspect the scoped diff and write the required Claude report.

## Verification Commands

```powershell
npm test -- tests/bilibili-http.test.ts
npm test
npm run build
git diff --check
git diff -- src/bilibili/http.ts tests/bilibili-http.test.ts
```

Also confirm `tests/.tmp-http-throttle-repro.test.ts` no longer exists and no `[DEBUG-` instrumentation remains.

## Acceptance Criteria

- Three simultaneous calls start one-by-one at the configured interval under a deterministic fast test.
- Request callbacks may overlap after admission.
- Failure or abort cannot leave later calls blocked.
- `throttledFetch` and all other exports remain compatible.
- Focused Vitest, full Vitest, build, and diff checks pass.
- Only the scoped source/test files plus the Claude report are changed by this task.
- The report says the codemap was checked and left unchanged because module ownership did not change.

## Things Not To Change

- WBI/plain request consolidation.
- `checkLoginStatus`, retry policy, timeout policy, Bilibili error mapping, public MCP behavior, documentation, package metadata, hooks, or workflow rules.
- Existing unrelated uncommitted files.

## Stop And Report If

- The formal red test cannot reproduce the near-zero concurrent start gap.
- The fix requires serializing full responses rather than only starts.
- Timeout/retry/error semantics must change.
- A new exported interface, dependency, module, or additional production file appears necessary.
- An unrelated existing test fails and the cause is unclear.

## Expected Claude Report

Write `docs/agent-memory/handoffs/2026-07-19-http-throttling-claude-report.md` using the template in `docs/agent-memory/agent-communication.md`. Include the red-before-green evidence, exact commands/results, scoped diff summary, subagent result, unresolved risks, and the full `Harness Artifacts` section.
