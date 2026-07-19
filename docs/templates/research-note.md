# Research Note Template

Use this template when external facts affect a project decision and the findings should be cached for later agents. Do not use it for local repository facts that can be verified directly with `rg`, file reads, tests, or package commands.

## Research Topic

- Topic:
- Date:
- Owner:
- Related task, PRD, ticket, or plan:
- Refresh before:

## Question

State the concrete question this research answers.

Examples:

- What does the current MCP SDK require for a server behavior?
- What are the current npm trusted publishing requirements?
- What does a third-party repo actually implement?
- Has Bilibili API behavior changed in a way that affects this project?

## Context

Why this matters for `@xzxzzx/bilibili-mcp`:

-

What decision or implementation this may affect:

-

## Sources

Use primary or authoritative sources when possible. Prefer official docs, source code, release notes, standards, and live CLI/API output over blog posts.

| Source | Type | Date checked | Notes |
|--------|------|--------------|-------|
|  | official docs / source / release notes / CLI output / issue / other |  |  |

## Findings

-
-
-

## Applicability To This Project

Applies:

-

Does not apply:

-

## Decision Impact

Recommended project action:

-

Rules or files that may need updates:

-

## Risks And Unknowns

-

## Staleness Notes

Refresh this research when:

- the relevant SDK, API, npm/GitHub behavior, MCP spec, or third-party project changes
- release/publish workflow is edited
- this finding is used for a new implementation decision after a long delay

## Follow-Up

- [ ]
