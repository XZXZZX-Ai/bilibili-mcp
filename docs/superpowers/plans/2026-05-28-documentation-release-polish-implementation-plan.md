# Documentation And Release Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` for this release-polish plan. Use `github-actions-docs` for workflow guidance, `secret-scanning` for secret-risk review, and `release-verifier` before completion.

**Goal:** Align documentation, changelogs, package metadata, and GitHub Actions npm publish workflow with the stabilized and expanded project behavior.

**Architecture:** Treat this as a release gate, not a feature phase. First inspect the implemented tool surface, then update docs and workflow, then verify package contents and publish preconditions.

**Tech Stack:** TypeScript, Node.js ESM, MCP SDK, npm, GitHub Actions, Vitest.

---

## Current Constraints

- Do not add new MCP tools in Phase 4.
- Do not modify Bilibili API behavior unless verification finds a documentation-blocking mismatch.
- Do not restore Smithery config.
- Do not include real secrets in docs, examples, workflow logs, or changelog.
- Verify publish workflow behavior against official npm and GitHub docs at implementation time.
- Do not tag, publish, or create a release unless the user explicitly requests it.

## Target Files

- Modify: `README.md`
- Modify: `README_EN.md`
- Modify: `CHANGELOG.md`
- Modify: `CHANGELOG_EN.md`
- Modify: `package.json` if metadata/version requires alignment
- Modify: `.github/workflows/publish.yml` if official docs or verification require it
- Optional: add `docs/release-checklist.md` if release steps are too long for README

---

### Task 1: Inspect Implemented Public Surface

**Recommended Claude Code subagent:** `release-verifier`

- [x] Inspect `src/server.ts` and record the actual MCP tools and parameters.
- [x] Inspect `package.json` for package metadata and scripts.
- [x] Inspect `README.md`, `README_EN.md`, `CHANGELOG.md`, and `CHANGELOG_EN.md` for stale references.
- [x] Run:

```bash
npm test
npm run build
npm pack --dry-run
```

- [x] Report actual tool surface and any documentation mismatch before editing.

Status: Completed. The actual MCP surface has four tools: `get_video_info`, `get_video_comments`, `get_video_transcript`, and `get_video_metadata`. README files match the current tool surface. Identified follow-up work: add v1.3.8 changelog entries, refresh package description/keywords for transcript and metadata, and add `npm test` to the publish workflow after official docs review.

---

### Task 2: Update README Tool And Credential Documentation

**Files:**
- Modify: `README.md`
- Modify: `README_EN.md`

- [x] Update install and MCP configuration examples.
- [x] Document all implemented tools and parameters.
- [x] Document no-cookie behavior:
  - some public metadata may work without Cookie
  - subtitles/comments may be incomplete, empty, or rate-limited
- [x] Document Cookie-backed behavior:
  - use `.env`, environment variables, or credential helper
  - never hard-code Cookie values
  - rotate Cookie if previously exposed
- [x] Document expected error codes and caller behavior.
- [x] Keep examples redacted:

```env
BILIBILI_SESSDATA=your_sessdata
BILIBILI_BILI_JCT=your_bili_jct
BILIBILI_DEDEUSERID=your_dedeuserid
```

- [x] Do not rewrite unrelated README sections.

Status: Completed. `README.md` and `README_EN.md` now document no-cookie limitations, safe Cookie credential sources, and expected caller behavior for `VALIDATION_ERROR`, `COOKIE_EXPIRED`, and `SUBTITLE_UNAVAILABLE`. Review follow-ups fixed README anchor drift and Chinese quote pairing.

---

### Task 3: Update Changelogs

**Files:**
- Modify: `CHANGELOG.md`
- Modify: `CHANGELOG_EN.md`

- [x] Add an unreleased or next-version section according to current changelog style.
- [x] Include:
  - Phase 1 stabilization
  - Phase 2 client split as internal refactor
  - Phase 3 tool changes if Phase 3 is already implemented
  - Smithery runtime removal
  - testing and package-content cleanup
- [x] Do not claim npm publication, GitHub release creation, or tag push before those actions happen.

Status: Completed. `CHANGELOG.md` and `CHANGELOG_EN.md` now include a 1.3.8 entry covering stabilization, package entry fixes, Smithery removal, Vitest baseline, client split, MCP tool expansion, README updates, and verification. Review follow-up adjusted the credential-hardening wording to avoid implying tracked source credential removal.

---

### Task 4: Review Package Metadata

**Recommended Claude Code subagent:** `package-maintainer`

**Files:**
- Modify: `package.json` only if needed

- [x] Confirm:
  - `main`: `dist/index.js`
  - `module`: `dist/index.js`
  - `types`: `dist/index.d.ts`
  - `bin.bilibili-mcp`: `dist/cli.js`
  - `files` excludes tests and local artifacts
  - `engines.node` matches actual supported runtime
- [x] Review `description` and `keywords` for the current tool surface.
- [x] Do not change package `name` unless the user explicitly requests it.
- [x] Do not bump version unless the user confirms the release version.

Status: Completed. `package.json` description now reflects metadata, transcripts, subtitles, and comments. Keywords now include `transcript` and `metadata`. Publish-critical fields, version, package name, dependencies, scripts, and `package-lock.json` remained unchanged.

---

### Task 5: Verify And Update Publish Workflow

**Required skill:** `github-actions-docs`

**Files:**
- Modify: `.github/workflows/publish.yml` if needed

- [x] Re-check official docs at implementation time:
  - npm Trusted Publishers
  - npm provenance
  - GitHub Actions OIDC
  - GitHub Actions workflow syntax
- [x] Confirm whether this package uses npm trusted publishing or token-based publish.
- [x] If using trusted publishing/provenance, ensure workflow has:
  - compatible Node version for the required npm CLI, currently Node `22.14.0` or later per npm docs
  - `id-token: write`
  - `contents: read`
  - `registry-url: https://registry.npmjs.org/`
  - `npm publish --provenance --access public`
- [x] If current Node version is incompatible with the required npm CLI, update `actions/setup-node` to a supported Node version, preferably matching the current npm official GitHub Actions example, instead of relying on an incompatible global npm install.
- [x] Keep workflow triggers intentional:
  - tag trigger for release publish
  - manual `workflow_dispatch` only if user still wants it
- [x] Do not add npm tokens to the repository.

Status: Completed. `.github/workflows/publish.yml` now uses Node `22.14.0`, keeps OIDC permissions and npm registry configuration, installs npm with trusted publishing support, runs `npm test` before build, and publishes with `npm publish --provenance --access public`. No npm token secrets were added.

---

### Task 6: Secret And Package Content Review

**Required skill:** `secret-scanning`

- [x] Scan changed docs/workflow for:
  - full Cookie values
  - `SESSDATA=...` real values
  - `bili_jct=...` real values
  - `DedeUserID=...` real values
  - npm tokens
  - GitHub tokens
- [x] Run:

```bash
npm pack --dry-run
```

- [x] Confirm package excludes:
  - tests
  - `.env`
  - local debug scripts
  - Smithery artifacts
  - agent runtime memory

Status: Completed. Secret scan found only safe placeholders and recorded command patterns. `npm pack --dry-run` confirmed the package includes expected README/LICENSE/package/dist files and excludes tests, `.env`, local debug scripts, Smithery artifacts, `.claude`, `.codex`, docs memory, and runtime caches.

---

### Task 7: Final Phase 4 Verification

**Recommended Claude Code subagent:** `release-verifier`

> **Status (2026-06-04):** Completed. 110 tests pass, build green, package clean (98 files). All 4 tools documented, changelogs aligned, workflow secured with Node 22.14.0 + OIDC + npm test. Phase 4 ready for commit and (optionally) npm publish.

- [x] Run: git status --short, npm test, npm run build, npm pack --dry-run

- [x] Verify:
  - docs match actual `src/server.ts` tool schemas
  - README and README_EN are aligned
  - changelogs do not overclaim release state
  - package metadata targets `dist`
  - publish workflow follows current official docs
  - no secrets appear in docs/workflow/package contents
- [x] Report:
  - files changed
  - commands run and results
  - official docs checked
  - workflow decision
  - unresolved release risks

---

## Acceptance Criteria

- Documentation matches implemented behavior.
- Changelog matches intended next release content.
- Package metadata is consistent and publishable.
- Publish workflow is verified against official npm/GitHub docs.
- `npm test` passes.
- `npm run build` passes.
- `npm pack --dry-run` passes.
- No credentials or tokens are introduced.

## Rollback Points

- README/changelog changes can be reverted independently if product wording changes.
- `package.json` metadata changes should be reviewed separately from workflow changes.
- `.github/workflows/publish.yml` changes should be reverted first if CI or publish verification fails.

## Self-Review

- Scope check: no source behavior changes unless required by documentation mismatch.
- Release check: no tag or publish action is part of this plan.
- Security check: examples are redacted and workflow does not add tokens.
- Freshness check: publish workflow changes must cite current official docs when implemented.
