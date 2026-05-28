# Verification Log

## 2026-05-27

- Command: `npm run build`
- Result: Passed before memory-system work.
- Area: Stabilization baseline.
- Caveat: This result does not verify the memory-system files because they are documentation and skill configuration.

- Command: `git status --short`
- Result: Worktree contains intentional deletes for `smithery.json` and `smithery.yaml`, plus untracked `AGENTS.md`, `CLAUDE.md`, and `docs/`.
- Area: Repository state before memory-system implementation.
- Caveat: Do not assume all untracked files belong to a single commit without reviewing scope.

## 2026-05-28

- Command: `node -e "JSON.parse(require('fs').readFileSync('.codex/hooks.json','utf8')); JSON.parse(require('fs').readFileSync('.claude/settings.local.json','utf8')); console.log('all hook json ok')"`
- Result: Passed.
- Area: Claude Code and Codex app hook JSON configuration.
- Caveat: This validates JSON syntax, not the external app trust prompt.

- Command: `powershell -NoProfile -ExecutionPolicy Bypass -File .\.codex\scripts\session-start.ps1`
- Result: Passed and printed repository context, git status, active roadmap, and project memory previews.
- Area: SessionStart hook script.
- Caveat: Output is bounded by script line limits.

- Command: Synthetic failed `npm run build` hook payloads through `post_tool_use.py --agent codex` and `post_tool_use.py --agent claude`, followed by `stop_summary.py`.
- Result: Passed. Runtime observations and stop summaries were written, and sample `SESSDATA` / `bili_jct` values were redacted.
- Area: PostToolUse and Stop hook scripts.
- Caveat: Synthetic payloads verify the parser and storage path, not every possible hook payload field.

- Command: `npm run build`
- Result: Passed.
- Area: TypeScript project baseline after hook configuration.
- Caveat: `npm test` is still a stub until the real test baseline is added.

- Command: `python .\.codex\scripts\context_budget.py`
- Result: Passed and wrote `docs/agent-memory/context-budget-report.md`.
- Area: ECC-inspired context budget audit.
- Caveat: Token counts are estimates based on local file sizes.

- Command: `node -e "JSON.parse(require('fs').readFileSync('.codex/hooks.json','utf8')); JSON.parse(require('fs').readFileSync('.claude/settings.local.json','utf8')); console.log('all hook json ok')"`
- Result: Passed after adding `PreCompact`.
- Area: Claude Code and Codex app hook JSON configuration.
- Caveat: Codex app may still require trust confirmation for changed hooks.

- Command: `'{\"event\":\"PreCompact\"}' | python .\.codex\scripts\pre_compact.py --agent codex` and `'{\"event\":\"PreCompact\"}' | python .\.codex\scripts\pre_compact.py --agent claude`
- Result: Passed and wrote pre-compact checkpoints for both agents.
- Area: PreCompact checkpointing.
- Caveat: Synthetic payload verifies script behavior, not the external app trigger.

- Command: Synthetic failed `npm run build` hook payloads through `post_tool_use.py --agent codex` and `post_tool_use.py --agent claude`.
- Result: Passed. Candidate rows include `candidate_id`, `scope`, `evidence_count`, `confidence`, and `promote_after_review`; sample secret fields were redacted.
- Area: Candidate scoring.
- Caveat: Confidence is a review signal only and does not auto-promote formal memory.

- Command: `python .\.codex\scripts\stop_summary.py --agent codex` and `python .\.codex\scripts\stop_summary.py --agent claude`
- Result: Passed and wrote strategic compact advice into both stop summaries.
- Area: Strategic compact reminders.
- Caveat: The reminder does not run compaction automatically.

- Command: `python .\.codex\scripts\generate_learning_proposals.py --source manual`
- Result: Passed and wrote `docs/agent-memory/pending-learning-proposals.md`.
- Area: Automated controlled learning proposal generation.
- Caveat: The file is a review queue only and does not promote entries into formal memory.

- Command: Task 1 local credential cleanup - replaced hard-coded `SESSDATA`, `bili_jct`, `DedeUserID` in `get_subtitle.py` with `os.environ.get()`.
- Result: Passed. Credential literal scan returned `found: []`. `git status --short --ignored get_subtitle.py` confirmed `!! get_subtitle.py` (git-ignored).
- Area: Stabilization roadmap Task 1.
- Caveat: `get_subtitle.py` is an ignored local debug script; this is a local-only cleanup with no repository-tracked diff.

## 2026-05-28 Task 6 Final Baseline Verification

- Command: `git status --short`
- Result: Expected changes only. M .gitignore, M .npmignore, M package-lock.json, M package.json, D smithery.json, D smithery.yaml, D src/smithery-test.ts. Untracked: .claude/, .codex/, AGENTS.md, CLAUDE.md, docs/, tests/.
- Area: Stabilization final baseline.

- Command: `npm run build`
- Result: Passed.
- Area: TypeScript compilation.

- Command: `npm test`
- Result: Passed. 3 test files, 45 tests (vitest v3.2.4, Node >=18 compatible).
- Area: Real test baseline.

- Command: `npm pack --dry-run`
- Result: Passed. 74 files, 552.9 kB. Package includes dist/index.js, dist/index.d.ts, dist/cli.js. Excludes dist/debug_subtitle2.mjs, dist/smithery-test.*, tests/, smithery.json, smithery.yaml, .env files.
- Area: Package contents.

- Command: Package metadata check
- Result: main=dist/index.js, module=dist/index.js, types=dist/index.d.ts, bin.bilibili-mcp=dist/cli.js, type=module. All correct.
- Area: Package entry points.

- Command: Smithery removal check
- Result: dev (undefined), build:smithery (undefined), @smithery/cli (undefined). Fully removed.
- Area: Smithery runtime cleanup.

- Remaining non-blocking risks:
  - Old Bilibili Cookie values were present in repository history and should be rotated.
  - `get_subtitle.py` is local-only cleanup (git-ignored), not a tracked fix.
  - `dist/server.cjs/` bundle (1.7MB) may warrant review but is outside stabilization scope.
  - npm audit: 23 vulnerabilities not introduced or fixed by stabilization changes.
