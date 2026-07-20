# Harness Eval

This file tracks whether the agent-assisted development harness is improving the project or adding unnecessary process. Use it for periodic workflow reviews, not for ordinary code tasks.

## Evaluation Triggers

Create or update an evaluation entry when:

- a roadmap phase or multi-task optimization cycle completes
- a release completes, especially if release automation, QA, or security review was involved
- several harness changes land together, such as new templates, skills, subagents, hooks, MCP/tool rules, or memory rules
- a workflow feels slower, heavier, or more error-prone than before
- a skill, subagent, hook, template, or fixed trigger may be redundant or harmful
- the user asks whether the Codex + Claude Code workflow is working well

Do not update this file for routine small bug fixes, narrow tests-only changes, or one-off implementation reports.

## Current Evaluation Backlog

Use this section to list harness components that should be evaluated after real use.

- `docs/agent-memory/codemap.md`: check whether it reduces repeated file discovery and improves handoff quality.
- `docs/templates/task-ticket.md`: check whether the three-tier ticket standard prevents scope drift without slowing small tasks.
- `docs/templates/research-note.md` and `docs/research/`: check whether external findings are easier to reuse.
- `docs/templates/qa-checklist.md` and `docs/qa/`: check whether real user workflow issues are caught before or after releases.
- `docs/agent-memory/harness-security.md`: check whether harness-surface changes become safer without becoming bureaucratic.
- Fixed skill/subagent/MCP/CLI triggers in `AGENTS.md` and `CLAUDE.md`: check whether agents choose capabilities more predictably.
- Matt Pocock workflow integration: after several real tasks, check whether GitHub specs/tickets plus file-backed handoffs improve continuity without duplicated planning artifacts and confirm that no Superpowers skill was invoked.
- Paseo execution bridge: after several delegated tasks, check whether one-agent Codex-to-Claude execution removes manual handoff work without causing overlapping edits, hidden decision points, or noisy repair loops.

## Entry Template

Copy this section for each evaluation.

### YYYY-MM-DD Harness Eval: <topic>

#### Period

- Start:
- End:
- Related tasks, tickets, releases, or plans:

#### Harness Changes Under Review

-

#### Signals

Useful positive signals:

-

Useful negative signals:

-

Candidate metrics:

- repeated file-discovery steps avoided:
- task-ticket uses:
- task-ticket skips that were appropriate:
- task-ticket uses that felt too heavy:
- codemap updates:
- codemap checked-and-unchanged reports:
- research notes created and reused:
- QA checklists created:
- issues caught before release:
- issues missed until after release:
- subagent/skill trigger mismatches:
- failed or noisy hook observations:

#### Findings

-

#### Keep / Change / Remove

Keep:

-

Change:

-

Remove or stop using:

-

#### Decisions Or Follow-Up

- [ ]

#### Memory Updates Needed

- [ ] `project-facts.md`
- [ ] `decisions.md`
- [ ] `lessons-learned.md`
- [ ] `codemap.md`
- [ ] `harness-security.md`
- [ ] `AGENTS.md`
- [ ] `CLAUDE.md`

### 2026-07-20 Harness Eval: v1.6.4 multi-ticket release preparation

#### Period

- Start: 2026-07-19
- End: 2026-07-20 pre-release review
- Related tasks, tickets, releases, or plans: GitHub Issues #2-#15 and v1.6.4

#### Harness Changes Under Review

- Matt GitHub tickets, file-backed Codex-to-Claude handoffs, one-agent Paseo execution, project QA records, capability triggers, and stop-summary reminders.

#### Signals

Useful positive signals:

- Focused tickets kept thirteen reliability fixes independently testable and made the final release diff separable into scoped commits.
- File-backed handoffs and reports preserved exact commands, constraints, skipped checks, and decision points across repeated implementation runs.
- Release review found and fixed two missing WBI retry regressions, added direct hook-script tests, excluded the generated learning queue, and caught a production Hono advisory before publication.

Useful negative signals:

- Repeated per-ticket reports created substantial documentation volume, and several delegated risk-review subagents stalled or needed top-level fallback review.
- The final release still required a separate consolidation pass to distinguish production blockers from development-only audit findings.

Candidate metrics:

- task-ticket uses: 14 GitHub Issues
- QA checklists created: release plus focused comment-pagination QA
- issues caught before release: missing WBI retry coverage, untested hook branching, production Hono advisory, generated learning queue exclusion
- issues missed until after release: 0 at pre-release cutoff
- subagent/skill trigger mismatches: 0; stalled reviews were completed through bounded fallback

#### Findings

- The workflow improved containment and auditability for a multi-ticket release, but the per-ticket reporting layer is heavier than necessary for future low-risk changes.
- One Paseo implementation agent remains the right default. Independent release verification adds value at the final boundary; additional autonomous agent trees would add noise.

#### Keep / Change / Remove

Keep:

- GitHub ticket as planning source, file-backed handoff for substantial implementation, one Paseo agent, focused tests, and independent final release verification.

Change:

- Use lighter reports for single-file, behavior-preserving fixes and consolidate repeated verification evidence into the release QA record.

Remove or stop using:

- Do not retry stalled review subagents indefinitely; use the documented top-level bounded fallback and record the gap.

#### Decisions Or Follow-Up

- [ ] Address development-only npm audit findings in a separate tooling-maintenance task rather than broadening v1.6.4.
- [ ] Re-evaluate report volume after the next multi-ticket release.

#### Memory Updates Needed

- [x] `project-facts.md`
- [ ] `decisions.md`
- [x] `lessons-learned.md`
- [x] `codemap.md`
- [x] `harness-security.md`
- [x] `AGENTS.md`
- [x] `CLAUDE.md`

### 2026-07-20 Harness Eval: v1.7.1 patch release

#### Period

- Start/End: 2026-07-20
- Related task: README/config cleanup patch and `v1.7.1` release

#### Signals And Finding

- One bounded Paseo release-verifier found and corrected a stale changelog claim before tagging.
- Independent Codex gates and the existing tag-triggered trusted-publishing workflow completed without repair.
- The existing one-agent handoff plus top-level verification remains sufficient for a patch release; no additional agent or workflow layer is needed.

#### Keep / Change / Remove

- Keep: bounded release handoff, explicit exclusion of generated learning state, and post-publish npm/provenance/CLI checks.
- Change: none.
- Remove: no additional release scaffolding.

### 2026-07-20 Harness Eval: v1.7.2 feature release

- The existing one-agent preparation plus Codex release gates caught a missing text-length guard before publication and kept the generated learning queue out of both commits.
- Current official npm/GitHub checks confirmed the existing OIDC workflow needed no edit; the tag-triggered release passed without repair.
- Keep the same bounded handoff and independent final verification. Do not add another release layer; report accuracy and scoped staging remain the useful controls.
