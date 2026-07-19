# Task Ticket: Bilingual MCP Guidance Fields

- ID: 2026-06-18-bilingual-mcp-guidance
- Title: Add bilingual guidance fields to MCP responses
- Status: done
- Owner: Codex
- Source: User selected the second option: keep existing fields and add `*_zh` / `*_en` fields.
- Parent plan or PRD: none
- Blocking tickets: none
- Blocked by: none

## Objective

Make credential, update, and key error guidance directly understandable to both Chinese and English users while preserving existing response fields for current agents.

## Scope

In scope:

- Keep existing `next_steps`, `security_notes`, and `notes` fields unchanged for compatibility.
- Add bilingual fields such as `next_steps_en`, `next_steps_zh`, `security_notes_en`, `security_notes_zh`, `notes_en`, and `notes_zh`.
- Add bilingual next steps for `COOKIE_EXPIRED` and `SUBTITLE_UNAVAILABLE` MCP error payloads.
- Update focused tests and README/README_EN response descriptions.

Out of scope:

- Do not remove or rename existing response fields.
- Do not change credential loading, Cookie storage, Bilibili API behavior, package metadata, release workflow, or npm publish state.

## Files To Inspect Or Edit

Expected edit:

- `src/utils/credential-guidance.ts`
- `src/utils/update-check.ts`
- `src/server/error-response.ts`
- `src/server/tool-handlers.ts`
- `tests/credential-guidance.test.ts`
- `tests/server-credential-tools.test.ts`
- `tests/server-error-next-steps.test.ts`
- `tests/update-check.test.ts`
- `README.md`
- `README_EN.md`
- `docs/qa/2026-06-18-bilingual-mcp-guidance.md`
- `docs/agent-memory/verification-log.md`

Do not touch:

- Cookie values, `.env`, tokens, package version, release workflow, generated `dist/` by manual edits.

## Acceptance Criteria

- [x] Existing `next_steps`, `security_notes`, and `notes` remain present.
- [x] Credential setup/status responses include English and Chinese guidance fields.
- [x] Package update responses include English and Chinese notes.
- [x] `COOKIE_EXPIRED` and `SUBTITLE_UNAVAILABLE` error payloads include bilingual next steps.
- [x] Tests cover the new bilingual fields.
- [x] README and README_EN describe the bilingual fields.

## Verification

Required commands:

```bash
npm run build
npm test -- tests/credential-guidance.test.ts tests/server-credential-tools.test.ts tests/server-error-next-steps.test.ts tests/update-check.test.ts
```

Additional commands before completion:

```bash
npm test
```

## Risks And Rollback

Risks:

- Changing existing fields could break older agents; this task only adds fields.
- Chinese text must not introduce Cookie-like placeholders or secrets.

Rollback:

- Remove the added bilingual fields and related tests/docs, then rerun build and tests.

## Completion Report

- Files changed: source response builders, focused tests, README docs, QA checklist, verification log, this ticket.
- Commands run and results: build and focused tests passed; full test result recorded in verification log if run.
- Skipped checks: no real MCP client UI smoke.
- Codemap update status: unchanged; module ownership and navigation did not change.
- Unresolved risks or decision points: none known.
