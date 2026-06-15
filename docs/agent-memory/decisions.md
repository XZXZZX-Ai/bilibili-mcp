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

## 2026-06-05

- Decision: Add credential setup guidance as explicit MCP tools plus actionable error `next_steps`, rather than relying only on README install instructions.
- Reason: Most users install MCP servers through agents; the installing agent needs a machine-discoverable way to tell the user how to configure Cookies after registration.
- Evidence: `get_credential_setup_instructions`, `check_bilibili_credentials`, `buildCredentialNextSteps()`, and the `COOKIE_EXPIRED` / `SUBTITLE_UNAVAILABLE` response paths in `src/server.ts`.

- Decision: Keep Cookie values out of MCP client configuration examples and guide users to `npx -y @xzxzzx/bilibili-mcp config` followed by `npx -y @xzxzzx/bilibili-mcp check`.
- Reason: MCP client config files are easy to share or commit accidentally; the project already has a safer credential helper and global credential flow.
- Evidence: README credential notes, `buildCredentialSetupInstructions()`, and secret-oriented regression tests in `tests/credential-guidance.test.ts`.

- Decision: Treat generated learning proposal files as review queues and Python bytecode caches as ignored local artifacts.
- Reason: `pending-learning-proposals.md` is meaningful project state only as a generated queue, while `__pycache__` contains no durable learning.
- Evidence: `docs/agent-memory/README.md` controlled-learning section and `.gitignore` entries for `__pycache__/` and `*.py[cod]`.

## 2026-06-14

- Decision: Add fixed invocation triggers for recurring Codex and Claude Code project work.
- Reason: The user wants predictable skill and subagent use in stable scenarios instead of ad hoc capability selection.
- Evidence: `AGENTS.md` and `CLAUDE.md` now define fixed triggers for tests, credentials/secrets, build failures, package maintenance, release verification, GitHub Actions, Git workflows, risk review, and project memory updates.

- Decision: Add fixed MCP/tool connector triggers for recurring remote-state, documentation, registry, and local MCP verification work.
- Reason: The user wants Codex and Claude Code to consistently verify live external state and current docs in stable scenarios instead of relying on memory.
- Evidence: `AGENTS.md` and `CLAUDE.md` now define fixed MCP/tool triggers for live GitHub state, failing Actions checks, GitHub Actions/npm publishing docs, OpenAI/Codex/MCP SDK docs, npm registry metadata, local MCP server behavior, remote owner/name changes, and explicitly requested external app workflows.

- Decision: Add fixed CLI triggers and CLI-vs-MCP boundaries for recurring repository work.
- Reason: The user wants Codex and Claude Code to consistently choose CLI for local authoritative facts and MCP/connectors for live platform or structured external workflows.
- Evidence: `AGENTS.md` and `CLAUDE.md` now define CLI triggers for local git facts, local file/code inspection, npm/node/tsc/vitest verification, npm registry metadata, quick GitHub checks through `gh`, project hook health scripts, MCP package credential smoke tests, and external service CLIs only when explicitly in scope.

- Decision: Plan the next optimization cycle as six separate phases instead of one broad refactor.
- Reason: Package health, logging, MCP handler structure, type/cache hardening, encoding cleanup, and MCP integration tests have different risks and verification gates.
- Evidence: `docs/superpowers/plans/2026-06-14-project-optimization-roadmap.md` defines one independently verifiable task per optimization direction, with capability triggers, commands, acceptance gates, and rollback points.

- Decision: Use Markdown files as the default Codex-to-Claude communication channel for substantial implementation work.
- Reason: The user wants Codex and Claude Code to coordinate through durable Markdown artifacts instead of relying on transient chat context.
- Evidence: `docs/agent-memory/agent-communication.md` defines the handoff/report protocol and templates; `AGENTS.md` and `CLAUDE.md` require file-backed handoffs for release, package, credential, MCP tool, and multi-file implementation work.

- Decision: Do not name DeepSeek V4 as the fixed Claude Code execution model.
- Reason: The user clarified that Claude Code may no longer be using DeepSeek V4, and the concrete model can change by user choice or runtime configuration.
- Evidence: `AGENTS.md` and older planning prompts were updated to describe Claude Code as the implementation tool without hard-coding a model.
