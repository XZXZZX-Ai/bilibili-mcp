# Task Ticket: README Sync And v1.7.1 Source Preparation

- ID: README-V1.7.1
- Status: `done`
- Owner: `Claude Code`
- Source: User request on 2026-07-20

## Objective

Synchronize the Chinese and English READMEs with the current repository and prepare patch version `1.7.1` without publishing a release.

## Scope

In scope:

- Correct stale release, tool-count, test-count, runtime configuration, build, and collaboration-workflow documentation.
- Keep Chinese and English READMEs equivalent.
- Add bilingual `1.7.1` changelog entries and bump package/lock versions.
- Update project memory with verified source-preparation status.

Out of scope:

- MCP behavior, dependencies, tags, npm publication, GitHub Release, workflow YAML, or PR creation.

## Files To Inspect Or Edit

Expected edit: `README.md`, `README_EN.md`, `CHANGELOG.md`, `CHANGELOG_EN.md`, `package.json`, `package-lock.json`, and directly relevant `docs/agent-memory/` records.

Do not touch: `docs/agent-memory/pending-learning-proposals.md`, credentials, generated `dist/`, or unrelated source/tests.

## Acceptance Criteria

- [x] README facts match the eight-tool, 244-test current source and document `BILIBILI_CACHE_SIZE`.
- [x] Stale `v1.6.4`, seven-tool, and 180-test claims are removed from current README prose.
- [x] `package.json` and `package-lock.json` report `1.7.1`.
- [x] Bilingual changelog entries accurately describe the maintenance patch.
- [x] Build, tests, package dry run, diff check, and scoped secret scan pass.
- [x] No tag, publish, release, PR, or commit/push is performed by Claude Code.

## Verification

```bash
npm run build
npm test
npm pack --dry-run --json
git diff --check
```

## Stop And Report Conditions

Stop if a public behavior change, dependency change, secret, failing required gate, or broader refactor is required.
