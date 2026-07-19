# Codex To Claude Handoff: MCP Server Version Synchronization

## Update Goal

Fix MCP initialization metadata so it reports the current npm package version instead of the stale hard-coded `1.0.0`.

## Current Judgment

`package.json` is the existing source of truth (`1.6.4`), while `src/server.ts` constructs the SDK `Server` with `version: "1.0.0"`. The smallest durable fix is to derive server metadata from `package.json` using Node/TypeScript features already available and leave all tool behavior unchanged.

## Recommended Approach

- Follow `docs/agent-memory/handoffs/2026-07-20-mcp-server-version-task-ticket.md`.
- Reuse `package.json.version`; do not create another version constant or add a dependency.
- Add one focused Vitest assertion that catches future drift.
- Prefer the smallest Node ESM-compatible implementation that passes the repository's Node16 TypeScript module configuration and works from built `dist/server.js`.

## Things To Avoid

- Do not edit the package version, lockfile, `dist/`, tool schemas, handlers, README, changelog, or release workflow.
- Do not touch the pre-existing modification to `docs/agent-memory/pending-learning-proposals.md`.
- Do not attempt an encoding rewrite; the earlier mojibake was terminal display only and explicit UTF-8 checks passed.
- Do not commit, push, publish, or create a PR.

## Claude Code Execution Steps

1. Read the task ticket and inspect `package.json`, `src/server.ts`, and `tests/mcp-server-smoke.test.ts`.
2. Use the `vitest` skill and name/use the `test-baseline-builder` subagent for the regression work as required by repository rules.
3. Add the focused regression first or demonstrate it would fail against the old hard-coded value.
4. Make the minimum implementation change so server metadata reads the package version from the existing source of truth.
5. Run `npm run build` and `npm test`.
6. Use/name `risk-reviewer` for a narrow post-change regression review.
7. Write `docs/agent-memory/handoffs/2026-07-20-mcp-server-version-claude-report.md` using the repository report template, including the required `Harness Artifacts` section.

## Acceptance Criteria

- MCP server metadata version equals `package.json.version`.
- The regression detects future divergence.
- No dependency, duplicated version, package/release change, or unrelated cleanup is introduced.
- Build and all tests pass.

## Risks

- Runtime package-path resolution must work from compiled `dist/server.js`.
- Tests should not depend unnecessarily on unstable MCP SDK internals.
- Package consumers must still receive package metadata through normal npm packaging.

## Stop And Report If

Stop if the work needs broader packaging changes, another dependency, a package version bump, public tool changes, or edits outside the expected source/test files plus the required report.

## Expected Claude Report

Include files changed, commands and exact results, regression evidence, skipped checks, unresolved risks, subagents/capabilities used, and Harness Artifacts status.
