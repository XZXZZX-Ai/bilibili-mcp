# Lessons Learned

## 2026-05-27

- Lesson: Do not assume `.agents\skills` skills are available to Claude Code.
- Evidence: `vitest`, `secret-scanning`, and `github-actions-docs` were first installed under `.agents\skills`; Claude Code needed copies under `.claude\skills`.
- Future behavior: Check the target agent's actual skill directory before claiming a skill is installed for that agent.

- Lesson: Removing hard-coded Bilibili Cookie values must not remove Cookie-based subtitle access.
- Evidence: User clarified that subtitles may require Cookie access.
- Future behavior: Externalize credentials while preserving authenticated retrieval paths.

- Lesson: Some existing Markdown and terminal output can contain mojibake.
- Evidence: `AGENTS.md` and `CLAUDE.md` include encoding safety rules.
- Future behavior: Verify files as UTF-8 before copying or rewriting Chinese text.

## 2026-05-28

- Lesson: The project `.codex\` directory can be suitable for hook configuration but not necessarily for mutable runtime logs.
- Evidence: A dry run of `post_tool_use.py --agent codex` failed with Windows access denial when creating `.codex\memory`.
- Future behavior: Store Codex runtime hook observations under `C:\Users\ZX\.codex\memories\bilibili-mcp\`.

## 2026-06-04

- Lesson: Separate "memory capture worked" from "learning proposal promoted" when evaluating the agent memory system.
- Evidence: Phase 2 and Phase 3 verification entries were written to `docs/agent-memory/verification-log.md`, and both Codex and Claude hook runtime files existed, but `pending-learning-proposals.md` had no proposals above threshold.
- Future behavior: Report these as different states: formal verification memory can be complete even when controlled learning has no approved promotion.

- Lesson: Active-plan tracking should filter both candidate plans and previous runtime state through the same tracked-plan rule.
- Evidence: `plan_tracker.py` initially ignored non-implementation plans in fresh resolution but still preserved an old unchecked previous plan from runtime state; adding the same eligibility check to `previous_plan` fixed Codex and Claude runtime state.
- Future behavior: Before starting a new phase or relying on phase-gated learning reminders, run `python .codex/scripts/plan_tracker.py` and regenerate learning proposals for both `codex` and `claude` to confirm runtime state follows the intended plan.

- Lesson: Release workflow guidance must be refreshed from official documentation when touching npm trusted publishing or GitHub Actions OIDC.
- Evidence: Phase 4 Task 5 checked npm Trusted Publishers, npm provenance statements, GitHub Actions permissions, and GitHub Node.js package publishing docs before changing `.github/workflows/publish.yml`.
- Future behavior: Do not rely on stale memory for Node/npm minimums, provenance, OIDC permissions, or registry setup; re-check official docs before release workflow edits.

- Lesson: A polished publish workflow is not the same as a completed release.
- Evidence: Phase 4 updated README, changelogs, package metadata, and publish workflow, but final verification explicitly recorded no tag, no GitHub release, and no npm publish.
- Future behavior: When the user asks to start release execution, include npm trusted publishing setup confirmation, final local verification, tag push, Actions monitoring, and post-publish release notes as separate gates.

- Lesson: `npm install -g npm@latest` is acceptable as a trusted-publishing compatibility measure but remains a moving CI target.
- Evidence: Phase 4 kept this step to satisfy npm CLI trusted publishing support while recording it as a remaining release risk.
- Future behavior: Before long-term release automation hardening, consider pinning npm to a known compatible version instead of relying on `latest`.
