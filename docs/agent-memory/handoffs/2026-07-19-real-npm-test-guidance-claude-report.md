# Claude Report: Real npm Test Guidance

## First Pass — AGENTS.md and CLAUDE.md

### Files Changed

- `AGENTS.md` — three edits:
  1. "Development Commands": listed `npm test` alongside `npm run build`, removed "stub that exits with an error" paragraph.
  2. Removed the "After a real test runner is added" future-tense paragraph (now the real runner exists).
  3. Review Checklist: changed to `- `npm test` passes.` (removed "after a real test runner is added; before that...").
- `CLAUDE.md` — two edits:
  1. "Development Commands": replaced singular "Use this as the default verification command" with plural including `npm test`, removed stub paragraph, removed "After a real test runner is added" paragraph.
  2. Report Format: changed to `- test status` (removed "including whether npm test is still a stub").

## Second Pass — Completion-Audit Repair (Four Agent Files)

Codex found the same stale stub conditional in four additional current rules files after the first pass.

### Files Changed

- `.claude/agents/build-error-resolver.md` line 40: was `- If real tests exist after Task 4, run `npm test`; before that, state that `npm test` is still a stub.` → `- Run `npm test`.`
- `.claude/agents/package-maintainer.md` line 44: same pattern → `- Run `npm test`.`
- `.claude/agents/release-verifier.md` line 15: was `- `npm test` passes after a real test runner is added; before that, explicitly report the stub status.` → `- `npm test` passes.`
- `.codex/agents/release-verifier.toml` line 10: was `- npm test passes after a real test runner is added; before that, report that npm test is still a stub` → `- npm test passes`

## Commands Run

| Command | Result |
|---------|--------|
| `npm test` (first pass) | 17 files, 160 tests passed |
| `npm test` (second pass, run 1) | 17 files, 160 tests passed |
| `npm test` (second pass, run 2) | 1 failed (flaky stdio smoke test), 16 passed, 159/160 |
| `npm test` (second pass, run 3) | 17 files, 160 tests passed (flaky test self-resolved) |
| `npm run build` | tsc compiled cleanly (both passes) |
| `rg` stale scan on AGENTS.md, CLAUDE.md | No matches |
| `rg` stale scan on `.claude/agents/` | No matches |
| `rg` stale scan on `.codex/agents/` | No matches |
| `git diff --check` (both passes) | No whitespace errors (only pre-existing CRLF warnings) |
| `python .codex/scripts/context_budget.py` | Stable (~18,127 tokens); line counts decreased |
| UTF-8 replacement-character scan (all 6 changed files) | No matches |
| Secret-pattern scan | Not applicable (no credential content touched) |
| `docs/agent-memory/codemap.md` | Already lists `npm test` as default verification; left unchanged |

## Capabilities Used

- `vitest` skill: confirmed `vitest run` is the standard CLI invocation matching `package.json`.
- `test-baseline-builder` subagent (first pass): launched but did not return; bounded review completed at top level.
- `risk-reviewer` subagent (first pass): **zero-risk**. No expanded authority, trust-boundary regression, secret leak, or rule weakening.
- `risk-reviewer` subagent (second pass): **zero-risk for the document changes themselves**. Flagged the pre-existing flaky stdio smoke test (`tests/mcp-server-smoke.test.ts`), which passed 3/4 runs. The flaky test is not caused by these edits, but the unconditional gate now exposes it. See Unresolved Risks.

## Unresolved Risks

- **Pre-existing flaky test**: `tests/mcp-server-smoke.test.ts` ("starts the built stdio server and logs startup to stderr") failed 1 of 4 runs during verification. This test was already flaky before Issue #6; the stale stub guidance merely masked it. The unconditional `npm test` gate now correctly exposes this flakiness. Fixing the flaky test is a separate issue, not in scope for Issue #6.
- Risk-reviewer correctly notes: if the flaky test is not stabilized, agents following these `npm test` pass rules will encounter intermittent verification failures unrelated to their own changes.

## Decision Points

None. All edits match the handoff and the addendum.

## Harness Artifacts

- **Task ticket**: GitHub Issue #6. Used as the planning source.
- **Research note**: Not required (no external facts changed).
- **QA checklist**: Not required (no public install, credential, stdio, package, or client behavior changed).
- **Codemap**: Checked unchanged (already lists `npm test` as default verification at line 76).
- **Harness security**: Reviewed twice. Both risk-reviewer passes confirm no expanded authority, trust-boundary regression, secret leak, or rule weakening.
- **Harness eval**: Deferred (documentary rule update; evaluate after next release phase).

## Suggested Codex Review Focus

- The pre-existing flaky stdio smoke test in `tests/mcp-server-smoke.test.ts` should be diagnosed and stabilized; the unconditional gate now exposes it every time `npm test` is run.
- Confirm all six files are now free of stale stub guidance.
