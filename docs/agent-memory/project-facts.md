# Project Facts

## 2026-05-27

- Fact: This repository is `@xzxzzx/bilibili-mcp`, a TypeScript MCP server for extracting Bilibili video subtitles, metadata, and popular comments.
- Evidence: `AGENTS.md` project role section.
- Impact: Preserve MCP server compatibility and user-facing tool behavior during stabilization.

- Fact: Cookie-based Bilibili access must remain supported, but Cookie values must not be hard-coded.
- Evidence: User correction during stabilization planning and `docs/superpowers/plans/2026-05-27-stabilization-roadmap.md`.
- Impact: Replace literal credentials with `.env`, environment variables, or the credential helper instead of removing authenticated access.

- Fact: Smithery runtime config is no longer part of the active project workflow.
- Evidence: User instruction to delete Smithery config and roadmap Task 3.
- Impact: Do not recreate `smithery.json`, `smithery.yaml`, `dev: smithery dev`, `build:smithery`, or `@smithery/cli`.

- Fact: Claude Code skills live under `C:\Users\ZX\.claude\skills`, which is separate from `C:\Users\ZX\.agents\skills` and `C:\Users\ZX\.codex\skills`.
- Evidence: Local directory inspection on 2026-05-27.
- Impact: When preparing Claude Code skills, install or sync them into `.claude\skills`.

## 2026-05-28

- Fact: Project-local hooks are enabled for both Claude Code and Codex app.
- Evidence: `.claude/settings.local.json`, `.codex/hooks.json`, and `docs/superpowers/specs/2026-05-28-agent-hooks-design.md`.
- Impact: Startup context, failed shell observations, and stop summaries can be generated automatically, but formal memory updates remain review-gated.

- Fact: Codex app runtime hook observations for this repository are stored outside the project `.codex\` directory at `C:\Users\ZX\.codex\memories\bilibili-mcp\`.
- Evidence: Dry run failed with a Windows access denial when writing `.codex\memory`; the script was updated to use the writable Codex memory root.
- Impact: Do not assume project `.codex\` is suitable for mutable runtime logs.

- Fact: ECC-inspired hook upgrades are configured as lightweight project-local scripts, not as a full ECC installation.
- Evidence: `.codex/scripts/pre_compact.py`, `.codex/scripts/context_budget.py`, `.codex/scripts/post_tool_use.py`, and `.codex/scripts/stop_summary.py`.
- Impact: The project gets PreCompact checkpoints, candidate scoring, context budget reports, and strategic compact reminders without broad global rules or automatic skill evolution.

- Fact: Controlled learning proposals are generated automatically but require user approval before promotion.
- Evidence: `.codex/scripts/generate_learning_proposals.py` writes `docs/agent-memory/pending-learning-proposals.md`.
- Impact: Pending proposals should be reviewed by Codex and promoted only after the user approves with `批准本轮 learning proposals`.
