# QA Checklist Template

Use this template for human-facing QA before or after changes that affect real MCP installation or user workflows. It is not required for routine internal refactors that do not change public behavior.

## QA Session

- Title:
- Date:
- Version or commit:
- Owner:
- Related ticket, plan, PRD, or release:
- QA type: `pre-release | post-release | MCP tool change | credential flow | package/install | docs/install | regression`

## Scope

In scope:

-

Out of scope:

-

## Preconditions

- [ ] Current branch and commit recorded.
- [ ] Expected package version recorded.
- [ ] Required credentials are available only through approved external sources, not pasted into this file.
- [ ] Test Bilibili video IDs or URLs are safe to share.
- [ ] MCP client or local CLI environment is identified.

## Automated Baseline

Run when relevant:

```bash
npm run build
npm test
npm pack --dry-run
```

Results:

- Build:
- Tests:
- Pack:
- Skipped checks and reason:

## Package And Install Path

- [ ] `package.json` version matches the intended release or test version.
- [ ] `npm pack --dry-run` includes expected files and excludes tests, local config, `.env`, `.claude`, `.codex`, and docs not meant for npm.
- [ ] `npm view @xzxzzx/bilibili-mcp version dist-tags --json` matches expected registry state when checking a published release.
- [ ] `npx -y @xzxzzx/bilibili-mcp@latest --help` or equivalent package smoke check works when relevant.
- [ ] Local `bin`, `main`, `module`, and `types` still point to built `dist` output.

Notes:

-

## MCP Stdio And Tool Discovery

- [ ] Starting the MCP server does not print non-JSON logs to stdout before JSON-RPC traffic.
- [ ] `tools/list` returns the expected tool names.
- [ ] Tool descriptions do not expose credentials or misleading setup instructions.
- [ ] Tool schemas match the intended public interface.

Expected tools:

- `get_credential_setup_instructions`
- `check_bilibili_credentials`
- `get_video_info`
- `get_video_transcript`
- `get_video_metadata`
- `get_video_comments`

Notes:

-

## Credential States

Do not paste full Cookie values into this checklist.

- [ ] No credentials: setup guidance is actionable and does not leak secrets.
- [ ] Invalid or expired credentials: error code and `next_steps` are useful and do not leak secrets.
- [ ] Valid credentials: `check_bilibili_credentials` reports configured/login status without exposing Cookie values.
- [ ] Credential setup flow points users to `npx -y @xzxzzx/bilibili-mcp config` and `npx -y @xzxzzx/bilibili-mcp check` when relevant.

Notes:

-

## Tool Workflows

Use safe test videos and avoid recording private user data.

- [ ] `get_video_metadata` returns stable metadata fields.
- [ ] `get_video_info` returns expected video info and subtitle/description behavior.
- [ ] `get_video_transcript` handles available subtitles.
- [ ] `get_video_transcript` handles unavailable subtitles with clear fallback guidance.
- [ ] `get_video_comments` respects `detail_level`, `limit`, `sort`, and `include_replies`.
- [ ] Validation errors are structured and useful for invalid BV IDs, URLs, language codes, or comment options.

Notes:

-

## Client Compatibility

Mark untested clients explicitly.

| Client | Version | Install method | Result | Notes |
|--------|---------|----------------|--------|-------|
| Claude Desktop |  |  | not tested / pass / fail |  |
| Cursor |  |  | not tested / pass / fail |  |
| Codex |  |  | not tested / pass / fail |  |
| Other |  |  | not tested / pass / fail |  |

## Documentation Checks

- [ ] README install command matches actual package behavior.
- [ ] Credential setup docs do not suggest putting Cookie values in MCP client config.
- [ ] README and README_EN agree on the supported setup path.
- [ ] Changelog or release notes mention user-visible changes.
- [ ] Known limitations are documented when behavior is intentionally partial.

Notes:

-

## Security And Privacy Checks

- [ ] No full Cookie values, npm tokens, GitHub tokens, `.env` content, or private credentials appear in logs, reports, docs, tests, or package output.
- [ ] Error messages and retry logs redact credential-like values.
- [ ] External inputs are validated before Bilibili API calls.
- [ ] Network responses that may be large or redirected are bounded or rejected according to current policy.

Notes:

-

## Result

- Overall result: `pass | pass with caveats | fail | blocked`
- Blocking issues:
- Non-blocking caveats:
- Follow-up tickets:
- Codemap update status:
- Research note link, if external facts affected QA:
