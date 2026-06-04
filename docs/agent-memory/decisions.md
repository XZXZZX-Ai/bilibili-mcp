# Decisions

## 2026-05-27

- Decision: Complete the stabilization roadmap before splitting `src/bilibili/client.ts` or adding new MCP tools.
- Reason: Security, package metadata, tests, and publish contents are higher-risk foundations.
- Evidence: `docs/superpowers/plans/2026-05-27-stabilization-roadmap.md`.

- Decision: Use Vitest for the minimal real test baseline.
- Reason: It handles TypeScript ESM tests cleanly and matches the installed `vitest` skill.
- Evidence: Stabilization roadmap Task 4 and installed Claude Code skill at `C:\Users\ZX\.claude\skills\vitest`.

- Decision: Start with repository-local memory files and a project memory skill, not ECC-style automatic hooks.
- Reason: The repository is still in stabilization, and hooks would change Claude Code runtime behavior.
- Evidence: `docs/superpowers/specs/2026-05-27-agent-memory-learning-system-design.md`.

## 2026-05-28

- Decision: Enable project-local hooks for Claude Code and Codex app after explicit user approval.
- Reason: The first memory-system phase is in place, and hooks can now improve startup context and failure capture without auto-promoting formal memory.
- Evidence: `docs/superpowers/specs/2026-05-28-agent-hooks-design.md`, `.claude/settings.local.json`, and `.codex/hooks.json`.

- Decision: Keep hook runtime observations separate from formal memory.
- Reason: Failed command records are useful review candidates but are too noisy to write directly into `docs/agent-memory/`.
- Evidence: `.codex/scripts/post_tool_use.py` writes observations and candidates only to runtime memory paths.

- Decision: Add only the lightweight ECC-inspired upgrades: PreCompact checkpointing, candidate scoring, context budget auditing, and strategic compact reminders.
- Reason: These improve continuity and review quality without installing the full ECC plugin, broad rules, or automatic skill evolution.
- Evidence: `.codex/scripts/pre_compact.py`, `.codex/scripts/context_budget.py`, `.codex/scripts/post_tool_use.py`, and `.codex/scripts/stop_summary.py`.

- Decision: Automate controlled learning by generating pending learning proposals, not by directly mutating formal memory.
- Reason: This preserves review control while reducing manual candidate triage work.
- Evidence: `.codex/scripts/generate_learning_proposals.py` and `docs/agent-memory/pending-learning-proposals.md`.

- Decision: Add a small Claude Code project subagent set adapted from ECC instead of copying the full ECC agent library.
- Reason: The stabilization roadmap needs focused execution and verification helpers, while the full ECC agent set would add unnecessary context and workflow surface area.
- Evidence: `.claude/agents/credential-sanitizer.md`, `.claude/agents/package-maintainer.md`, `.claude/agents/test-baseline-builder.md`, `.claude/agents/build-error-resolver.md`, `.claude/agents/risk-reviewer.md`, and `.claude/agents/release-verifier.md`.

- Decision: Add a smaller Codex custom agent set for planning, risk review, and release verification.
- Reason: Codex owns direction and review in the project workflow, so its agents should support decisions and verification rather than duplicate Claude Code's execution agents.
- Evidence: `.codex/agents/stabilization-reviewer.toml`, `.codex/agents/risk-reviewer.toml`, and `.codex/agents/release-verifier.toml`.

- Decision: Fold selected GitHub subagent patterns into the existing project agents instead of adding more agents.
- Reason: The roadmap benefits from AAA testing, systematic debugging, package risk checks, MCP compatibility review, and release gates, but adding more full-size agents would increase context and orchestration cost.
- Evidence: `.claude/agents/test-baseline-builder.md`, `.claude/agents/build-error-resolver.md`, `.claude/agents/package-maintainer.md`, `.codex/agents/risk-reviewer.toml`, and `.codex/agents/release-verifier.toml`.

- Decision: Add explicit capability invocation rules for skills, MCP/tool connectors, and subagents.
- Reason: The user observed inconsistent Codex and Claude Code use of skills, MCP tools, and subagents; repository instructions should require agents to check, invoke, name, or intentionally skip relevant capabilities instead of relying on implicit behavior.
- Evidence: `AGENTS.md` Capability Invocation Rules and `CLAUDE.md` Capability Invocation Rules.

- Decision: Keep hook stdout JSON-safe for Claude Code command hooks that write files.
- Reason: Claude Code reported `Stop hook error: JSON validation failed`; write-file hooks should avoid ordinary stdout and emit a minimal JSON control object instead.
- Evidence: `.codex/scripts/stop_summary.py`, `.codex/scripts/generate_learning_proposals.py`, `.codex/scripts/post_tool_use.py`, and `.codex/scripts/pre_compact.py` now print `{"suppressOutput": true}` after writing their artifacts.

- Decision: Use a compatibility-first staged split for Phase 2 `src/bilibili/client.ts` refactoring.
- Reason: Subtitle retrieval depends on WBI, Cookie headers, buvid fallback, and `/x/player/v2` fallback behavior; tests should pin this behavior before moving code.
- Evidence: `docs/superpowers/specs/2026-05-28-bilibili-client-split-design.md` and `docs/superpowers/plans/2026-05-28-bilibili-client-split-implementation-plan.md`.

- Decision: Plan Phase 3 as an additive MCP tool surface expansion, not a breaking replacement of existing tools.
- Reason: Existing MCP clients may already depend on `get_video_info` and `get_video_comments`; transcript, metadata, and explicit comment controls can be added without breaking those callers.
- Evidence: `docs/superpowers/specs/2026-05-28-mcp-tool-surface-design.md` and `docs/superpowers/plans/2026-05-28-mcp-tool-surface-implementation-plan.md`.

- Decision: Plan Phase 4 as a documentation and release-gate phase, with GitHub Actions/npm publish behavior verified against official docs at implementation time.
- Reason: npm trusted publishing, provenance, Node, and npm CLI requirements can change; release workflow should be documentation-backed and should not restore Smithery or introduce tokens by default.
- Evidence: `docs/superpowers/specs/2026-05-28-documentation-release-polish-design.md` and `docs/superpowers/plans/2026-05-28-documentation-release-polish-implementation-plan.md`.

- Decision: Make controlled-learning reminders automatically track the current incomplete implementation plan instead of hard-coding the original stabilization roadmap.
- Reason: After Phase 2, phase-gated learning reminders still pointed at the completed stabilization plan, so Phase 3/4 work would not trigger review reminders correctly.
- Evidence: `.codex/scripts/plan_tracker.py`, `.codex/scripts/generate_learning_proposals.py`, `.codex/scripts/pre_compact.py`, and `.codex/scripts/session-start.ps1`.
