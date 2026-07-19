# QA Session: Bilingual MCP Guidance Fields

- Title: Bilingual MCP response guidance fields
- Date: 2026-06-18
- Version or commit: working tree after `v1.6.1`
- Owner: Codex
- Related ticket: `docs/agent-memory/handoffs/2026-06-18-bilingual-mcp-guidance-task-ticket.md`
- QA type: `MCP tool change | credential flow | regression`

## Scope

In scope:

- Credential setup and credential status bilingual fields.
- Update-check bilingual fields.
- `COOKIE_EXPIRED` and `SUBTITLE_UNAVAILABLE` bilingual error next steps.
- README / README_EN field descriptions.

Out of scope:

- Real Bilibili Cookie validation.
- npm publish, tag, GitHub Release, or package version change.
- Real MCP client UI testing.

## Automated Baseline

Results:

- Build: pass, `npm run build`.
- Focused tests: pass, 4 files / 13 tests.
- Full tests: pending until final verification.
- Pack: not required; package contents and metadata did not change.

## MCP Stdio And Tool Discovery

- [x] Public tool names and schemas are unchanged.
- [x] Existing response fields remain present for compatibility.
- [x] New bilingual fields are additive.
- [x] Tool responses do not expose Cookie values.

Expected additive fields:

- `security_notes_en`
- `security_notes_zh`
- `next_steps_en`
- `next_steps_zh`
- `notes_en`
- `notes_zh`

## Credential States

- [x] No credentials: status response includes existing `next_steps` plus `next_steps_en` and `next_steps_zh`.
- [x] Setup instructions include `security_notes_en` and `security_notes_zh`.
- [x] Cookie-like values are not returned.

## Error States

- [x] `COOKIE_EXPIRED` generic MCP error payload includes bilingual next steps.
- [x] `SUBTITLE_UNAVAILABLE` transcript error payload includes bilingual next steps.

## Documentation Checks

- [x] README documents bilingual response fields.
- [x] README_EN documents bilingual response fields.
- [x] Existing install/update guidance remains unchanged.

## Security And Privacy Checks

- [x] No full Cookie values, npm tokens, GitHub tokens, `.env` content, or private credentials are introduced.
- [x] Bilingual user-facing text does not ask users to paste Cookie values into MCP config.

## Result

- Overall result: pass with caveats
- Blocking issues: none
- Non-blocking caveats: no real MCP client UI smoke.
- Follow-up tickets: none.
- Codemap update status: checked and left unchanged because file ownership/navigation did not change.
