# Documentation And Release Polish Design

## Purpose

Phase 4 makes the project release-ready after the tool surface is improved. It aligns user-facing documentation, changelogs, package metadata, and GitHub Actions/npm publish behavior with the implementation.

This phase should not add new MCP tools or refactor core Bilibili API code. It is a documentation and release-gate phase.

## Current State

The project has:

- `README.md` and `README_EN.md`
- `CHANGELOG.md` and `CHANGELOG_EN.md`
- package metadata in `package.json`
- npm publish workflow at `.github/workflows/publish.yml`
- `npm pack --dry-run` verification from Phase 1 and Phase 2

Smithery runtime config has been removed and must not be restored.

## Release Chain Constraints

As of 2026-05-28, npm Trusted Publishing and provenance should be checked against official npm and GitHub documentation before changing publish workflow behavior.

Official references:

- npm Trusted Publishers: <https://docs.npmjs.com/trusted-publishers/>
- npm provenance statements: <https://docs.npmjs.com/generating-provenance-statements>
- GitHub Actions OIDC security hardening: <https://docs.github.com/en/actions/security-for-github-actions/security-hardening-your-deployments/about-security-hardening-with-openid-connect>
- GitHub Actions workflow syntax: <https://docs.github.com/en/actions/writing-workflows/workflow-syntax-for-github-actions>

The current workflow uses `npm publish --provenance --access public`. Phase 4 must verify whether the workflow should use trusted publishing, an npm token, or both, and document the chosen release path.

Important current compatibility point: npm Trusted Publishing documentation currently states that trusted publishing requires npm CLI `11.5.1` or later and Node `22.14.0` or later. The official GitHub Actions example currently uses Node `24` with `actions/checkout@v6` and `actions/setup-node@v6`. If implementation confirms the current workflow is still on Node `20`, update the publish workflow to an officially supported Node version rather than relying on `npm install -g npm@latest` under an incompatible runtime.

## Documentation Targets

### README

README updates should cover:

- install command and package name
- MCP client configuration
- Cookie setup through environment variables or credential helper
- no-cookie behavior vs Cookie-backed behavior
- the complete current tool list
- tool parameter defaults
- expected error codes
- privacy and security notes
- troubleshooting for expired Cookie and missing subtitles

### README_EN

Keep English content aligned with the Chinese README. Do not allow one README to document a different tool surface or release behavior.

### Changelog

Changelog updates should:

- align with the next intended release version
- mention stabilization changes from Phase 1
- mention Phase 2 client split as internal refactor with no public breaking change
- mention Phase 3 tool additions and comment controls if Phase 3 has been implemented
- mention Smithery removal if relevant to users
- avoid claiming a release was published before it is actually tagged/published

### Package Metadata

Review:

- `name`
- `version`
- `description`
- `keywords`
- `main`
- `module`
- `types`
- `bin`
- `files`
- `engines`
- repository/homepage/bugs/license fields if present

Do not change package identity unless the user explicitly requests it.

## Error Documentation

Document stable error codes that MCP callers can act on:

- `VALIDATION_ERROR`
- `COOKIE_EXPIRED`
- `SUBTITLE_UNAVAILABLE` if Phase 3 adds it
- upstream/network error category used by existing error classes

Do not expose raw Cookie values or full upstream sensitive headers in examples.

## Publish Workflow Direction

Phase 4 should make the release workflow explicit:

1. local preflight:
   - `npm test`
   - `npm run build`
   - `npm pack --dry-run`
2. package content review:
   - includes `dist/index.js`, `dist/index.d.ts`, `dist/cli.js`
   - excludes tests, `.env`, debug artifacts, and Smithery artifacts
3. GitHub Actions publish verification:
   - correct trigger
   - correct `permissions`
   - supported Node/npm versions
   - correct use of `--provenance`
   - correct npm trusted publisher or token setup
4. release notes/changelog alignment

## Non-Goals

- Do not add new MCP tools in Phase 4.
- Do not refactor `src/bilibili/` modules.
- Do not restore Smithery.
- Do not automate a release tag or npm publish unless the user explicitly asks.
- Do not print secrets or ask the user to paste secrets into documentation.

## Acceptance Criteria

- README and README_EN match the implemented tools and credential behavior.
- Changelog files match the intended release content and do not overclaim publication.
- package metadata is consistent with built output.
- GitHub Actions publish flow is verified against official docs.
- `npm test`, `npm run build`, and `npm pack --dry-run` pass.
- No docs or workflow examples contain real Cookie, npm token, GitHub token, or `.env` values.
