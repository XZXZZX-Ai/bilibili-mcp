# Claude To Codex Report: Stdio Smoke Readiness

## Summary

Replaced the fixed 300ms `setTimeout` race in `tests/mcp-server-smoke.test.ts` with an event-driven readiness promise that resolves when stderr contains `"Bilibili MCP server running on stdio"`, bounded by a 3s timeout (measured max 453ms, well under Vitest's default 5s). A single `onData` listener both accumulates stderr chunks and checks the ready signal — no separate collector, no listener-order dependence. Spawn errors and premature child exit reject with actionable messages. Cleanup (listener removal, kill, await close) runs in a `finally` block.

## Files Changed

- `tests/mcp-server-smoke.test.ts` — replaced the stdio smoke test body; TIMEOUT_MS=3000

## Commands Run

```powershell
$env:PATH='D:\Node24;' + $env:PATH
npm test -- --run tests/mcp-server-smoke.test.ts -t "starts the built stdio server and logs startup to stderr"
npm test -- --run tests/mcp-server-smoke.test.ts
npm test
npm run build
git diff --check
# 20-iteration loop:
for ($i = 1; $i -le 20; $i++) { npm test -- --run tests/mcp-server-smoke.test.ts -t "starts the built stdio server and logs startup to stderr" --reporter=dot }
```

## Results

| Check | Result |
|---|---|
| Focused test (single) | PASS (277ms) |
| 20-run focused loop | ALL 20 PASSED |
| Full smoke file | 2 passed |
| Full test suite | 17 files, 160 tests passed |
| `npm run build` | PASS |
| `git diff --check` | Only pre-existing CRLF warnings |

## Diff Notes

Only the test body changed. The original assertions (`expect(stderr).toContain(...)` and `expect(stdout).toBe("")`) are preserved unchanged per handoff constraint. The `beforeAll` build step and second test (`lists all public tools`) are untouched.

## Capabilities Used

- `diagnosing-bugs` — confirmed root cause (fixed-delay race) and designed the event-driven fix
- `vitest` skill — used for test execution and verification
- `risk-reviewer` subagent (round 1) — flagged kill-before-close-listener ordering; applied the fix (register `close` before `kill`)
- `test-baseline-builder` subagent (round 2) — confirmed determinism, cleanup ordering, Vitest compliance; noted redundant `expect` assertion which was preserved per handoff constraint

## Risks Or Skipped Checks

- Single `onData` listener handles both accumulation and signal detection — no duplicate stderr listeners, no ordering dependence, chunk-boundary safe because `Buffer.concat(stderrChunks)` reads the full accumulated buffer.
- `npm pack --dry-run` skipped: no package metadata, entry points, or publish contents changed.
- Redundant `expect(stderr).toContain(...)` noted by test-baseline-builder but intentionally preserved per handoff constraint.

## Harness Artifacts

- Task ticket: GitHub Issue #7 is the task ticket; no local duplicate required
- Research note: not required (local worktree root cause is self-evident)
- QA checklist: not required (test-only change, no release/install/MCP schema impact)
- Codemap: checked unchanged — `tests/mcp-server-smoke.test.ts` already listed, no ownership/layout change
- Harness security: not applicable (no credential, secret, or trust-boundary change)
- Harness eval: deferred (single-test fix, not a phase/release boundary)

## Decision Points

None.

## Suggested Codex Review Focus

- Verify TIMEOUT_MS=3000 (3x margin over 453ms max, well under 5s Vitest default)
- Confirm no production source, dependency, or commit changes
