# Issue #78 — Codex Direct

## Contract, scope and capabilities

Source: https://github.com/XZXZZX-Ai/bilibili-mcp/issues/78, parent #75. User requested continuing the next subissue after publishing #77, retaining the explicit implement trigger and Codex Direct executor. One writer in C:/Users/ZX/.codex/worktrees/qr-login-t1/bilibili-mcp, branch codex/qr-login-t1, base cbe664868d25bb89ad6c9afa9639e6154c76d022. Master remains 7d60a9e; predecessor work is deliberately retained on the isolated branch. The original dirty checkout is untouched.

Implement default terminal QR/manual choice, bounded anonymous generation/polling, strict candidate extraction, safe recovery and cancellation, then reuse #77 validation/persistence and ASR gating. No #79 documentation rollout, automatic renewal, MCP tool/schema, ASR runtime or release changes.

Use implement, tdd, vitest, secret-scanning, codebase-design and code-review. Package-maintainer responsibility is handled by Codex Direct (dependency/source/license/pack review); test-baseline-builder responsibility is handled with focused synthetic tests. Request one bounded risk-reviewer after implementation; no Claude writer or extra team.

## Verification and rollback

Baseline is accepted #77: build, 1190 tests and five built CLI smoke scenarios passed. Add red-first protocol/CLI tests with fake time and synthetic headers; run typecheck, focused tests, final build/full tests, built CLI smoke and pack dry-run. Cache external evidence in docs/research/2026-09-12-issue-78-qr-protocol.md.

Stop/report material upstream requirements, scope changes or secret exposure. Rollback is the scoped diff from cbe6648, with no reset of other work. This issue's changes remain uncommitted until requested; no PR, merge, tag or release. Live mobile/platform acceptance may remain explicitly unverified for #79.

## Status

Accepted locally after verification and bounded independent review. #78 remains open and its changes remain uncommitted. #77 was committed/pushed as cbe6648 and closed at the user's request; no master merge occurred. #79 has not started. Typed local contract .harness/issue-78-contract.json validated; writer lease released.

## Files and behavior

- src/bilibili/qr-login.ts: one anonymous attempt returning only a candidate. Fixed HTTPS/redirect refusal, strict top/nested status and URL checks, bounded JSON, independent requests, cancellable timeouts/deadline, sequential 3-second polling, terminal QR with quiet zone and size checks, strict required-cookie parsing and conservative expiry. Session-only cookies are capped at one day; persistent cookies at the earliest declared expiry or 30 days.
- src/cli.ts: QR default/manual menu, explicit retry/manual/exit recovery and integration with existing independent verification, safe save, environment precedence and ASR gating. Ctrl+C never advances to delayed writes or ASR.
- package.json/package-lock.json: exact qrcode-generator 2.0.4; one dependency, zero transitive runtime additions; no version or entrypoint changes.
- tests/qr-login.test.ts and tests/setup-qr.test.ts: protocol, security, rendering, fake-time cancellation/deadline, and real setup/QR/nav integration. tests/setup-auth.test.ts adapts manual-input choices; tests/cli-auth-smoke.mjs expands from five to eight scenarios.
- docs/research/2026-09-12-issue-78-qr-protocol.md and codemap record verified source and new module ownership.

## Commands and results

- npm view qrcode-generator@2.0.4 plus live upstream package source and installed module review: MIT, ESM/declarations, no network/filesystem/eval/logging in the encoder, no install hook or runtime dependencies. npm install --save-exact qrcode-generator@2.0.4 --ignore-scripts --no-audit --no-fund added one package; lockfile has only that dependency change.
- Initial module tests failed because the planned QR module did not exist. CLI QR tests then failed at acquisition/recovery/cancellation assertions against the manual-only flow. Both slices passed after implementation.
- Focused checks and npx tsc --noEmit passed. Final npm run build and npm test: 49 files / 1248 tests passed.
- node tests/cli-auth-smoke.mjs: eight built child-process scenarios passed. Includes config/ASR cancellation, reuse/skip, noninteractive, non-TTY, redirected stdout refusal, generation cancellation and polling cancellation. Fake fetch refuses unexpected QR acquisition; no real credential file writes.
- npm pack --dry-run --json: 197 files, 2,007,492 unpacked bytes; no tests, node_modules, .harness, .env or config.json paths. No package publication.
- git diff --check passed. Source/test/diagnostic review uses synthetic values only; real Cookie values, URL/key, redirects and refresh tokens are never logged or placed in artifacts. This is scoped review, not an external repository-wide scanner.
- harness.contracts.validate_task_contract passed for the accepted Codex Direct contract.

## Review and residual risk

The bounded qr_t1_risk_review risk-reviewer found a fixture gap: malformed-cookie cases originally appended duplicate fields, masking their specific validation branches. Corrected them to replace the relevant field, retaining a separate duplicate case. Final Standards and Spec review found no blockers. Reviewer inspected final code/tests without repeating the completed full suite.

Live anonymous generation confirmed the first-party URL host/path; first-party webpage source confirms status mapping. Real mobile confirmation, live successful Cookie attributes and native Windows/macOS/Linux terminal readability remain unverified and belong to #79. Test success is not presented as live authentication success. No existing user credentials were read into tests or reports.

## Harness Artifacts

- Task ticket: GitHub #78, parent #75; no duplicate local ticket; local typed execution record validated.
- Research note: docs/research/2026-09-12-issue-78-qr-protocol.md; identifies observed versus unobserved upstream behavior.
- QA checklist: command results and acceptance behavior above; live/platform checks explicitly deferred.
- Codemap: updated QR acquisition boundary and test navigation.
- Harness security: unchanged trust boundaries; no secrets or raw authentication responses stored.
- Harness eval: no runtime harness behavior changed; a separate harness evaluation is not needed.

## User-authorized publication and README follow-up

The user subsequently requested commit/push, closure of #78 and parent specification #75, and installation of writing-great-readmes. README scope was clarified to a concise recommended QR-login path: scan with the mobile Bilibili App, confirm on the phone, retain manual Cookie fallback. Both languages received equivalent changes and retain an unreleased-branch notice (live npm latest remains 1.13.1). Structure, source-fact and bilingual parity audits passed; no runtime changes followed the accepted test run. #79 remains open for Agent guidance and real/platform acceptance; closing the parent does not certify those pending checks or a master merge/npm release.

manage-skills found the registered writing-great-readmes package current at hash b399dc0c48e8f2b46d651c127c2663bec78978af576b1984277954cd3e769a84. Manager-owned Codex and Claude links were enabled in the primary project and this isolated worktree. Linked package reads and Codex markers were validated; Claude native discovery/invocation remains pending a fresh Claude session. Local links are excluded from this code publication. Rollback uses project disable, not manual link deletion. No manager self-change is needed.
