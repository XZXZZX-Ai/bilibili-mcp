# Codex To Claude Handoff: Stdio Smoke Readiness

## Update Goal

Implement GitHub Issue #7: https://github.com/XZXZZX-Ai/bilibili-mcp/issues/7

Remove the fixed-delay race from the MCP stdio startup smoke test.

## Current Judgment

The production server is not failing to start. The test sleeps exactly 300ms, kills the process, and then reads stderr. Codex reproduced the empty-stderr failure on iteration 6 of a focused loop. A direct 20-process probe found all 20 reached the expected startup message, but 5 took longer than 300ms and the maximum was 453ms.

The root cause is the test guessing readiness from elapsed time instead of waiting for the observable stderr event.

## Recommended Approach

In the existing test, wait until accumulated stderr contains `Bilibili MCP server running on stdio`, with a bounded timeout and rejection on spawn error or premature exit. Use Node's existing child-process/events APIs. In cleanup, kill the child and await `close` so no process or stream outlives the test. Keep the stdout-empty assertion.

Do not merely increase the sleep duration.

## Files To Inspect

- `C:/Users/ZX/bilibili-mcp/tests/mcp-server-smoke.test.ts`
- `C:/Users/ZX/bilibili-mcp/src/index.ts`
- `C:/Users/ZX/bilibili-mcp/package.json`
- `C:/Users/ZX/bilibili-mcp/docs/agent-memory/codemap.md`

## Files To Edit

- Expected: `C:/Users/ZX/bilibili-mcp/tests/mcp-server-smoke.test.ts`
- Write the report to `C:/Users/ZX/bilibili-mcp/docs/agent-memory/handoffs/2026-07-19-stdio-smoke-readiness-claude-report.md`.

## Required Capability

- Use `diagnosing-bugs` and preserve the existing red-capable loop evidence.
- Use the installed `vitest` skill.
- Use the project `test-baseline-builder` subagent for a bounded test-design review.
- Use the project `risk-reviewer` after editing for child-process cleanup, timeout, stdout cleanliness, and scope review.
- If a subagent stalls, complete the same bounded review at top level and record it. Do not create an agent tree.
- No `product-requirements`, `system-design`, or `codebase-design` is needed.
- Do not use Superpowers skills.

## Constraints

- Change only the test; production stdio behavior is correct.
- Preserve the exact startup-message and empty-stdout assertions.
- Use an event-driven readiness condition with a finite timeout.
- Ensure timers/listeners/processes are cleaned up on success and failure.
- Do not add dependencies, helpers for hypothetical reuse, or arbitrary retries.
- Do not modify generated `dist/` files directly.
- Preserve unrelated dirty-worktree changes.
- Do not stage, commit, or push.

## Claude Code Execution Steps

1. Read the handoff and listed files.
2. Re-run the focused test loop or use the recorded Codex evidence to confirm the exact failure.
3. Run the bounded test-design review.
4. Replace the fixed 300ms wait with the smallest event-driven readiness wait and reliable cleanup.
5. Run the focused test once, the 20-run loop, the full smoke file, full suite, build, and diff check.
6. Search the edited test for remaining fixed readiness sleeps and debug markers.
7. Run the bounded risk review and address only same-scope findings.
8. Check `codemap.md`; it should remain unchanged unless test ownership/layout changes.
9. Write the required report.

## Verification Commands

```powershell
$env:PATH='D:\Node24;' + $env:PATH
npm test -- --run tests/mcp-server-smoke.test.ts -t "starts the built stdio server and logs startup to stderr"
npm test -- --run tests/mcp-server-smoke.test.ts
npm test
npm run build
git diff --check
```

Original-loop verification:

```powershell
for ($i = 1; $i -le 20; $i++) {
  npm test -- --run tests/mcp-server-smoke.test.ts -t "starts the built stdio server and logs startup to stderr" --reporter=dot
  if ($LASTEXITCODE -ne 0) { throw "focused smoke failed at iteration $i" }
}
```

## Acceptance Criteria

- The test waits for the actual stderr startup signal, not a fixed sleep.
- Timeout, spawn error, and premature exit produce bounded actionable failure.
- Child process closure is awaited in cleanup.
- Startup stderr assertion and empty stdout assertion remain.
- Focused test, 20-run loop, smoke file, full suite, build, and diff check pass.
- No production source, public MCP behavior, dependency, secret, commit, or push changes.

## Things To Avoid

- Do not change 300ms to a larger arbitrary delay.
- Do not add retry-on-failure to hide the race.
- Do not weaken or remove stdout cleanliness verification.
- Do not change server startup logging.
- Do not create a generic child-process test framework.

## Risks

- Resolving on the first stderr chunk without matching the target message can create a different race.
- Failure paths can leave a child process or timeout running.
- Waiting for `close` after registering too late can miss the event.
- An unbounded readiness promise can hang the suite.

## Stop And Report If

- The failure cannot be reproduced or evidence points to production startup failure.
- The fix requires changing `src/index.ts` or public behavior.
- The child cannot be cleaned up reliably with Node standard APIs.
- Required verification fails for a new unrelated reason.
- A secret is discovered.

## Expected Claude Report

Use the repository report template. Include exact test change, original red evidence, commands/results including all 20 loop iterations, capabilities used, cleanup/timeout review, risks/skips, complete Harness Artifacts, and suggested Codex review focus.
