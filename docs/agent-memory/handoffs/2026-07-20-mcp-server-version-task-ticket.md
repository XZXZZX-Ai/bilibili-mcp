# Task Ticket: Keep MCP Server Version In Sync

## Ticket

- ID: local-2026-07-20-mcp-server-version
- Title: Report the package version in MCP server metadata
- Status: `done`
- Owner: `Claude Code`
- Source: User-requested fix after Codex repository orientation

## Objective

Make MCP initialization metadata report the version from `package.json` instead of the stale hard-coded `1.0.0`, with a regression test that fails when the two versions drift.

## Scope

In scope:

- Use the existing package version as the single source of truth for `Server` metadata.
- Add the smallest deterministic Vitest regression.

Out of scope:

- Changing the npm package version.
- Changing MCP tool names, schemas, or response shapes.
- Fixing terminal display encoding; UTF-8 source content is already valid.
- Commits, pushes, releases, or dependency additions.

## Files To Inspect Or Edit

Expected inspect:

- `package.json`
- `src/server.ts`
- `tests/mcp-server-smoke.test.ts`

Expected edit:

- `src/server.ts`
- `tests/mcp-server-smoke.test.ts`

Do not touch:

- `docs/agent-memory/pending-learning-proposals.md`
- package version, lockfile, generated `dist/`, credentials, release workflow

## Required Capabilities

- Skill: `vitest`
- Claude Code subagent: `test-baseline-builder` for the regression; `risk-reviewer` for the final narrow review
- CLI: `npm run build`, `npm test`

## Acceptance Criteria

- [ ] MCP server metadata version equals `package.json.version` (`1.6.4` at task start).
- [ ] Future package version changes cannot leave the server metadata silently stale.
- [ ] No new dependency or manual duplicated version constant is introduced.
- [ ] Existing MCP tool names, schemas, and responses remain unchanged.
- [ ] `npm run build` and `npm test` pass.
- [ ] No credentials or secrets are printed or committed.
- [ ] Codemap is checked and left unchanged unless ownership or flow changes.

## Verification

```bash
npm run build
npm test
```

## Stop And Report Conditions

Stop and report if the fix requires changing the package version, package contents, public tool behavior, dependencies, release workflow, or more than the two expected source/test files.
