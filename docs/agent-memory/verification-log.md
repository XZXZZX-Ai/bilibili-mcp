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

## 2026-05-28 Hook And Memory Health Check

- Command: `node -e "JSON.parse(require('fs').readFileSync('.codex/hooks.json','utf8')); JSON.parse(require('fs').readFileSync('.claude/settings.local.json','utf8')); console.log('hook config json ok')"`
- Result: Passed.
- Area: Codex and Claude Code hook configuration.
- Caveat: This validates JSON syntax, not external app trust prompts.

- Command: `powershell -NoProfile -ExecutionPolicy Bypass -File .\.codex\scripts\session-start.ps1`
- Result: Passed with exit code 0 and printed bounded project context.
- Area: SessionStart hook.
- Caveat: A previous piped preview using `Select-Object -First` returned exit code 1 because the output pipe was closed early; the direct command passed.

- Command: `post_tool_use.py`, `pre_compact.py`, `stop_summary.py`, and `generate_learning_proposals.py` synthetic health checks for both `codex` and `claude`.
- Result: Passed. File artifacts were written, secret-like sample values were redacted, and stdout returned JSON `{"suppressOutput": true}` for write-file hooks.
- Area: Runtime observations, pre-compact checkpoints, stop summaries, and controlled learning proposal generation.
- Caveat: Synthetic failure observations are ignored by learning proposal generation and should not be promoted as lessons.

- Command: `python .\.codex\scripts\generate_learning_proposals.py --source claude`
- Result: Passed. `docs/agent-memory/pending-learning-proposals.md` currently has no proposals.
- Area: Controlled learning.
- Caveat: No proposal means the learning pipeline is functioning but has no approved durable lesson to promote from runtime candidates.

## 2026-05-28 Phase 2 Task 1-2 Verification

- Command: `npm test -- tests/bilibili-video-api.test.ts`
- Result: Passed. 1 test file, 3 tests.
- Area: Phase 2 Task 1 subtitle API behavior baseline and Task 2 WBI extraction regression check.
- Caveat: Tests use mocked fetch and do not call live Bilibili APIs.

- Command: `npm test`
- Result: Passed. 4 test files, 48 tests.
- Area: Phase 2 Task 1 full test verification after adding API-level subtitle tests.
- Caveat: API behavior coverage currently focuses on subtitle fallback and subtitle content URL normalization.

- Command: `npm run build`
- Result: Passed after extracting WBI signing into `src/bilibili/wbi.ts`.
- Area: Phase 2 Task 2 TypeScript and Node ESM compatibility.
- Caveat: PowerShell displayed mojibake for Chinese comments, but Python UTF-8 reads showed `wbi.ts` content is valid UTF-8.

- Command: `npm test -- tests/bilibili-video-api.test.ts`
- Result: Passed after extracting buvid fingerprint handling into `src/bilibili/fingerprint.ts`.
- Area: Phase 2 Task 3 subtitle fallback regression check.
- Caveat: Tests use mocked fetch and do not call live Bilibili APIs.

- Command: `npm run build`
- Result: Passed after extracting buvid fingerprint handling into `src/bilibili/fingerprint.ts`.
- Area: Phase 2 Task 3 TypeScript and Node ESM compatibility.
- Caveat: PowerShell displayed mojibake for Chinese comments, but Python UTF-8 reads showed `fingerprint.ts` content is valid UTF-8.

- Command: `npm test`
- Result: Passed. 4 test files, 48 tests after extracting HTTP helpers into `src/bilibili/http.ts`.
- Area: Phase 2 Task 4 full regression check.
- Caveat: Tests use mocked fetch for subtitle API behavior and do not call live Bilibili APIs.

- Command: `npm run build`
- Result: Passed after extracting HTTP helpers into `src/bilibili/http.ts`.
- Area: Phase 2 Task 4 TypeScript and Node ESM compatibility.
- Caveat: `retryableFetch` and `throttledFetch` are temporarily exported because `getSubtitleContent()` still lives in `client.ts`; Task 5 should move that consumer into `video-api.ts`.

- Command: `npm test`
- Result: Passed. 4 test files, 48 tests after extracting video and subtitle API functions into `src/bilibili/video-api.ts`.
- Area: Phase 2 Task 5 full regression check.
- Caveat: Subtitle API tests use mocked fetch and do not call live Bilibili APIs.

- Command: `npm run build`
- Result: Passed after extracting video and subtitle API functions into `src/bilibili/video-api.ts`.
- Area: Phase 2 Task 5 TypeScript and Node ESM compatibility.
- Caveat: `client.ts` still contains comments API logic until Task 6.

- Command: `npm test`
- Result: Passed. 4 test files, 48 tests after extracting comments API logic into `src/bilibili/comments-api.ts`.
- Area: Phase 2 Task 6 full regression check.
- Caveat: Existing automated tests do not directly exercise comments API fallback behavior.

- Command: `npm run build`
- Result: Passed after converting `src/bilibili/client.ts` to compatibility re-exports.
- Area: Phase 2 Task 6 and Task 7 TypeScript and Node ESM compatibility.
- Caveat: Public export compatibility was also checked through built `dist/bilibili/client.js`.

- Command: `node -e "import('./dist/bilibili/client.js').then(...)"`
- Result: Passed. `checkLoginStatus`, `fetchWithWBI`, `fetchWithoutWBI`, `getVideoInfo`, `getVideoSubtitle`, `getSubtitleContent`, and `getVideoComments` are all functions.
- Area: Phase 2 Task 7 compatibility exports.
- Caveat: This verifies export presence, not live Bilibili API behavior.

## 2026-05-28 Phase 2 Final Verification

- Command: `npm run build`
- Result: Passed.
- Area: Final Phase 2 TypeScript compilation.

- Command: `npm test`
- Result: Passed. 4 test files, 48 tests.
- Area: Final Phase 2 regression suite.
- Caveat: Comments API fallback behavior remains a residual untested path.

- Command: `npm pack --dry-run`
- Result: Passed. 94 files, 554.9 kB. Package includes `dist/bilibili/client.*`, `http.*`, `wbi.*`, `fingerprint.*`, `video-api.*`, and `comments-api.*`.
- Area: Final Phase 2 package contents.
- Caveat: `dist/server.cjs/index.cjs.map` remains large but unchanged from the stabilization-era residual risk.

- Command: `node -e "import('./dist/bilibili/client.js').then(...)"`
- Result: Passed. All 7 compatibility exports are functions.
- Area: Final Phase 2 public import compatibility.

- Command: `git status --short`
- Result: Phase 2 files are present alongside pre-existing agent/hooks and memory/doc changes.
- Area: Final Phase 2 worktree scope.
- Caveat: Agent/hooks configuration changes are still unrelated to the code split and should be committed separately if the user wants separate history.
