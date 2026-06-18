# Task Ticket: MCP Update Guidance

- ID: 2026-06-18-mcp-update-guidance
- Title: Add package update guidance for MCP users
- Status: done
- Owner: Codex
- Source: User request, "假如用户使用了我的mcp,然后我更新了mcp,那么该怎么完善才能让用户的mcp也获得更新呢" followed by "帮我完善"
- Parent plan or PRD: none
- Blocking tickets: none
- Blocked by: none

## Objective

Make update discovery explicit for users and installing agents by recommending `@latest` MCP configs and exposing a safe version/update check through both MCP and CLI.

## Scope

In scope:

- Add `check_mcp_update` as a no-input MCP tool.
- Add `bilibili-mcp check-update` as a CLI command.
- Return current version, npm latest version, update availability, recommended `npx @latest` config, and manual global update commands.
- Update credential/setup guidance and README examples to prefer `@latest`.
- Add tests and verification for the new public tool and utility.

Out of scope:

- Do not auto-update packages.
- Do not print update notices during MCP stdio startup.
- Do not change credential storage, Cookie handling, Bilibili API behavior, package metadata, release workflow, or npm publish state.

## Files To Inspect Or Edit

Expected inspect:

- `src/server/tool-schemas.ts`
- `src/server/tool-handlers.ts`
- `src/cli.ts`
- `src/utils/credential-guidance.ts`
- `README.md`
- `README_EN.md`
- MCP server and credential tests

Expected edit:

- `src/utils/update-check.ts`
- `src/server/tool-schemas.ts`
- `src/server/tool-handlers.ts`
- `src/cli.ts`
- `src/utils/credential-guidance.ts`
- `src/bilibili/http.ts`
- `src/bilibili/subtitle.ts`
- `tests/update-check.test.ts`
- MCP tool and credential tests
- `README.md`
- `README_EN.md`
- `docs/agent-memory/codemap.md`
- `docs/qa/2026-06-18-mcp-update-guidance.md`
- `docs/agent-memory/verification-log.md`

Do not touch:

- Cookie values, `.env`, tokens, package version, release workflow, generated `dist/` by manual edits.

## Required Capabilities

Skills:

- `bilibili-mcp-memory`
- `product-requirements`
- `vitest`

Subagents:

- None used.

MCP/tools/CLI:

- Local `rg`, `npm run build`, `npm test`, `npm pack --dry-run`, `node dist/cli.js check-update`.

## Acceptance Criteria

- [x] `check_mcp_update` appears in MCP `tools/list` with no required input.
- [x] `check_mcp_update` returns safe update guidance without Cookie values.
- [x] `bilibili-mcp check-update` prints current/latest version and update commands.
- [x] README and README_EN recommend `@latest` for MCP config and credential helper commands.
- [x] Public MCP tool order tests and smoke tests are updated for 7 tools.
- [x] Credentials, Cookies, tokens, `.env` content, and private values are not printed or committed.
- [x] `docs/agent-memory/codemap.md` is updated for the new tool, utility, and tests.

## Verification

Required commands:

```bash
npm run build
npm test
```

Additional commands:

```bash
npm test -- tests/update-check.test.ts tests/server-tools.test.ts tests/server-credential-tools.test.ts tests/mcp-server-smoke.test.ts tests/credential-guidance.test.ts tests/server-error-next-steps.test.ts
node dist/cli.js check-update
npm pack --dry-run
rg --pcre2 -n "npx -y @xzxzzx/bilibili-mcp(?!@)|npm install -g @xzxzzx/bilibili-mcp(?!@)" src tests README.md README_EN.md
```

Manual checks:

- Confirm no update notice is emitted during stdio startup.
- Confirm package dry-run excludes tests, docs, `.codex`, `.claude`, and `.env`.

## Risks And Rollback

Risks:

- npm registry may be unreachable; the tool should return unknown latest/update state rather than throwing.
- Adding a public MCP tool changes `tools/list`; tests must pin the intended new order.

Rollback:

- Remove `src/utils/update-check.ts`, remove `check_mcp_update` schema/handler, remove CLI `check-update`, revert README command changes and test updates, then rerun build/tests.

## Stop And Report Conditions

Stop if:

- Update checking requires automatic package mutation.
- npm registry errors break MCP tool calls instead of returning unknown state.
- stdio startup prints update information to stdout.
- A real credential or secret appears in docs, tests, logs, or package output.

## Completion Report

- Files changed: implementation, tests, README/README_EN, codemap, QA checklist, verification log, this ticket.
- Commands run: build, focused tests, full tests, real CLI check-update, pack dry-run, stale command scan.
- Skipped checks: no real MCP client UI smoke; covered by CLI, handler, and stdio smoke tests.
- Subagent/skill/tool capabilities used: `bilibili-mcp-memory`, `product-requirements`, `vitest`, local CLI.
- Codemap update status: updated.
- Unresolved risks or decision points: none known.
