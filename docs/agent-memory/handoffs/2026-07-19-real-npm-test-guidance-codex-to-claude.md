# Codex To Claude Handoff: Real npm Test Guidance

## Update Goal

Implement GitHub Issue #6: https://github.com/XZXZZX-Ai/bilibili-mcp/issues/6

Make the always-loaded Codex and Claude rules accurately state that `npm test` runs the real Vitest suite and is a normal verification gate.

## Current Judgment

`package.json` defines `"test": "vitest run"`, and Codex ran `npm test` successfully on 2026-07-19: 17 files and 160 tests passed. Current-tense statements in `AGENTS.md` and `CLAUDE.md` still call it a failing stub. That stale rule already caused the Issue #5 Claude report to state false test status after a green full suite.

Historical dated entries in `docs/agent-memory/verification-log.md` describe an earlier state and must remain unchanged.

## Recommended Approach

Edit only the stale current guidance in `AGENTS.md` and `CLAUDE.md`:

- list `npm test` alongside `npm run build` as the normal verification commands;
- remove the conditional/future paragraphs about adding a real runner later;
- make review/report checklist wording request the actual `npm test` result instead of stub status.

Do not reorganize either file or rewrite other test-baseline history.

## Files To Inspect

- `C:/Users/ZX/bilibili-mcp/package.json`
- `C:/Users/ZX/bilibili-mcp/AGENTS.md`
- `C:/Users/ZX/bilibili-mcp/CLAUDE.md`
- `C:/Users/ZX/bilibili-mcp/docs/agent-memory/harness-security.md`
- `C:/Users/ZX/bilibili-mcp/docs/agent-memory/codemap.md`
- `C:/Users/ZX/bilibili-mcp/docs/agent-memory/verification-log.md` for historical context only

## Files To Edit

- `C:/Users/ZX/bilibili-mcp/AGENTS.md`
- `C:/Users/ZX/bilibili-mcp/CLAUDE.md`
- Write the report to `C:/Users/ZX/bilibili-mcp/docs/agent-memory/handoffs/2026-07-19-real-npm-test-guidance-claude-report.md`.

## Required Capability

- Use the installed `vitest` skill to verify command wording against the real runner.
- Use the project `test-baseline-builder` subagent for a bounded consistency review.
- Use the project `risk-reviewer` subagent after editing, applying the checklist in `docs/agent-memory/harness-security.md`.
- If a subagent is unavailable or stalls, complete the same bounded review at the top level and report it. Do not create an agent tree.
- No `product-requirements`, `system-design`, `codebase-design`, or external research is needed.
- Do not use Superpowers skills.

## Constraints

- Preserve all higher-priority instruction boundaries, credential safety, Git authorization, Paseo workflow, Matt skill routing, and no-Superpowers rules.
- Do not change hooks, permissions, skills, subagent files, templates, source code, tests, package files, or historical verification entries.
- Do not add new always-loaded sections; reduce or preserve context size.
- Do not stage, commit, or push.
- Preserve unrelated dirty-worktree changes.

## Claude Code Execution Steps

1. Read the handoff and listed files.
2. Confirm `package.json` maps `npm test` to `vitest run` and run `npm test` before editing.
3. Run the bounded `test-baseline-builder` review of the intended wording.
4. Replace only stale current-tense stub/future guidance in `AGENTS.md` and `CLAUDE.md`.
5. Run the exact consistency scan, full test suite, build, diff check, UTF-8/replacement-character scan, and context-budget script.
6. Run the bounded `risk-reviewer` review against `harness-security.md`; address only same-scope findings.
7. Check `codemap.md`; leave unchanged unless navigation or ownership actually changes.
8. Write the required report.

## Verification Commands

```powershell
$env:PATH='D:\Node24;' + $env:PATH
npm test
npm run build
rg -n -i "npm test.*stub|stub.*npm test|real test runner|test status, including whether" AGENTS.md CLAUDE.md
git diff --check
python .codex/scripts/context_budget.py
```

Also perform exact-path secret-pattern and UTF-8 replacement-character scans on the two edited rule files and the report. The stale-guidance `rg` command must return no matches; handle ripgrep exit code 1 as the expected no-match result.

## Acceptance Criteria

- `AGENTS.md` and `CLAUDE.md` identify `npm test` as the real normal test gate.
- No current-tense stub or future-runner wording remains in either file.
- Review/report checklists request actual test results.
- Historical verification records remain untouched.
- `npm test` passes all 160 current tests (or the current higher count), build passes, and all scoped scans pass.
- Context budget does not increase materially.
- Harness-security review finds no expanded authority or trust-boundary regression.
- No source, tests, package, hooks, permissions, skills, commits, or pushes change.

## Things To Avoid

- Do not rewrite all testing documentation.
- Do not edit dated historical statements in `verification-log.md`.
- Do not add a new test command or dependency.
- Do not alter the active workflow or agent permissions.
- Do not broaden into roadmap cleanup.

## Risks

- Leaving even one current stub statement will continue to mislead future agents.
- Broad edits to always-loaded files can increase context overhead or weaken safety rules.
- Historical facts can be accidentally rewritten as if they were current rules.

Rollback is limited to the scoped wording changes in the two rule files.

## Stop And Report If

- `npm test` does not resolve to the current Vitest suite.
- The correction requires changing package/test configuration.
- A proposed edit changes execution authority, hooks, permissions, credential rules, Git rules, or Superpowers policy.
- Required verification fails for an unrelated reason.
- A secret is discovered.

## Expected Claude Report

Use the repository report template. Include exact files/sections changed, commands and results, `test-baseline-builder` and `risk-reviewer` conclusions, scoped diff notes, risks/skips, the complete Harness Artifacts section, decision points, and suggested Codex review focus.

## Codex Completion-Audit Addendum

After the first implementation pass, Codex found four additional current runtime-agent rules with the same stale stub statement. These are not dated historical records and must be corrected under Issue #6:

- `C:/Users/ZX/bilibili-mcp/.claude/agents/build-error-resolver.md`
- `C:/Users/ZX/bilibili-mcp/.claude/agents/package-maintainer.md`
- `C:/Users/ZX/bilibili-mcp/.claude/agents/release-verifier.md`
- `C:/Users/ZX/bilibili-mcp/.codex/agents/release-verifier.toml`

Replace only the single conditional/stub test line in each file with an unconditional requirement that `npm test` passes. Preserve every other subagent instruction. Re-run the stale-guidance scan across `AGENTS.md`, `CLAUDE.md`, `.claude/agents`, and `.codex/agents`, plus the original checks and harness-security risk review. Update the Claude report to include these four files and the second-pass verification.
