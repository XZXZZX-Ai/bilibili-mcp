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

- [ ] Inspect `src/server.ts` and record the actual MCP tools and parameters.
- [ ] Inspect `package.json` for package metadata and scripts.
- [ ] Inspect `README.md`, `README_EN.md`, `CHANGELOG.md`, and `CHANGELOG_EN.md` for stale references.
- [ ] Run:

```bash
npm test
npm run build
npm pack --dry-run
```

- [ ] Report actual tool surface and any documentation mismatch before editing.

---

### Task 2: Update README Tool And Credential Documentation

**Files:**
- Modify: `README.md`
- Modify: `README_EN.md`

- [ ] Update install and MCP configuration examples.
- [ ] Document all implemented tools and parameters.
- [ ] Document no-cookie behavior:
  - some public metadata may work without Cookie
  - subtitles/comments may be incomplete, empty, or rate-limited
- [ ] Document Cookie-backed behavior:
  - use `.env`, environment variables, or credential helper
  - never hard-code Cookie values
  - rotate Cookie if previously exposed
- [ ] Document expected error codes and caller behavior.
- [ ] Keep examples redacted:

```env
BILIBILI_SESSDATA=your_sessdata
BILIBILI_BILI_JCT=your_bili_jct
BILIBILI_DEDEUSERID=your_dedeuserid
```

- [ ] Do not rewrite unrelated README sections.

---

### Task 3: Update Changelogs

**Files:**
- Modify: `CHANGELOG.md`
- Modify: `CHANGELOG_EN.md`

- [ ] Add an unreleased or next-version section according to current changelog style.
- [ ] Include:
  - Phase 1 stabilization
  - Phase 2 client split as internal refactor
  - Phase 3 tool changes if Phase 3 is already implemented
  - Smithery runtime removal
  - testing and package-content cleanup
- [ ] Do not claim npm publication, GitHub release creation, or tag push before those actions happen.

---

### Task 4: Review Package Metadata

**Recommended Claude Code subagent:** `package-maintainer`

**Files:**
- Modify: `package.json` only if needed

- [ ] Confirm:
  - `main`: `dist/index.js`
  - `module`: `dist/index.js`
  - `types`: `dist/index.d.ts`
  - `bin.bilibili-mcp`: `dist/cli.js`
  - `files` excludes tests and local artifacts
  - `engines.node` matches actual supported runtime
- [ ] Review `description` and `keywords` for the current tool surface.
- [ ] Do not change package `name` unless the user explicitly requests it.
- [ ] Do not bump version unless the user confirms the release version.

---

### Task 5: Verify And Update Publish Workflow

**Required skill:** `github-actions-docs`

**Files:**
- Modify: `.github/workflows/publish.yml` if needed

- [ ] Re-check official docs at implementation time:
  - npm Trusted Publishers
  - npm provenance
  - GitHub Actions OIDC
  - GitHub Actions workflow syntax
- [ ] Confirm whether this package uses npm trusted publishing or token-based publish.
- [ ] If using trusted publishing/provenance, ensure workflow has:
  - compatible Node version for the required npm CLI, currently Node `22.14.0` or later per npm docs
  - `id-token: write`
  - `contents: read`
  - `registry-url: https://registry.npmjs.org/`
  - `npm publish --provenance --access public`
- [ ] If current Node version is incompatible with the required npm CLI, update `actions/setup-node` to a supported Node version, preferably matching the current npm official GitHub Actions example, instead of relying on an incompatible global npm install.
- [ ] Keep workflow triggers intentional:
  - tag trigger for release publish
  - manual `workflow_dispatch` only if user still wants it
- [ ] Do not add npm tokens to the repository.

---

### Task 6: Secret And Package Content Review

**Required skill:** `secret-scanning`

- [ ] Scan changed docs/workflow for:
  - full Cookie values
  - `SESSDATA=...` real values
  - `bili_jct=...` real values
  - `DedeUserID=...` real values
  - npm tokens
  - GitHub tokens
- [ ] Run:

```bash
npm pack --dry-run
```

- [ ] Confirm package excludes:
  - tests
  - `.env`
  - local debug scripts
  - Smithery artifacts
  - agent runtime memory

---

### Task 7: Final Phase 4 Verification

**Recommended Claude Code subagent:** `release-verifier`

- [ ] Run:

```bash
git status --short
npm test
npm run build
npm pack --dry-run
```

- [ ] Verify:
  - docs match actual `src/server.ts` tool schemas
  - README and README_EN are aligned
  - changelogs do not overclaim release state
  - package metadata targets `dist`
  - publish workflow follows current official docs
  - no secrets appear in docs/workflow/package contents
- [ ] Report:
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
