# Release Execution Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` for step-by-step execution, `secret-scanning` for pre-release secret/package review, and `github-actions-docs` for workflow/OIDC checks when changing release workflow behavior. Do not tag or publish without explicit user approval.

## Goal

Release `@xzxzzx/bilibili-mcp` version `1.4.0` after Phase 1-5 source work has been completed, verified, committed, and pushed.

This phase is about release execution, not feature work or documentation polish.

## Current State

- Package version: `1.4.0` (retargeted from 1.3.8 — npm 1.3.8 was an old package from 2026-03-11, not the current code).
- Phase 4 source changes are already pushed to `origin/master` in commit `f777980`.
- Current local uncommitted changes are memory/tracker-only:
  - `.codex/scripts/plan_tracker.py`
  - `docs/agent-memory/lessons-learned.md`
  - `docs/agent-memory/project-facts.md`
  - `docs/agent-memory/verification-log.md`
- Publish workflow exists at `.github/workflows/publish.yml`.
- Workflow trigger: pushed tags matching `v*.*.*` and `workflow_dispatch`.
- npm publish has not been performed.
- GitHub Release has not been created.

## External Requirements To Confirm

> **Recovery note (2026-06-04):** `v1.3.8` tag was pushed but npm `1.3.8` already existed as a 2026-03-11 package. Current release target retargeted to **v1.4.0**. `v1.3.8` tag preserved for forensic trace; do not delete without explicit approval.

Before pushing `v1.4.0`, the user must confirm npm trusted publishing is configured on npmjs.com:

- Package: `@xzxzzx/bilibili-mcp`
- Publisher: GitHub Actions
- Organization/user: `XZXZZX-Ai`
- Repository: `bilibili-mcp`
- Workflow filename: `publish.yml`
- Allowed action: `npm publish`
- Optional environment name: only if the workflow uses a matching GitHub environment

Official npm docs state that trusted publishing requires npm CLI `11.5.1+` and Node `22.14.0+`. The workflow currently uses Node `22.14.0` and installs latest npm before publishing.

## Things To Avoid

- Do not modify product source code during release execution.
- Do not restore Smithery.
- Do not add `NPM_TOKEN`, `NODE_AUTH_TOKEN`, or long-lived publish tokens unless the user explicitly rejects trusted publishing.
- Do not print Cookie values or `.env` contents.
- Do not push `v1.4.0` until the working tree is clean and the user confirms npm trusted publishing is configured.
- Do not create a GitHub Release before the npm publish workflow succeeds.
- Do not treat `npm audit` legacy findings as release blockers unless they are new, severe, or directly publish-impacting.

## Task 1: Commit Current Memory/Tracker Fixes

- [x] Review current diff:
  - `.codex/scripts/plan_tracker.py`
  - `docs/agent-memory/lessons-learned.md`
  - `docs/agent-memory/project-facts.md`
  - `docs/agent-memory/verification-log.md`
- [x] Confirm `plan_tracker.py` returns a tracked implementation plan instead of `2026-05-27-agent-memory-learning-system.md`.
- [x] Confirm no generated `__pycache__/` is present.
- [x] Run focused checks:
  - `python .codex/scripts/plan_tracker.py`
  - `python .codex/scripts/generate_learning_proposals.py --source codex`
  - `python .codex/scripts/generate_learning_proposals.py --source claude`
- [x] Commit only memory/tracker changes.
- [x] Push `master`.

Expected commit message:

```text
chore: fix active plan tracking memory
```

## Task 2: Final Local Release Verification

- [x] Ensure working tree is clean.
- [x] Confirm local branch is up to date with `origin/master`.
- [x] Confirm version:
  - `node -e "const p=require('./package.json'); console.log(p.name, p.version)"`
- [x] Run:
  - `npm test`
  - `npm run build`
  - `npm pack --dry-run`
- [x] Inspect package dry-run output for required files:
  - `package.json`
  - `README.md`
  - `README_EN.md`
  - `LICENSE`
  - `dist/index.js`
  - `dist/index.d.ts`
  - `dist/cli.js`
  - `dist/server.js`
  - `dist/bilibili/metadata.js`
  - `dist/bilibili/subtitle.js`
  - `dist/bilibili/comments.js`
- [x] Confirm package dry-run output excludes:
  - `tests/`
  - `.env`
  - `.claude/`
  - `.codex/`
  - `docs/agent-memory/`
  - `smithery.json`
  - `smithery.yaml`
  - `debug_subtitle2.mjs`
  - `smithery-test.*`
- [x] Run a secret-oriented scan over release-relevant files and npm pack output.

## Task 3: User Gate - npm Trusted Publishing

- [x] Stop and ask the user to confirm npm trusted publishing is configured.
- [x] User must confirm the npm package trusted publisher details match:
  - GitHub org/user: `XZXZZX-Ai`
  - repository: `bilibili-mcp`
  - workflow filename: `publish.yml`
  - allowed action includes `npm publish`
- [x] If not configured, stop. Do not push the tag.

## Task 4: Create And Push Release Tag

- [x] Confirm no local `v1.4.0` tag exists:
  - `git tag --list v1.4.0`
- [x] Confirm remote does not already have `v1.4.0`:
  - `git ls-remote --tags origin v1.4.0`
- [x] Create annotated tag:
  - `git tag -a v1.4.0 -m "Release v1.4.5"`
- [x] Push tag:
  - `git push origin v1.4.0`
- [x] Report the pushed tag and commit SHA.

## Task 5: Monitor Publish Workflow

- [x] Inspect GitHub Actions run triggered by `v1.4.0`.
- [x] Confirm workflow steps:
  - checkout
  - setup node
  - install npm
  - `npm ci`
  - `npm test`
  - `npm run build`
  - `npm publish`
- [x] Workflow did not fail; no failure details needed capture.
- [x] If publish succeeds, record the run URL and npm package version URL.

## Task 6: Post-Publish Verification

- [x] Verify npm published version:
  - `npm view @xzxzzx/bilibili-mcp version`
  - `npm view @xzxzzx/bilibili-mcp dist-tags`
- [x] Confirm package page or npm metadata shows `1.4.0`.
- [x] Optional provenance verification left out of the release gate; npm publication was verified through registry metadata.
- [x] Update `docs/agent-memory/verification-log.md` with release execution results.

## Task 7: GitHub Release

- [x] Create GitHub Release for `v1.4.0` only after npm publish succeeds.
- [x] Use changelog content from `CHANGELOG.md` and `CHANGELOG_EN.md`.
- [x] Mention:
  - new MCP tools: `get_video_transcript`, `get_video_metadata`
  - expanded `get_video_comments` controls
  - client module split
  - package metadata and publish workflow hardening
  - Smithery removal
  - test baseline: 110 tests
- [x] Do not claim npm publish succeeded unless Task 5/6 verified it.

## Acceptance Criteria

- Current memory/tracker fix is committed and pushed separately before release tagging.
- `npm test`, `npm run build`, and `npm pack --dry-run` pass immediately before tagging.
- npm trusted publishing configuration is confirmed by the user before tag push.
- `v1.4.0` tag points at the intended release commit.
- GitHub Actions publish workflow succeeds.
- npm shows `@xzxzzx/bilibili-mcp@1.4.0`.
- GitHub Release exists for `v1.4.0` after publish success.
- No secrets, Cookie values, `.env`, test files, Smithery artifacts, debug artifacts, `.claude/`, `.codex/`, or `docs/agent-memory/` are included in the npm package.

## Rollback And Failure Handling

- If local verification fails before tagging: fix the failing local issue, commit, push, and restart Task 2.
- If npm trusted publishing is not configured: stop before tag push.
- If tag push succeeds but publish workflow fails:
  - do not delete or recreate the tag without explicit user approval
  - fix the cause in a new commit if needed
  - decide with the user whether to retag, bump patch, or rerun workflow
- If npm reports duplicate version: do not overwrite; inspect whether `1.4.0` was already published.
- If workflow fails due to trusted publishing mismatch: fix npm package trusted publisher settings first, then rerun the workflow or decide whether a new tag is needed.
