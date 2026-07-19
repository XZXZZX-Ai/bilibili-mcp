# QA Checklist: Login Status Network Errors (Issue #10)

## QA Session

- Title: Login Status Network Errors
- Date: 2026-07-19
- Version or commit: `1.6.3` + Issue #10 source edits (uncommitted)
- Owner: Claude Code (via Paseo handoff)
- Related ticket, plan, PRD, or release: GitHub Issue #10
- QA type: `MCP tool change | credential flow | regression`

## Scope

In scope:

- `checkLoginStatus` network error propagation
- `throttledFetch` TypeError → NetworkError normalization
- `check_bilibili_credentials` MCP tool error shape on network failure
- Credential safety (no secrets in errors/logs)

Out of scope:

- Subtitle retrieval behavior
- Comment pagination
- MCP stdio startup
- npm publish or release workflow

## Preconditions

- [x] Current branch and commit recorded. (`master`, uncommitted changes)
- [x] Expected package version recorded. (`1.6.3`)
- [x] Required credentials are available only through approved external sources, not pasted into this file.
- [x] Test Bilibili video IDs or URLs are safe to share.
- [x] MCP client or local CLI environment is identified. (local build/tests only)

## Automated Baseline

Run when relevant:

```bash
npm run build
npm test
npx vitest run tests/bilibili-http.test.ts
npx vitest run tests/server-error-next-steps.test.ts
```

Results:

- Build: pass (tsc clean)
- Tests: 171/171 pass across 17 files (3 new HTTP tests and 1 new MCP error test)
- Pack: not run (package contents unchanged, per handoff)
- Skipped checks and reason: `npm pack --dry-run` skipped — no package metadata or file list changes

## Package And Install Path

- [x] `package.json` version matches the intended release or test version. (unchanged)
- [ ] `npm pack --dry-run` includes expected files and excludes tests, local config, `.env`, `.claude`, `.codex`, and docs not meant for npm. (not tested — package contents unchanged)
- [ ] `npm view @xzxzzx/bilibili-mcp version dist-tags --json` matches expected registry state when checking a published release. (not tested — no release)
- [ ] `npx -y @xzxzzx/bilibili-mcp@latest --help` or equivalent package smoke check works when relevant. (not tested — no release, no local global install)
- [ ] Local `bin`, `main`, `module`, and `types` still point to built `dist` output. (not rechecked — package metadata unchanged)

Notes:

- No package metadata changes. All install-path checks are deferred to the next release QA.

## MCP Stdio And Tool Discovery

- [ ] Starting the MCP server does not print non-JSON logs to stdout before JSON-RPC traffic. (not tested — no MCP client connected)
- [ ] `tools/list` returns the expected tool names. (not tested — tool list unchanged)
- [x] Tool descriptions do not expose credentials or misleading setup instructions. (verified — no tool schema changes)
- [x] Tool schemas match the intended public interface. (verified — no tool schema changes)

Expected tools:

- `get_credential_setup_instructions`
- `check_bilibili_credentials`
- `get_video_info`
- `get_video_transcript`
- `get_video_metadata`
- `get_video_comments`

Notes:

- Stdio and tool discovery deferred — no schema changes. The `check_bilibili_credentials` tool still returns the same shape on success; on network failure it now returns structured `NETWORK_ERROR` instead of a clean credential status.

## Credential States

Do not paste full Cookie values into this checklist.

- [x] No credentials: setup guidance is actionable and does not leak secrets. (verified — no credential-guidance.ts changes)
- [x] Invalid or expired credentials: error code and `next_steps` are useful and do not leak secrets. (verified — no changes to COOKIE_EXPIRED path)
- [ ] Valid credentials: `check_bilibili_credentials` reports configured/login status without exposing Cookie values. (not tested — no real credentials available in automated test)
- [ ] Credential setup flow points users to `npx -y @xzxzzx/bilibili-mcp config` and `npx -y @xzxzzx/bilibili-mcp check` when relevant. (not tested — not a setup change)

Notes:

- Network-down `check_bilibili_credentials` now returns structured `NETWORK_ERROR` (isError: true) instead of a clean credential status with `logged_in: false`. This is intentional per handoff.

## Tool Workflows

Use safe test videos and avoid recording private user data.

- [x] `get_video_metadata` returns stable metadata fields. (tested — no metadata changes)
- [ ] `get_video_info` returns expected video info and subtitle/description behavior. (not tested — no live Bilibili API calls)
- [ ] `get_video_transcript` handles available subtitles. (not tested — no live Bilibili API calls)
- [ ] `get_video_transcript` handles unavailable subtitles with clear fallback guidance. (not tested — no live Bilibili API calls)
- [ ] `get_video_comments` respects `detail_level`, `limit`, `sort`, and `include_replies`. (not tested — no live Bilibili API calls)
- [x] Validation errors are structured and useful for invalid BV IDs, URLs, language codes, or comment options. (verified — no validation changes)

Notes:

- All tool workflows deferred to manual testing or next release QA. No Bilibili API response shapes changed.

## Client Compatibility

Mark untested clients explicitly.

| Client | Version | Install method | Result | Notes |
|--------|---------|----------------|--------|-------|
| Claude Desktop |  |  | not tested | |
| Cursor |  |  | not tested | |
| Codex |  |  | not tested | |

## Documentation Checks

- [x] README install command matches actual package behavior. (no README changes)
- [x] Credential setup docs do not suggest putting Cookie values in MCP client config. (no docs changes)
- [x] README and README_EN agree on the supported setup path. (no README changes)
- [ ] Changelog or release notes mention user-visible changes. (not applicable — not a release)
- [ ] Known limitations are documented when behavior is intentionally partial. (not applicable — no new intentional partial behavior)

Notes:

- No documentation files changed. Changelog will need a `check_bilibili_credentials` network-error entry on the next release.

## Security And Privacy Checks

- [x] No full Cookie values, npm tokens, GitHub tokens, `.env` content, or private credentials appear in logs, reports, docs, tests, or package output. (verified via `grep -iE` diff scan)
- [x] Error messages and retry logs redact credential-like values. (verified — `redactSecrets` still used on all server catch paths, error messages are generic)
- [x] External inputs are validated before Bilibili API calls. (no input validation changes)
- [x] Network responses that may be large or redirected are bounded or rejected according to current policy. (no response handling changes)

Notes:

- Secret scan of scoped diff clean. No new logging paths introduce credential leakage.

## Result

- Overall result: `pass with caveats`
- Blocking issues: None
- Non-blocking caveats:
  1. `check_bilibili_credentials` now returns `isError: true` (NETWORK_ERROR) on network failure instead of `{configured: true, logged_in: false}` — intentional per handoff.
  2. Package, install, MCP stdio, and live client checks not performed — only automated tests and build verified.
  3. Real credential live testing not performed — no test Bilibili account used.
- Follow-up tickets: None
- Codemap update status: Checked unchanged (`http.ts` entry still accurate)
- Research note link, if external facts affected QA: None
