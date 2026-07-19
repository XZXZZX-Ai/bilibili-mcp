# Codex To Claude Handoff: Hono Security Update

## Objective

Remove the current high-severity production dependency audit finding before v1.6.4 by updating only the vulnerable transitive Hono lock entry to a patched compatible release.

## Current State

- `npm audit --omit=dev` reports one high finding for transitive `hono 4.12.23`.
- Advisory ranges affect versions below 4.12.25; npm proposes `hono 4.12.31`.
- The path is `@modelcontextprotocol/sdk@1.27.1 -> hono` / `@hono/node-server -> hono`.
- `package.json` already allows the compatible SDK dependency tree; no direct dependency or public API change is expected.

## Files To Inspect

- `package.json`
- `package-lock.json`
- `.github/workflows/publish.yml`
- `docs/agent-memory/harness-security.md`

## Files To Edit

- `package-lock.json` only, unless npm proves the lock-only update cannot close the finding.
- `docs/agent-memory/handoffs/2026-07-20-hono-security-update-claude-report.md`

## Required Capability

- Use the project `package-maintainer` subagent for lockfile and package-surface verification.
- Use `risk-reviewer` after the update.
- Apply the `secret-scanning` and minimal security-fix constraints from the Codex handoff.
- Do not use Superpowers.

## Constraints

- Use npm tooling; never hand-edit lockfile dependency data.
- Prefer the narrowest compatible lock-only update that installs Hono >=4.12.25.
- Do not bump `@modelcontextprotocol/sdk`, add overrides, add dependencies, or change package scripts unless the narrow lock update is impossible; stop and report first.
- Do not change application source, tests, version, changelog, README, workflow, tags, issues, or release state.
- Never print or store auth tokens or credentials.
- No commit, push, tag, release, or npm publish.

## Execution Steps

1. Reproduce the production audit finding and dependency path.
2. Use npm to update only the Hono lock resolution to a patched compatible version.
3. Confirm the lockfile diff is limited and package.json is unchanged.
4. Run clean install/package gates and write the required report.

## Verification Commands

```powershell
npm ls hono @modelcontextprotocol/sdk
npm audit --omit=dev
npm ci
npm run build
npm test
npm pack --dry-run --json
git diff --check
```

## Acceptance Criteria

- Installed/locked Hono is at least 4.12.25.
- `npm audit --omit=dev` reports zero vulnerabilities.
- `package.json` is unchanged.
- The package-lock diff contains no unrelated dependency refresh.
- Build, all tests, package dry-run, and diff check pass.
- Published file allowlist and entry points remain unchanged.

## Things Not To Change

- No production code, MCP schema, credentials, workflow, package version, changelog, README, or generated learning queue.

## Stop And Report If

- npm requires a direct dependency, override, SDK bump, or broad lockfile refresh.
- Any verification gate fails for reasons outside this narrow change.

## Expected Claude Report

Write `docs/agent-memory/handoffs/2026-07-20-hono-security-update-claude-report.md` using the repository report template, including the vulnerable path, exact lock diff, commands/results, package contents, remaining risks, subagents used, and Harness Artifacts.
