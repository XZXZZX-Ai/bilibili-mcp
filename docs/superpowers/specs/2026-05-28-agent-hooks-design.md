# Agent Hooks Design

## Purpose

Enable project-local hooks for both Claude Code and Codex app in `@xzxzzx/bilibili-mcp`.

The hooks should make the existing repository memory easier to use without changing the user's manual orchestration model:

- Codex plans, reviews, and verifies.
- Claude Code executes bounded implementation briefs.
- Durable project memory remains under `docs/agent-memory/`.

## Scope

This design configures hooks only for this repository.

Claude Code uses:

- `.claude/settings.local.json`

Codex app uses:

- `.codex/hooks.json`
- `.codex/scripts/session-start.ps1`
- `.codex/scripts/post_tool_use.py`
- `.codex/scripts/pre_compact.py`
- `.codex/scripts/stop_summary.py`
- `.codex/scripts/context_budget.py`
- `.codex/scripts/generate_learning_proposals.py`

The Python scripts accept `--agent codex` or `--agent claude` so the two agents can share hook logic while keeping runtime data separate.

## Hook Behavior

### SessionStart

Session start prints a bounded context summary:

- repository path
- current git branch
- short git status
- previews of `docs/agent-memory/README.md`, `project-facts.md`, `decisions.md`, and `lessons-learned.md`
- preview of the latest `docs/agent-memory/context-budget-report.md` when present
- active stabilization roadmap path

This output is meant to orient the agent at startup. It does not mutate files.

### PostToolUse

Post tool use reads the hook payload from stdin and records only failed shell-like tool results when enough information is available.

It writes local runtime observations to:

- `C:\Users\ZX\.codex\memories\bilibili-mcp\memory\observations.jsonl`
- `C:\Users\ZX\.codex\memories\bilibili-mcp\memory\candidates.jsonl`
- `.claude/memory/observations.jsonl`
- `.claude/memory/candidates.jsonl`

Candidate entries are only created for build, test, lint, package, or git failures. These are review candidates, not promoted lessons.

Candidate entries include:

- `candidate_id`
- `scope`
- `evidence_count`
- `confidence`
- `promote_after_review`

The confidence score is a triage signal only. It never promotes a candidate automatically.

### PreCompact

Pre compact writes a checkpoint before context compaction:

- `C:\Users\ZX\.codex\memories\bilibili-mcp\runtime\pre-compact-checkpoint.md`
- `.claude/runtime/pre-compact-checkpoint.md`

The checkpoint includes repository path, branch, git status, active roadmap, and resume guidance.

### Stop

Stop writes a lightweight summary for the latest runtime observations:

- `C:\Users\ZX\.codex\memories\bilibili-mcp\runtime\last-stop-summary.txt`
- `C:\Users\ZX\.codex\memories\bilibili-mcp\memory\observation-summary.md`
- `.claude/runtime/last-stop-summary.txt`
- `.claude/memory/observation-summary.md`

Stop does not edit formal project memory.

Stop also writes strategic compact advice. The advice is only a reminder and does not automatically run compaction.

Stop also runs the learning proposal generator. It writes only:

- `docs/agent-memory/pending-learning-proposals.md`

Pending proposals are review queues, not formal memory.

### Context Budget

Context budget is configured as an explicit audit script:

- `.codex/scripts/context_budget.py`
- `docs/agent-memory/context-budget-report.md`

It estimates always-relevant documentation overhead and configured project hook entries. It should be re-run after adding broad rules, MCP servers, large agent docs, or new always-loaded instructions.

### Controlled Learning Proposals

Learning proposal generation reads Codex and Claude Code candidate observations, groups repeated candidates, and writes promotion proposals when evidence is strong enough.

The generator never edits:

- `project-facts.md`
- `decisions.md`
- `lessons-learned.md`
- `handoff-log.md`
- `verification-log.md`
- `AGENTS.md`
- `CLAUDE.md`

The promotion flow is:

1. Hooks collect observations.
2. Candidate scoring adds confidence and evidence counts.
3. `generate_learning_proposals.py` writes pending proposals.
4. Codex reviews proposals.
5. The user approves with `批准本轮 learning proposals`.
6. Codex writes approved entries into formal memory.

Proposal review reminders are phase-gated. The generator compares completed `### Task N` sections in the active stabilization roadmap and only reminds when the completed phase count increases and pending proposals exist.

## Safety Rules

The hooks must not store raw credentials.

Hook scripts redact common sensitive fields before writing observations:

- `SESSDATA`
- `bili_jct`
- `DedeUserID`
- `Cookie`
- `Authorization`
- token-like and API-key-like fields
- long high-entropy strings

The hooks do not read `.env` files and do not write to `docs/agent-memory/` automatically.

## Rollback

Claude Code rollback:

- remove the `hooks` property from `.claude/settings.local.json`

Codex app rollback:

- remove or rename `.codex/hooks.json`

Runtime logs can be deleted safely:

- `C:\Users\ZX\.codex\memories\bilibili-mcp\memory\`
- `C:\Users\ZX\.codex\memories\bilibili-mcp\runtime\`
- `.claude/memory/`
- `.claude/runtime/`

## Verification

Minimum verification:

- parse `.claude/settings.local.json` as JSON
- parse `.codex/hooks.json` as JSON
- run `session-start.ps1` manually
- run `post_tool_use.py` with a synthetic failed command payload
- run `pre_compact.py`
- run `stop_summary.py`
- run `context_budget.py`
- run `generate_learning_proposals.py`
- confirm runtime files are created without secrets
- inspect `git status --short`
