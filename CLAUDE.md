# CLAUDE.md

This file configures Claude Code behavior for `C:\Users\ZX\bilibili-mcp`.

Claude Code is the execution model for this repository. Codex is the planning, direction, review, and risk-control model. The user manually orchestrates both tools.

Do not hard-code, change, or suggest fixed model configuration unless the user explicitly asks for that exact configuration change.

## Role

Claude Code executes bounded tasks after the user or Codex has decided the direction.

Default posture:

- implement scoped changes
- edit only necessary files
- run relevant checks
- report concrete results

Do not default to:

- strategy ownership
- broad architectural replanning
- autonomous orchestration
- spawning subagents or extra workflows
- changing model or tool configuration

If a decision should go back to Codex, stop and state the decision point. The user decides whether to ask Codex.

## Before Acting

Before substantial work:

1. Read `AGENTS.md`.
2. Check for a more specific `AGENTS.md` or `CLAUDE.md` in the relevant subtree.
3. Follow the most specific instruction file.
4. Confirm the concrete objective and scope.
5. Check `git status --short`.

If the task comes from a Codex handoff, follow the handoff first. Do not assume extra context that is not written in the handoff or visible in the repository.

If the task is underspecified:

- ask for the missing boundary
- do not silently choose a larger scope
- do not turn a small fix into a broad refactor

## Active Stabilization Plan

Near-term implementation work should follow:

- `docs/superpowers/plans/2026-05-27-stabilization-roadmap.md`

Default task order:

1. Remove hard-coded Bilibili credentials without removing Cookie-based access.
2. Fix npm package entry points to use `dist`.
3. Remove unused Smithery config, scripts, and dependency.
4. Add a minimal real test baseline.
5. Clean published package contents.
6. Run final build, test, and package verification.

Do not split `src/bilibili/client.ts` or add new MCP tools until the stabilization plan is complete and verified.

## Project Memory

This repository has a project-local memory system under `docs/agent-memory/`.

Before implementing a Codex handoff or doing substantial repository work, Claude Code should read:

- `docs/agent-memory/README.md`
- `docs/agent-memory/project-facts.md`
- `docs/agent-memory/decisions.md`
- `docs/agent-memory/lessons-learned.md`

When asked to capture memory, append concise dated entries to the relevant file:

- `handoff-log.md` for execution handoffs and implementation reports
- `verification-log.md` for important command results
- `decisions.md` for durable choices
- `lessons-learned.md` for corrections and repeated pitfalls
- `project-facts.md` for stable repository facts

Do not store secrets, full Cookie values, `.env` content, npm tokens, GitHub tokens, or unverified guesses in memory.

Project-local hooks are enabled after explicit user approval on 2026-05-28:

- Claude Code hook registration lives in `.claude/settings.local.json`.
- Shared hook scripts live in `.codex/scripts/`.
- Claude runtime observations are stored under `.claude\memory\` and `.claude\runtime\`.
- Codex app uses `.codex/hooks.json` and stores runtime observations under `C:\Users\ZX\.codex\memories\bilibili-mcp\`.

Hooks may load bounded startup context, record failed shell observations, and write lightweight stop summaries. Hooks must not auto-promote observations into `docs/agent-memory/` or store secrets.

ECC-inspired hook upgrades are intentionally limited to:

- PreCompact checkpointing before context compaction.
- Candidate scoring for failed build/test/lint/package/git observations.
- Context budget auditing via `.codex/scripts/context_budget.py`.
- Strategic compact reminders in stop summaries.
- Pending learning proposal generation via `.codex/scripts/generate_learning_proposals.py`.

Do not install the full ECC plugin, broad global rules, or automatic skill evolution unless the user explicitly asks for that expansion.

Controlled learning flow:

1. Hooks collect runtime observations.
2. Hook scripts score candidates.
3. `pending-learning-proposals.md` is generated automatically.
4. Codex reviews proposals.
5. Only after the user says `批准本轮 learning proposals`, Codex may promote approved entries into formal memory.

Learning proposal review reminders should be phase-gated: remind after the completed `### Task N` count in the active stabilization plan increases, not after every stop.

## Project Map

- `src/index.ts`: MCP stdio entry point and reusable server export.
- `src/server.ts`: MCP tool registration and request handling.
- `src/cli.ts`: CLI entry point and credential setup flow.
- `src/config.ts`: runtime configuration and language preference handling.
- `src/bilibili/`: Bilibili API integration, auth, subtitles, comments, and types.
- `src/utils/`: validation, sanitization, retry, logging, cache, credentials, and errors.
- `README.md`, `README_EN.md`, `CHANGELOG.md`, `CHANGELOG_EN.md`: user-facing documentation.

## Execution Contract

When given a bounded task:

1. Restate the concrete objective briefly.
2. Inspect only the files needed for the task.
3. Make the smallest sufficient change.
4. Preserve existing style and structure.
5. Run the relevant verification when available.
6. Report what changed, what was verified, and what remains uncertain.

## Development Commands

Use this as the default verification command:

```bash
npm run build
```

The current `npm test` script is a stub that exits with an error. Do not treat `npm test` as a valid passing test suite unless real tests are added later.

For package or publishing changes, also run:

```bash
npm pack --dry-run
```

After a real test runner is added, run:

```bash
npm test
```

Manual scripts exist at the repository root, including:

- `test_cookie_status.ts`
- `test_get_subtitle.ts`
- `test_subtitle_api.ts`
- `test_subtitle_full.ts`
- `test_mcp.js`
- `test_login.js`
- `test_subtitle.js`

Only run scripts that are relevant to the change. Some require valid Bilibili cookie environment variables.

## Core Engineering Rules

### Think Before Changing

- State important assumptions explicitly.
- If the task is ambiguous, ask before editing.
- If multiple interpretations exist, surface the tradeoff instead of silently choosing.
- If a simpler approach exists, say so.

### Simplicity First

- Write the minimum needed to solve the task.
- No speculative features.
- No premature abstractions.
- No configurability that was not requested.
- Prefer the clearer smaller solution.

### Surgical Changes

- Touch only directly relevant files.
- No drive-by cleanup.
- Match the local style of the files you edit.
- Do not refactor adjacent code unless required for the requested change.
- Mention unrelated issues separately instead of fixing them opportunistically.
- Remove only unused code that your own changes created.

### Verify Before Done

Never report completion without saying one of the following:

- what was verified and how
- what could not be verified

Allowed examples:

- `Ran npm run build; TypeScript compilation passed.`
- `Updated the file but could not verify because no runnable check applies.`

Disallowed example:

- `Done, should work.`

## TypeScript And MCP Rules

- Follow the existing TypeScript ESM style and Node16 module resolution.
- Preserve MCP tool names, input schemas, and response shapes unless the task explicitly changes them.
- Preserve the default server export in `src/index.ts` for programmatic reuse.
- Keep published package metadata pointed at built output: `main`, `module`, and `types` should target `dist`, not `src`.
- Keep API-facing responses JSON-serializable and predictable.
- Validate user-provided BV IDs, URLs, language codes, and detail-level inputs before calling Bilibili APIs.
- Prefer existing utilities in `src/utils/` over duplicate logic.
- Do not commit credentials, cookies, tokens, or local `.env` values.
- Do not modify generated output in `dist/` unless release artifacts are explicitly requested.

## Credential Rules

- Cookie-based access must remain supported because some subtitle retrieval paths require authenticated Bilibili credentials.
- Never hard-code `SESSDATA`, `bili_jct`, `DedeUserID`, or complete Cookie strings in source, tests, docs, or examples.
- Read credentials from `.env`, environment variables, or the global credential file managed by `src/utils/credentials.ts`.
- When replacing hard-coded credentials in a script, preserve the script's ability to work when the user supplies valid environment variables.
- Do not print full credential values in logs or final reports.
- If you find a real credential in a tracked file, remove or externalize it and report that the user should rotate the exposed credential.

## Package And Smithery Rules

- Smithery is no longer part of the current project workflow.
- Do not recreate `smithery.json` or `smithery.yaml`.
- Remove Smithery-only package entries when working the stabilization plan:
  - `dev: smithery dev`
  - `build:smithery`
  - `@smithery/cli`
- After removing `@smithery/cli`, run `npm install` so `package-lock.json` is updated.
- Treat `SMITHERY_PUBLISH_GUIDE.md` as documentation, not runtime config. Delete it only if the user explicitly requests documentation cleanup.
- For any package metadata change, run `npm run build` and `npm pack --dry-run` before reporting completion.

## UTF-8 And Chinese Text

- Treat Markdown, TypeScript, JavaScript, JSON, YAML, and text files in this repository as UTF-8 unless a file explicitly proves otherwise.
- Preserve readable Chinese and English user-facing text.
- Do not copy existing mojibake into new content.
- Do not write replacement characters or new mojibake into project files.
- If PowerShell or another terminal displays Chinese as mojibake, verify the file with an explicit UTF-8 reader before concluding the file itself is corrupted.
- If an encoding issue is real, fix the smallest affected text range and report what was verified.

## Windows Paths

- This repository is worked on from Windows.
- Human-facing paths may use Windows backslashes.
- Commands or paths stored inside JSON, TOML, hooks, MCP config, or other cross-shell configuration should prefer absolute forward-slash paths when possible.
- Do not write configuration that depends on the current working directory unless the tool explicitly requires it.

## No Auto-Orchestration

This repository is manually orchestrated by the user.

- Do not assume permission to delegate to Codex or any other system.
- Do not create subagent trees by default.
- Do not transform a simple execution request into a multi-agent process.
- Do not switch tools automatically.
- If the implementation direction is unclear, stop and report the decision point.

## Capability Invocation Rules

Use skills, MCP/tools, and subagents explicitly and predictably.

Before substantial implementation, review, Git work, tests, release checks, or external-tool guidance:

1. Identify whether the task matches an installed skill, an MCP/tool connector, or a project subagent.
2. Prefer the matching local capability over ad hoc instructions.
3. State the capability used in the work report.
4. If a relevant capability is unavailable or intentionally skipped, state why.

Skill usage:

- If the user or Codex handoff names a skill, use it or report that it is unavailable.
- Use `vitest` for adding, changing, or diagnosing the test baseline.
- Use `secret-scanning` before commit/publish/PR work when changed or staged files touch credentials, Cookie handling, `.env` examples, package contents, workflow secrets, or release configuration.
- Use the Git skills in the Git Skill Awareness section for commit, push, PR, CI, review-comment, and GitHub Actions workflows.
- Do not assume a skill under `C:\Users\ZX\.agents\skills` or `C:\Users\ZX\.codex\skills` is available to Claude Code unless it also exists under `C:\Users\ZX\.claude\skills`.

MCP/tool usage:

- Use the local repository and shell commands as the authority for worktree state, package metadata, tests, build output, and diffs.
- Use GitHub tooling or GitHub skills for live PRs, issues, review comments, Actions logs, remote checks, and repository state.
- Use docs-grounded tools or installed documentation skills for GitHub Actions, npm publishing, MCP SDK, OpenAI/Codex behavior, or any external behavior likely to have changed.
- Do not guess remote state, current documentation, or MCP behavior from memory when a tool or official source can verify it.

Subagent usage:

- Use a project subagent when the user asks, Codex handoff names it, or the task clearly matches `.claude/agents/<name>.md`.
- Use only one focused subagent by default. Do not create subagent trees or multi-agent workflows unless the user explicitly asks.
- If a subagent reports a decision point, stop and return the decision point to the user or Codex.
- In the final report, include the subagent name used, or state that no subagent was used and why.

## Handoff Awareness

Codex handoffs should normally include:

- objective
- files to inspect or edit
- constraints
- verification expected
- what not to change

When receiving a Codex handoff:

- follow it closely
- do not expand the scope
- report any conflict with local code before editing
- ask before changing public behavior that the handoff did not mention
- preserve the stabilization plan order unless the user explicitly changes priority

## Git Skill Awareness

This repository uses the following Git skill workflow:

- `git-local-commit`: local commit only, no push. Installed for Claude Code at `C:\Users\ZX\.claude\skills\git-local-commit`.
- `git-publish`: commit and push to the current GitHub branch, no PR by default. Installed for Claude Code at `C:\Users\ZX\.claude\skills\git-publish`.
- `yeet`: branch, commit, push, and draft PR only when explicitly requested. Installed for Claude Code at `C:\Users\ZX\.claude\skills\yeet`.
- `gh-fix-ci`: debug failing GitHub Actions, npm publish, or PR checks. Installed for Claude Code at `C:\Users\ZX\.claude\skills\gh-fix-ci`.
- `gh-address-comments`: inspect or address PR review comments. Installed for Claude Code at `C:\Users\ZX\.claude\skills\gh-address-comments`.
- `github`: triage and orient GitHub repository, pull request, and issue work. Installed for Claude Code at `C:\Users\ZX\.claude\skills\github`.
- `github-actions-docs`: use for docs-grounded GitHub Actions workflow authoring, OIDC, secrets, runners, artifacts, caching, and npm publish workflow guidance. Installed for Claude Code at `C:\Users\ZX\.claude\skills\github-actions-docs`.
- `secret-scanning`: use for secret scanning, push protection, custom patterns, and remediation guidance. Installed for Claude Code at `C:\Users\ZX\.claude\skills\secret-scanning`.
- `vitest`: use when adding or maintaining the minimal Vitest test baseline. Installed for Claude Code at `C:\Users\ZX\.claude\skills\vitest`.

Use `github-actions-docs` for workflow design and official documentation guidance. Use `gh-fix-ci` for specific failing checks and log inspection.

Some GitHub skills were copied from the Codex GitHub plugin cache. In Claude Code, prefer the local `gh` CLI and existing GitHub authentication when a copied skill mentions the Codex GitHub app or connector.

Use these skills when the user or Codex handoff asks for the matching Git workflow:

- Use `git-local-commit` when asked to make a local commit only. Inspect the diff first, stage only relevant files, create one focused commit, and do not push.
- Use `git-publish` when asked to commit and push to GitHub. It may commit current scoped changes and push the current branch, but it should not create a PR by default.
- Use `yeet` only when explicitly asked for a branch, commit, push, and draft PR workflow.
- Use `github` for repository, issue, PR, or remote-context triage before choosing a more specific GitHub workflow.
- Use `gh-fix-ci` when a GitHub Actions, npm publish, or PR check fails and logs must be inspected before proposing a fix.
- Use `gh-address-comments` when asked to inspect or address pull request review comments.
- Use `github-actions-docs` when designing, explaining, securing, or maintaining workflow YAML, npm publish workflows, OIDC, secrets, runners, artifacts, or caching.
- Use `secret-scanning` before `git-local-commit`, `git-publish`, or `yeet` when the staged or changed files may include credentials, Cookie handling, `.env` examples, package contents, workflow secrets, or release configuration.

When executing a task, do not commit, push, create branches, or create PRs unless the user or Codex handoff explicitly asks for that Git action.

If asked to commit or publish:

- inspect `git status --short` and the relevant diff first
- stage only files in scope
- avoid `git add -A` unless the user explicitly wants all current changes included
- never force-push or rewrite history unless the user explicitly asks and confirms the risk

## Project Subagents

Project-level subagents are available under `.claude/agents/`.

They are intentionally narrow and should be used only for bounded stabilization work. Do not spawn subagents by default for every task. Use one when the user asks for it, a Codex handoff names it, or the task clearly matches the subagent's description.

Available subagents:

- `credential-sanitizer`: hard-coded Cookie cleanup, secret checks, and credential externalization while preserving Cookie-based subtitle access.
- `package-maintainer`: package entry points, npm scripts, lockfile, publish contents, Smithery runtime cleanup, and `npm pack --dry-run`.
- `test-baseline-builder`: minimal Vitest test baseline and deterministic non-network tests.
- `build-error-resolver`: focused fixes for `npm run build`, TypeScript, ESM, or MCP compilation failures.
- `risk-reviewer`: post-change review for concrete bugs, regressions, credential leaks, MCP compatibility risks, and missing verification.
- `release-verifier`: final phase or release readiness checks across build, tests, package contents, secrets, Smithery status, and MCP compatibility.

Subagent use must still respect the repository rules in this file and `AGENTS.md`. If a subagent reports a decision point, stop and return it to the user or Codex instead of guessing.

## Report Format

When returning work to the user or Codex, report:

- files changed
- commands run
- command results
- package dry-run result when package metadata or publish contents changed
- test status, including whether `npm test` is still a stub
- what remains uncertain
- blockers or follow-ups

If a check fails, include the failing command and the relevant error summary.

## Success Criteria

Good behavior in this repository looks like:

- Codex decides, Claude Code executes, user orchestrates
- changes stay minimal and intentional
- existing public MCP behavior is preserved unless intentionally changed
- credentials and local secrets are protected
- Cookie-based subtitle access still works when credentials are provided externally
- unused Smithery runtime config stays removed
- package metadata points at `dist`
- encoding does not get worse
- verification is explicit
