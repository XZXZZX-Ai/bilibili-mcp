# Codex To Claude Handoff: README Sync And v1.7.1

## Update Goal

Bring both READMEs in line with current source facts and prepare source version `1.7.1` for Codex to review, commit, and push.

## Current Judgment

The current READMEs already cover the eight tools functionally, but their top release link still points to `v1.6.4`, their development-process summary says seven tools and 180 tests, and they omit the now-effective `BILIBILI_CACHE_SIZE` setting. The build command also now cleans `dist/` before TypeScript compilation. The current repository collaboration workflow is Codex planning/review plus one Paseo-managed Claude Code implementation agent, with Matt/GitHub tickets when applicable. Current verification is 23 files and 244 tests.

The worktree contains verified, uncommitted legacy-auth/config cleanup changes from the preceding bounded task. Preserve them. In particular, do not edit or stage `docs/agent-memory/pending-learning-proposals.md`, whose generated-date change predates this task.

## Recommended Approach

- Make targeted edits, not a README rewrite.
- Keep `README.md` and `README_EN.md` semantically parallel.
- Use `npm version 1.7.1 --no-git-tag-version` for package and lockfile consistency.
- Add a concise top `1.7.1` changelog entry dated 2026-07-20 covering README synchronization and the already-implemented auth/config/cache/build cleanup.
- Record that `1.7.1` is source-prepared only; npm/GitHub latest remains `1.7.0` until separately published.

## Things To Avoid

- Do not change MCP tools, runtime behavior, dependencies, tests, workflows, or generated `dist/`.
- Do not tag, publish, create a GitHub Release/PR, commit, stage, or push.
- Do not expose Cookies, tokens, `.env` contents, or private config.
- Do not use Superpowers. The preferred Matt `ask-matt` router is unavailable in this Codex runtime, so this local ticket is the bounded fallback.

## Claude Code Execution Steps

1. Read this handoff, its task ticket, `AGENTS.md`, and current diffs before editing.
2. Use the project `package-maintainer` subagent/capability for package/docs maintenance.
3. Correct both README release links to the current published `v1.7.0`; document runtime tuning defaults for `BILIBILI_RATE_LIMIT_MS`, `BILIBILI_REQUEST_TIMEOUT_MS`, `BILIBILI_CACHE_SIZE`, and `USER_AGENT`; state that restart is required because config loads at process startup.
4. Update build wording to say `npm run build` cleans `dist/` then compiles; update development-process facts to eight tools, 244 tests, and the current bounded Codex/Paseo/Claude workflow.
5. Add bilingual `1.7.1` changelog entries and bump package/lock versions only.
6. Update `docs/agent-memory/active-work.md`, `project-facts.md`, `handoff-log.md`, and `verification-log.md` only as warranted by verified results. Do not edit the pending proposals file.
7. Run release-readiness review with the project `release-verifier` subagent/capability and a scoped post-change leak review using `risk-reviewer` or the closest safe fallback.
8. Write the report at `docs/agent-memory/handoffs/2026-07-20-readme-sync-v1.7.1-claude-report.md` using the repository report template.

## Verification Commands

```bash
npm run build
npm test
npm pack --dry-run --json
git diff --check
```

Also verify package and lock versions, current README counts/config variables, tarball entry points, absence of credential-like added content, and no accidental change to `pending-learning-proposals.md` attributable to this task.

## Acceptance Criteria

- Both READMEs are current, concise, bilingual equivalents, and source-backed.
- Version is `1.7.1` in package and lockfile; changelogs explain it.
- 244 tests, build, package dry run, diff check, and scoped security review pass.
- No public behavior or release action occurs.

## Risks

- README claims can drift if based on historical memory instead of current source.
- A patch bump can be mistaken for publication; explicitly distinguish source preparation from npm/GitHub release state.
- Existing user changes must not be overwritten or broadened.

## Expected Claude Report

Include files changed, commands and exact results, skipped checks, subagents/capabilities used, `Harness Artifacts`, unresolved risks, and suggested Codex review focus.
