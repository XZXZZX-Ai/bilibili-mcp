# Issue #77 — Codex Direct

## Execution contract

Source: https://github.com/XZXZZX-Ai/bilibili-mcp/issues/77, parent #75, predecessor #76 (published as 2048dd1 and closed).
The user requested continuation after explicitly invoking implement and selecting Codex Direct. One writer in C:/Users/ZX/.codex/worktrees/qr-login-t1/bilibili-mcp, branch codex/qr-login-t1. Preserve the unrelated dirty original checkout.

## Scope and acceptance

Implement interactive setup authentication: verify existing credentials, offer reuse/relogin, validate manual candidates before atomic persistence, preserve environment precedence, cancel safely with exit 130, and enter optional ASR only after authentication succeeds. Preserve config and non-interactive behavior. No QR transport, dependencies, automatic renewal or work on #78.

Use implement, tdd, vitest, codebase-design, secret-scanning and code-review guidance. Reuse the candidate verification and atomic save from #76. Verify focused tests, build, full tests and built CLI smoke checks, then obtain a bounded risk review. Stop for material scope changes or secret exposure. Rollback is the scoped diff from 2048dd1; no reset of unrelated work. No new commit/push/closure for this next issue until requested.

## Status

Accepted locally; changes remain uncommitted, #77 remains open. #76 was committed and pushed as 2048dd1dc16ac2a21959a484143ab29cce3d8157 to codex/qr-login-t1 and closed as requested; remote hash was verified. No merge to master or work on #78.

## Changes and verification

- src/cli.ts: separate setup authentication seam, explicit existing/candidate verification, manual replacement with save before in-memory installation, environment warning, cancel-safe prompt lifecycle and exit 130. Direct config retains its existing save behavior; non-interactive setup retains local loadability checks.
- tests/setup-auth.test.ts: 12 deterministic authentication scenarios. The first four failed before implementation, then passed. tests/cli.test.ts updates the authentication injection expectation.
- tests/cli-auth-smoke.mjs: runnable after build; five child-process checks cover config cancellation, post-login ASR cancellation, reuse/skip, non-interactive setup and non-TTY rejection. All HTTP is stubbed and credentials synthetic.
- npm run build and npx tsc --noEmit passed. npm test: 47 files, 1190 tests passed. Focused suite: 2 files, 105 tests passed.
- node tests/cli-auth-smoke.mjs passed. An initial smoke harness kept successful child stdin open and timed out after completion; ending stdin after the final answer fixed the test harness.
- npm pack --dry-run --json: 193 files, 1,987,679 unpacked bytes; no tests, node_modules, .harness, .env or config.json paths. git diff --check passed. Scoped review found only synthetic fixture values, no real credentials or raw upstream error logging added.

## Review and limitations

The bounded qr_t1_risk_review risk-reviewer identified Ctrl+C at post-authentication prompts returning 1. The shared CLI entry now returns 130 for AbortError, verified in the built CLI. Final Standards and Spec review found no blockers. Reviewer inspected test definitions and used the writer's completed test results without redundant reruns.

No real-account login or native macOS/Linux terminal testing was performed. Interactive child-process checks simulate a TTY on Windows; real terminal/platform acceptance remains in the later QR tickets. No dependency, MCP response, release or automatic renewal changes.

## Harness Artifacts

- Task ticket: live GitHub #77, parent #75; no duplicate local ticket. Local typed execution record: .harness/issue-77-contract.json, writer lease released.
- Research: no new external contract decisions; reuses #76's verified candidate API and safe persistence.
- QA checklist: acceptance and command results above; live/platform verification remains deferred to #79.
- Codemap: updated setup authentication and smoke-test navigation.
- Harness security: reviewed; report contains no real credentials, private configuration or upstream error bodies.
- Harness eval: no harness behavior changed; no separate evaluation needed.
