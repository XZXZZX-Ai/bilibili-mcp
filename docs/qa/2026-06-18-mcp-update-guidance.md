# QA Session: MCP Update Guidance

- Title: MCP update guidance and package freshness tool
- Date: 2026-06-18
- Version or commit: working tree, package version `1.6.0`
- Owner: Codex
- Related ticket, plan, PRD, or release: `docs/agent-memory/handoffs/2026-06-18-mcp-update-guidance-task-ticket.md`
- QA type: `MCP tool change | package/install | docs/install | regression`

## Scope

In scope:

- `check_mcp_update` MCP tool discovery and response shape.
- `bilibili-mcp check-update` CLI behavior.
- `@latest` MCP install/update guidance in README and README_EN.
- Build, tests, package dry-run, and stale command scan.

Out of scope:

- Real npm publish, GitHub Release, tag, push, or PR.
- Real MCP client UI setup across all documented clients.
- Real Bilibili Cookie validation.

## Preconditions

- [x] Current branch recorded: `master`.
- [x] Expected package version recorded: `1.6.0`.
- [x] Required credentials are not needed for this QA.
- [x] Test Bilibili video IDs or URLs are not needed for this QA.
- [x] Local CLI environment is identified: Node/npm workspace on Windows PowerShell.

## Automated Baseline

Results:

- Build: pass, `npm run build`.
- Tests: pass, focused 6 files / 37 tests; full suite 16 files / 145 tests.
- Pack: pass, `npm pack --dry-run`, 116 files.
- Skipped checks and reason: no real MCP client UI smoke because this change is covered by handler tests, stdio smoke, CLI check, and docs review.

## Package And Install Path

- [x] `package.json` version is `1.6.0`.
- [x] `npm pack --dry-run` includes `dist`, `README.md`, `README_EN.md`, `LICENSE`, and `package.json`.
- [x] `npm pack --dry-run` excludes `tests/`, `docs/agent-memory/`, `.claude/`, `.codex/`, and `.env`.
- [x] `node dist/cli.js check-update` reached npm latest and reported current `1.6.0` against npm latest `1.5.3`.
- [x] Local `bin`, `main`, `module`, and `types` still point to built `dist` output.

Notes:

- No publish or dist-tag mutation was performed.

## MCP Stdio And Tool Discovery

- [x] Existing stdio smoke test verifies startup logs stay on stderr and stdout stays clean.
- [x] `tools/list` now returns 7 expected tool names.
- [x] Tool descriptions do not expose credentials.
- [x] Tool schemas match the intended public interface.

Expected tools:

- `get_credential_setup_instructions`
- `check_bilibili_credentials`
- `check_mcp_update`
- `get_video_info`
- `get_video_comments`
- `get_video_transcript`
- `get_video_metadata`

Notes:

- Tool order is pinned in `tests/server-tools.test.ts` and `tests/mcp-server-smoke.test.ts`.

## Credential States

- [x] No credentials: setup guidance remains actionable and does not leak secrets.
- [x] Invalid or expired credentials: tested next-step string updates through existing error next-step coverage.
- [ ] Valid credentials: not tested; unrelated to update guidance.
- [x] Credential setup flow points users to `npx -y @xzxzzx/bilibili-mcp@latest config` and `npx -y @xzxzzx/bilibili-mcp@latest check`.

Notes:

- No Cookie values were used or recorded.

## Tool Workflows

- [x] `check_mcp_update` returns current/latest/update status and update commands with a mocked npm latest response.
- [x] `check_mcp_update` handles registry failure by returning unknown latest/update state.
- [x] Existing content tool regression suite passed.

Notes:

- No content-fetching workflow was changed.

## Client Compatibility

| Client | Version | Install method | Result | Notes |
|--------|---------|----------------|--------|-------|
| Codex | not recorded | `npx -y @xzxzzx/bilibili-mcp@latest` docs path | not tested | Documentation updated. |
| Other | not recorded | README client examples | not tested | Command snippets updated mechanically for package spec. |

## Documentation Checks

- [x] README install command matches actual package behavior.
- [x] Credential setup docs do not suggest putting Cookie values in MCP client config.
- [x] README and README_EN agree on `@latest` setup path.
- [ ] Changelog or release notes mention user-visible changes.
- [x] Known limitation documented: global installs require manual update.

Notes:

- Changelog was not updated because no release was requested in this turn.

## Security And Privacy Checks

- [x] No full Cookie values, npm tokens, GitHub tokens, `.env` content, or private credentials appear in the new tool response or tests.
- [x] Error messages continue to use safe setup commands.
- [x] New update tool has no user input to validate.
- [x] npm registry failure is handled without throwing from the utility.

Notes:

- `check_mcp_update` does not auto-update packages or mutate local/global installs.

## Result

- Overall result: pass with caveats
- Blocking issues: none
- Non-blocking caveats: no real MCP client UI smoke; changelog not updated because no release was requested.
- Follow-up tickets: none.
- Codemap update status: updated.
- Research note link, if external facts affected QA: none; live npm state was checked through CLI.
