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
