# Research Note: Matt Pocock Skills Workflow

## Research Topic

- Topic: Current `mattpocock/skills` engineering workflow and repository setup contract
- Date: 2026-07-19
- Owner: Codex
- Related ticket: `HARNESS-2026-07-19-MATT`
- Refresh before: Updating the Matt workflow rules or reinstalling the collection

## Question

Which current upstream skills and repository configuration are required to integrate `mattpocock/skills` into this project's Codex-to-Claude workflow?

## Context

The collection is already installed locally, but this repository did not define its issue tracker, triage vocabulary, domain-doc layout, or precedence relative to project-specific handoff, security, verification, and Git rules.

## Sources

| Source | Type | Date checked | Notes |
|---|---|---|---|
| `https://github.com/mattpocock/skills/tree/main/skills/engineering` | upstream source | 2026-07-19 | Live directory checked through GitHub API |
| `https://github.com/mattpocock/skills/tree/main/skills/productivity` | upstream source | 2026-07-19 | Live directory checked through GitHub API |
| Local `setup-matt-pocock-skills`, `ask-matt`, `to-spec`, `to-tickets`, and `implement` skill files | installed source copy | 2026-07-19 | Used to inspect setup, routing, issue, implementation, review, and commit expectations |

## Findings

- The current upstream collection exposes 17 engineering skills and 5 productivity skills; every current name exists in both `C:\Users\ZX\.codex\skills` and `C:\Users\ZX\.claude\skills`.
- `setup-matt-pocock-skills` requires a configured issue tracker, triage vocabulary, and domain-doc layout before the engineering flow is used.
- The main Matt flow is discovery through `grill-with-docs`, then `to-spec` and `to-tickets` for multi-session work, followed by bounded `implement` tasks using TDD and code review.
- The upstream `implement` skill commits by default, which conflicts with this repository's rule that commits require explicit user authorization.

## Applicability To This Project

Applies:

- GitHub Issues can hold Matt specifications and dependency-aware tickets.
- Existing file-backed Codex-to-Claude handoffs remain useful as implementation contracts with repository-specific checks.
- Matt's domain and codebase-design vocabulary fits the existing project skills.

Does not apply unchanged:

- Automatic commits, autonomous agent flows, or any weakening of credential, release, verification, and harness-security rules.

## Decision Impact

- Use Matt skills for the development workflow and do not invoke Superpowers skills in this repository.
- Keep project-specific fixed skills and subagents for tests, credentials, packages, releases, and security.
- Treat GitHub issues as planning records and file-backed handoffs as execution boundaries.

## Risks And Unknowns

- Upstream skills can change; refresh this note before changing workflow rules.
- The four missing default labels were created after the user approved the vocabulary; the existing `wontfix` label was preserved.
- The workflow should be evaluated after several real feature and bug tasks to detect duplicated process.

## Follow-Up

- [ ] Evaluate the Matt workflow after real use and decide whether any existing project trigger is redundant.
