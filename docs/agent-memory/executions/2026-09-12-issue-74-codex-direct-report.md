# Issue #74 — Codex Direct

## Contract and scope

User explicitly invoked implement with Codex Direct. Source: https://github.com/XZXZZX-Ai/bilibili-mcp/issues/74#issuecomment-5645404143. One writer in the existing isolated worktree C:/Users/ZX/.codex/worktrees/qr-login-t1/bilibili-mcp, base 25d187ab29c9330c1a8dbef402630c42e9637579. Preserve pending README login edits and the dirty original checkout.

Fix time-mode mapping in both comment API paths and prevent hot-mode postprocessing from reordering time results. Retain root order and the existing appended reply block, public schemas, paging, cache and hot behavior. No new interface, dependency, QR/ASR or credential changes. Rollback is the scoped diff from the base, excluding pre-existing README edits. No commit/push/closure authorized for this issue.

Use implement, tdd, vitest and code-review; request bounded risk-reviewer for shared API changes. No codebase-design needed: module interfaces stay unchanged. Baseline: previous full suite 1248 passed; triage reproduced four failures with existing 29 comment tests passing. Add permanent regression tests, run focused red-green checks, build/full tests and review. Stop/report upstream semantic conflicts or scope growth.

## Status

Implemented locally; no commit, push or issue closure. The user explicitly authorized thanking the reporter and updating the issue with the result.

## Changes and checks

- comments-api.ts selects mode 2 for time and mode 3 for hot in both WBI and ordinary fallback requests.
- comments.ts applies timestamp/likes ranking only outside time mode; time keeps upstream roots followed by the existing bounded reply block.
- tests/comments-sort.test.ts adds 16 cases for both modes, WBI success/empty/error fallbacks, legacy/options callers, brief/detailed and replies on/off, paging and cache isolation. Existing comments tests remain intact.
- README and tool-reference text in both languages now qualifies video-timestamp priority as hot-only and documents time/reply order. Earlier uncommitted QR README edits remain present and are not part of this fix's implementation scope.
- Four permanent reproduction checks failed before the fix with expected mode/order mismatches. After the fix, focused tests passed: 2 files / 45 tests. npx tsc --noEmit passed.
- npm run build and npm test passed: 50 files / 1264 tests. git diff --check passed. No runtime edits followed this verification.
- No live authenticated probe performed; endpoint mapping is supported by the original reporter's live ordinary-endpoint comparison. Local tests prove request construction and processing; they do not certify live WBI availability.
- Bounded qr_t1_risk_review reviewer: Standards and Spec both have no blockers; pre-existing QR README edits excluded. Reviewer did not repeat the completed full suite. Local typed contract validated and writer lease released.

## Harness Artifacts

- Ticket: GitHub #74 and its triage Agent Brief; no duplicate local ticket.
- Research: original reporter evidence is linked from the ticket; no new external research or credential collection.
- QA checklist: red-green, typecheck, focused/full tests and bounded risk review.
- Codemap: new regression-test navigation added.
- Harness security: reviewed; only synthetic fixtures and sanitized test results recorded.
- Harness eval: no harness behavior changed; separate evaluation not needed.

## Publication authorization

The user subsequently explicitly requested commit/push and closure of all remaining issues. Publish the accepted #74 fix together with the pending user-requested bilingual README corrections; exclude machine-local Skill links. Close #74 as completed after verifying the pushed commit. Close #79 as not planned at the user's request, explicitly retaining that remaining Agent guidance and real phone/native-platform acceptance were not completed. This does not authorize or claim a master merge or npm release.
