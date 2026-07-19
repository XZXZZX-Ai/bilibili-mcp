# Domain Docs

This is a single-context repository. Matt Pocock engineering skills should consume domain documentation using the following layout:

```text
/
|- CONTEXT.md
|- docs/adr/
`- src/
```

## Before Exploring

- Read `CONTEXT.md` when it exists.
- Read ADRs under `docs/adr/` that affect the area being changed.
- If these files do not exist, continue silently. `domain-modeling`, `grill-with-docs`, or `improve-codebase-architecture` may create them lazily when terminology or a durable decision actually needs recording.

## Vocabulary

- Use terms as defined in `CONTEXT.md` in issues, handoffs, tests, and implementation reports.
- Do not introduce synonyms for an established domain term without explaining the change.
- If a required concept is missing or overloaded, use `domain-modeling` before treating a new term as durable.

## ADR Conflicts

If a proposed change conflicts with an existing ADR, surface the conflict and stop for a user or Codex decision instead of silently overriding it.
