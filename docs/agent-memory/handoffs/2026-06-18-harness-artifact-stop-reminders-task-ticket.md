# Task Ticket: Harness Artifact Stop Reminders

## Ticket

- ID: harness-artifact-stop-reminders
- Title: Add lightweight Stop hook reminders for codemap, harness-security, and harness-eval
- Status: in_progress
- Owner: Codex
- Source: user request
- Parent plan or PRD: none
- Blocking tickets: none
- Blocked by: none

## Objective

Add non-mutating Stop hook reminders that tell Codex/Claude when changed files suggest checking `codemap.md`, `harness-security.md`, or `harness-eval.md`.

## Scope

In scope:

- Update existing Stop summary behavior.
- Keep hook output protocol JSON-safe.
- Update codemap if hook behavior/navigation changes.

Out of scope:

- Auto-create or auto-update codemap/security/eval files.
- Add new hook lifecycle entries.
- Change learning proposal promotion behavior.

## Files To Inspect Or Edit

Expected inspect:

- `.codex/scripts/stop_summary.py`
- `.codex/hooks.json`
- `.claude/settings.local.json`
- `docs/agent-memory/harness-security.md`
- `docs/agent-memory/codemap.md`

Expected edit:

- `.codex/scripts/stop_summary.py`
- `docs/agent-memory/codemap.md`
- `docs/agent-memory/decisions.md`

Do not touch:

- Hook registration files unless the existing Stop hook cannot support the reminder.
- Runtime memory files.
- Secrets or credential files.

## Required Capabilities

Skills:

- `bilibili-mcp-memory`

Subagents:

- none

MCP/tools/CLI:

- local shell
- `git status --short`

## Execution Steps

1. Add deterministic file-pattern reminder logic to `stop_summary.py`.
2. Include reminders in the generated stop summary only.
3. Preserve JSON-safe stdout.
4. Validate Python syntax and run the hook once.
5. Update codemap and decision memory for the new reminder behavior.

## Acceptance Criteria

- [x] Stop hook still prints only a JSON control object to stdout. (Verified 2026-07-20: `{"suppressOutput": true}`)
- [x] Reminders are based on local `git status --short`. (Verified 2026-07-20: `git_changed_paths()` calls `git -C ... status --short`)
- [x] Changed runtime/code/test/release/harness files can remind to check codemap. (Verified 2026-07-20: `test_codemap_branch` passes)
- [x] Changed harness files can remind to review harness-security. (Verified 2026-07-20: `test_security_branch` passes)
- [x] Multiple harness changes can remind to consider harness-eval. (Verified 2026-07-20: `test_eval_branch_at_threshold` passes)
- [x] Hook does not auto-modify codemap, security, eval, research, QA, or task-ticket files. (Verified 2026-07-20: writes only to runtime/ and memory/)
- [x] `docs/agent-memory/codemap.md` is updated if module ownership, MCP tool flow, tests, package/release files, or harness structure changed; otherwise the report says it was checked and left unchanged. (Verified 2026-07-20: `test_stop_summary.py` noted under hooks; no structural change needed)

## Completion Report

- Status: **complete** (2026-07-20 v1.6.4 review remediation)
- Files: `.codex/scripts/stop_summary.py` (implementation), `.codex/scripts/test_stop_summary.py` (test), `docs/agent-memory/codemap.md` (updated)
- Commands: `python -m py_compile .codex/scripts/stop_summary.py`, `python .codex/scripts/test_stop_summary.py` (8/8), `python .codex/scripts/stop_summary.py --agent codex` (JSON-safe)
- Codemap: updated hook description to note test file
- Harness security: reviewed, no violations

## Verification

Required commands:

```bash
python -c "import ast, pathlib; ast.parse(pathlib.Path('.codex/scripts/stop_summary.py').read_text(encoding='utf-8'))"
python .codex/scripts/stop_summary.py --agent codex
```

## Risks And Rollback

Risks:

- Reminder noise if patterns are too broad.
- Hook protocol breakage if stdout changes.

Rollback:

- Revert the `stop_summary.py` reminder additions.

## Stop And Report Conditions

Stop before editing or continue only after user/Codex decision if:

- reminder logic requires reading file contents instead of only paths
- hook stdout cannot remain JSON-safe
- implementation would auto-modify harness artifacts

## Completion Report

Return:

- files changed
- commands run and results
- skipped checks and why
- subagent/skill/tool capabilities used
- codemap update status
- unresolved risks or decision points
