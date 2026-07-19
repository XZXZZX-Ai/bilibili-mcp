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
