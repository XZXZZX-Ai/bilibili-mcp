# CLAUDE.md

This file configures Claude Code behavior for `C:\Users\ZX\bilibili-mcp`.

Claude Code is the execution model for this repository. Codex is the planning, direction, review, risk-control, and Paseo orchestration model.

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

If a decision should go back to Codex, stop and state the decision point in the report. Codex owns the follow-up through Paseo.

## Before Acting

Before substantial work:

1. Read `AGENTS.md`.
2. Check for a more specific `AGENTS.md` or `CLAUDE.md` in the relevant subtree.
3. Follow the most specific instruction file.
4. Confirm the concrete objective and scope.
5. Check `git status --short`.

If the task comes from a Codex handoff, follow the handoff first. Do not assume extra context that is not written in the handoff or visible in the repository.

If the task comes from a task ticket based on `docs/templates/task-ticket.md` or a GitHub issue produced by the Matt Pocock workflow, treat the ticket as the planning boundary. Follow its dependencies and acceptance criteria, then use the Codex handoff as the execution boundary for files, verification gates, required capabilities, rollback, and stop/report conditions.

Task ticket standard:

- Task takes 30 minutes or less and has no public behavior change: no task ticket required; a direct Codex handoff is enough.
- Task touches multiple files, tests, security, package/release workflow, or MCP tool behavior: use a task ticket.
- Task comes from a PRD, roadmap, multi-task split, or Claude Code loop workflow: task ticket is required.

If the task is underspecified:

- ask for the missing boundary
- do not silently choose a larger scope
- do not turn a small fix into a broad refactor

## Active Work

There is no active local Superpowers plan. Follow the user-approved GitHub Issue/Matt ticket and its bounded Codex handoff. See `docs/agent-memory/active-work.md`.

Files under `docs/superpowers/` are historical records only. Do not treat them as current instructions or invoke any `superpowers:*` skill.

## Project Memory

This repository has a project-local memory system under `docs/agent-memory/`.

Before implementing a Codex handoff or doing substantial repository work, Claude Code should read:

- `docs/agent-memory/README.md`
- `docs/agent-memory/project-facts.md`
- `docs/agent-memory/decisions.md`
- `docs/agent-memory/lessons-learned.md`
- `docs/agent-memory/harness-eval.md` when a roadmap phase, release, or significant harness update should be evaluated

When asked to capture memory, append concise dated entries to the relevant file:

- `handoff-log.md` for execution handoffs and implementation reports
- `verification-log.md` for important command results
- `decisions.md` for durable choices
- `lessons-learned.md` for corrections and repeated pitfalls
- `project-facts.md` for stable repository facts
- `codemap.md` for durable changes to code navigation, module ownership, MCP tool flow, test layout, package/release files, or agent harness structure
- `harness-eval.md` for periodic workflow evaluations after roadmap phases, releases, significant harness updates, or repeated process friction

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

Use these as the default verification commands:

```bash
npm run build
npm test
```

For package or publishing changes, also run:

```bash
npm pack --dry-run
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
- For changes to agent harness surfaces such as `AGENTS.md`, `CLAUDE.md`, `.claude/`, `.codex/`, hooks, skills, subagents, MCP/tool connector guidance, `docs/agent-memory/`, `docs/templates/`, `docs/research/`, or `docs/qa/`, review `docs/agent-memory/harness-security.md` and preserve its trust-boundary and no-secret rules.

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

## Paseo-Bounded Orchestration

Codex launches Claude Code through Paseo from a bounded handoff. Claude Code remains an implementation worker, not the workflow owner.

- Do not invoke Paseo or delegate to another top-level agent from inside the implementation run.
- Do not create subagent trees by default.
- Do not transform a simple execution request into a multi-agent process.
- Use at most one named project subagent when a fixed trigger requires it.
- If the implementation direction is unclear, stop and report the decision point to Codex.

## Markdown Agent Communication

Codex and Claude Code should communicate substantial implementation work through Markdown handoffs and reports.

- Read `docs/agent-memory/agent-communication.md` when receiving or writing a file-backed handoff/report.
- Prefer Codex handoffs under `docs/agent-memory/handoffs/YYYY-MM-DD-<topic>-codex-to-claude.md` for release, package, credential, MCP tool, and multi-file implementation work.
- Return a Markdown report using the template in `agent-communication.md`; if writing a file, use `docs/agent-memory/handoffs/YYYY-MM-DD-<topic>-claude-report.md`.
- A Claude report must include files changed, commands run, command results, skipped checks, unresolved risks, decision points, and suggested Codex review focus.
- A Claude report must include a `Harness Artifacts` section that explicitly states: task ticket used/not required with reason; research note created/not required with reason; QA checklist created/not required with reason; codemap updated/checked unchanged/not applicable; harness security reviewed/not applicable; harness eval updated/deferred/not applicable.
- If the handoff is missing required context, ask for clarification or report the missing context instead of guessing.
- Do not include secrets, full Cookie values, `.env` contents, npm tokens, GitHub tokens, or private credentials in handoff/report Markdown.

## Agent skills

### Issue tracker

Specs and tickets produced by Matt Pocock skills live in GitHub Issues for `XZXZZX-Ai/bilibili-mcp`. See `docs/agents/issue-tracker.md`.

### Triage labels

Use the default Matt triage vocabulary: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, and `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

This is a single-context repository. Read the root `CONTEXT.md` and relevant ADRs under `docs/adr/` when they exist; create them lazily only when domain language or durable decisions need them. See `docs/agents/domain.md`.

### Workflow routing

- Prefer the installed Matt Pocock skills for feature discovery, specification, ticket splitting, bounded implementation, difficult bug diagnosis, and code review.
- Use `grill-with-docs` for unclear feature work, `to-spec` then `to-tickets` for multi-session work, and `implement` for one approved bounded ticket.
- A Matt issue remains the planning source; follow the file-backed Codex handoff as the execution boundary and return the normal Claude report.
- When launched by Paseo, write the requested report file before finishing so Codex can review the result without hidden session context.
- Do not run the `implement` skill's commit step unless the user explicitly requested a commit. Follow the Git Skill Awareness rules instead.
- Do not invoke any `superpowers:*` skill. Use the Matt workflow and the repository's narrower project-specific skills. Do not create autonomous agent teams or bypass security and verification rules.

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
- Use `codex-security` only when it is available in the current runtime and the task is a repository-wide security scan, MCP security review, attack-path analysis, security diff scan, validation of non-trivial findings, or a fix for validated security findings. If unavailable in Claude Code, report that and use `secret-scanning`, `risk-reviewer`, or `credential-sanitizer` as the closest local fallback.
- Use `product-requirements` only when a new feature, new MCP tool, public behavior change, or unclear request needs requirements clarification before planning; do not use it for already-scoped implementation, bug fixes, release work, or package maintenance.
- Use `system-design` only for broad architecture decisions that affect multiple modules, data/control flow, deployment/runtime shape, or long-term maintainability; prefer `codebase-design` for smaller module-interface or seam work.
- Use `domain-modeling` only when the task changes or formalizes project language, core concepts, glossary terms, or durable architectural decisions; do not invoke it for ordinary bug fixes, package maintenance, release work, or code review that only consumes existing terminology.
- Use `codebase-design` only when designing or changing module interfaces, seams, adapter boundaries, testability structure, or a non-trivial refactor; do not invoke it for narrow edits that leave module shape unchanged.
- Use the Git skills in the Git Skill Awareness section for commit, push, PR, CI, review-comment, and GitHub Actions workflows.
- Do not assume a skill under `C:\Users\ZX\.agents\skills` or `C:\Users\ZX\.codex\skills` is available to Claude Code unless it also exists under `C:\Users\ZX\.claude\skills`.

MCP/tool usage:

- Use the local repository and shell commands as the authority for worktree state, package metadata, tests, build output, and diffs.
- Use GitHub tooling or GitHub skills for live PRs, issues, review comments, Actions logs, remote checks, and repository state.
- Use docs-grounded tools or installed documentation skills for GitHub Actions, npm publishing, MCP SDK, OpenAI/Codex behavior, or any external behavior likely to have changed.
- When external research materially affects implementation, release workflow, security conclusions, third-party examples, or architecture decisions, use `docs/templates/research-note.md` and save the note under `docs/research/`. Do not create research notes for local worktree facts.
- Do not guess remote state, current documentation, or MCP behavior from memory when a tool or official source can verify it.

Fixed MCP/tool triggers:

- For live GitHub repository facts, pull requests, issues, releases, review comments, remote branches, and Actions run state, use GitHub tooling, `gh`, or installed GitHub skills before making claims.
- For concrete failing GitHub Actions, npm publish, or PR checks, use `gh-fix-ci` or inspect the actual `gh run` logs before proposing a fix.
- For GitHub Actions workflow syntax, OIDC permissions, npm trusted publishing, npm provenance, runner behavior, caching, artifacts, or publish workflow design, use `github-actions-docs` and current official documentation.
- For OpenAI, Codex, OpenAI SDK/API, or MCP SDK behavior, use the relevant official documentation or installed docs skill before giving implementation guidance when behavior may have changed.
- For npm registry state, published versions, dist-tags, provenance, or package metadata, query the live registry with npm tooling; do not rely on `package.json` alone.
- For local MCP server behavior, tool lists, schemas, package metadata, tests, builds, and pack contents, use local shell commands from this worktree as the authority.
- For current remote repository identity after owner/name changes, verify with `git remote -v`, `gh repo view`, or equivalent GitHub tooling before editing README, package metadata, publish trust guidance, or release instructions.
- For Lark/Feishu, Canva, Hugging Face, or other external app workflows, use the matching installed connector/skill only when the user explicitly asks for that external system or provides that system's link/context.

If a fixed MCP/tool trigger applies but the connector is unavailable or unauthenticated, report that state, use the closest safe CLI or official-doc fallback, and avoid presenting unverified remote state as fact.

Fixed CLI triggers:

- Use `git` CLI for local worktree facts: status, diff, log, branches, tags, remotes, staging, commits, and pushes requested by the user. Use GitHub tooling only when the question depends on remote GitHub state.
- Use `rg`, shell file listing, and file reads for local code, docs, tests, and config inspection. Do not use MCP or external tools for facts already authoritative in the checked-out worktree.
- Use `npm`, `node`, `tsc`, and `vitest` commands for package metadata, scripts, tests, builds, and `npm pack --dry-run`; these local commands are more authoritative than MCP for this repository's current source state.
- Use `npm view` for npm registry versions, dist-tags, package metadata, and publish availability. Use documentation skills for rules and requirements, not registry state.
- Use `gh` CLI for quick authenticated GitHub checks when local auth exists and a copied GitHub skill or connector workflow is unnecessary: `gh repo view`, `gh run list/view`, `gh release view`, `gh pr view`, and `gh issue view`. Use GitHub skills when the task is specifically a PR, CI, review-comment, or GitHub workflow task.
- Use project Python hook scripts directly for memory-system health checks: `.codex/scripts/plan_tracker.py`, `.codex/scripts/generate_learning_proposals.py`, `.codex/scripts/context_budget.py`, and related hook scripts. Do not infer learning state from memory alone when these scripts can refresh it.
- Use local CLI smoke tests for the MCP package, such as `npx -y @xzxzzx/bilibili-mcp config` and `npx -y @xzxzzx/bilibili-mcp check`, when verifying installed-user credential guidance. Do not print Cookie values from any CLI output.
- Use external service CLIs, such as `lark-cli`, only when the matching external workflow is explicitly requested or already in scope; otherwise keep this repository's work local.

Subagent usage:

- Use a project subagent when the user asks, Codex handoff names it, or the task clearly matches `.claude/agents/<name>.md`.
- Use only one focused subagent by default. Do not create subagent trees or multi-agent workflows unless the user explicitly asks.
- If a subagent reports a decision point, stop and return the decision point to the user or Codex.
- In the final report, include the subagent name used, or state that no subagent was used and why.

Fixed invocation triggers:

- For tests, test helpers, fixtures, Vitest configuration, or diagnosing test failures, use the `vitest` skill. Use `test-baseline-builder` when adding or maintaining deterministic test coverage.
- For credential, Cookie, `.env`, token, redaction, package-secret, pre-commit secret, or pre-publish secret-risk work, use `secret-scanning`. Use `credential-sanitizer` for credential cleanup and `risk-reviewer` for post-change leak review.
- For MCP security review, repository-wide security scanning, attack-path analysis, security diff review, or fixing validated security findings, prefer Codex with `codex-security`; in Claude Code, report if that skill is unavailable and use `risk-reviewer`, `credential-sanitizer`, or `secret-scanning` only for the bounded local portion.
- For `npm run build`, TypeScript, Node ESM, import/export, MCP compilation, or failing build output, use `build-error-resolver`.
- For `package.json`, `package-lock.json`, npm scripts, package entry points, package contents, `npm pack --dry-run`, or Smithery cleanup, use `package-maintainer`.
- For release, tag, npm publish, GitHub Release, provenance, trusted publishing, or final release readiness work, use `release-verifier` before reporting completion. Use `github-actions-docs` for workflow/OIDC/npm documentation questions.
- For completed changes that affect MCP tools, credentials, package publishing, release workflow, or shared Bilibili API behavior, use `risk-reviewer` before reporting the change as accepted.
- For GitHub Actions, npm publishing workflow YAML, OIDC, permissions, secrets, runners, artifacts, or caching, use `github-actions-docs`; for concrete failed checks or publish runs, use `gh-fix-ci`.
- For new MCP tools, feature additions, public response-shape changes, or ambiguous user-facing behavior where success criteria are not yet clear, use `product-requirements` before implementation or report that requirements are missing.
- For cross-module architecture changes, new runtime subsystems, major flow redesigns, or changes that affect both MCP tool boundaries and Bilibili integration structure, use `system-design` before implementation; skip it for local refactors where `codebase-design` is sufficient.
- For work that defines or renames project concepts such as BVID handling, credential source, transcript/subtitle semantics, MCP tool terminology, fallback behavior, or error categories, use `domain-modeling` and record the resulting durable term or decision only when it actually crystallizes.
- For work that splits `src/bilibili/client.ts`, reshapes `src/server.ts` handlers, introduces or removes adapters/seams, changes shared Bilibili API module interfaces, or redesigns test seams, use `codebase-design` before implementation or when following a Codex handoff that names it.
- For local commit only, use `git-local-commit`; for commit plus push, use `git-publish`; for branch plus draft PR workflow, use `yeet` only when explicitly requested.
- For substantial planning, roadmap synchronization, handoffs, verification records, or durable project rules, use `bilibili-mcp-memory` and update the matching `docs/agent-memory/` file when a verified durable fact, decision, lesson, handoff, or verification result is produced.

If a fixed trigger applies but the named skill or subagent is unavailable, report the missing capability and use the closest installed fallback. If multiple triggers apply, use the smallest focused set and name it in the report.

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
- `product-requirements`: use only when unclear or new user-facing functionality needs requirements clarification before implementation. Installed for Claude Code at `C:\Users\ZX\.claude\skills\product-requirements`.
- `system-design`: use only for broad architecture decisions or cross-module design work, not routine refactors. Installed for Claude Code at `C:\Users\ZX\.claude\skills\system-design`.
- `domain-modeling`: use only when project terminology, domain concepts, glossary entries, or durable architectural decisions are being defined or changed. Installed for Claude Code at `C:\Users\ZX\.claude\skills\domain-modeling`.
- `codebase-design`: use only when designing module interfaces, seams, adapter boundaries, testability structure, or non-trivial refactors. Installed for Claude Code at `C:\Users\ZX\.claude\skills\codebase-design`.

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
- test status
- whether `docs/agent-memory/codemap.md` was updated, or why it was checked and left unchanged
- harness artifacts status: task ticket, research note, QA checklist, codemap, harness security, and harness eval
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
- `docs/agent-memory/codemap.md` stays synchronized when structural code, MCP tool flow, tests, release flow, or harness navigation changes
- `docs/templates/qa-checklist.md` is used under `docs/qa/` when changes affect release/install paths, npm package contents, MCP stdio startup, tool discovery, public tool schemas/responses, credential setup/checking, README install guidance, or post-release client verification
