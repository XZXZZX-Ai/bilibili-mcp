# AGENTS.md

## Project Role

This repository is `@xzxzzx/bilibili-mcp`, a TypeScript MCP server for extracting Bilibili video subtitles, metadata, and popular comments.

The expected collaboration model is:

- Codex: planning, architecture direction, task decomposition, risk review, and final verification guidance.
- Claude Code: implementation work based on the execution brief produced by Codex. The concrete model is chosen by the user or current runtime and may change over time.

Codex should usually produce a clear execution brief before implementation starts. Claude Code should execute the brief, keep changes scoped, then return the diff, logs, or summary for review.

The user manually orchestrates both tools. Do not auto-switch roles, assume another tool has already run, or create autonomous multi-agent workflows unless explicitly requested.

Do not hard-code a model choice in repository configuration, scripts, prompts, or handoff instructions unless the user explicitly requests that exact model configuration.

## Working Mode

Before changing code, Codex should clarify or infer:

- The update goal.
- The files and modules likely involved.
- The minimum viable change.
- The validation commands.
- The risks and rollback points.

Preferred execution brief format:

```markdown
## Update Goal
## Current Judgment
## Recommended Approach
## Things To Avoid
## Claude Code Execution Steps
## Acceptance Criteria
## Risks
```

For larger changes, split the work into small tasks that can be implemented and verified independently.

If Codex believes Claude Code should execute a task, Codex should produce a bounded handoff and stop. The user decides whether to paste or run it in Claude Code.

If implementation work raises an architectural or product decision, Claude Code should report the decision point and stop instead of guessing.

## Markdown Agent Communication

Codex and Claude Code should communicate substantial implementation work through Markdown handoffs and reports, not only through transient chat.

- Use `docs/agent-memory/agent-communication.md` as the protocol and template source.
- For substantial implementation work, Codex should create `docs/agent-memory/handoffs/YYYY-MM-DD-<topic>-codex-to-claude.md`.
- Claude Code should return a Markdown report using the template in `agent-communication.md`; if file-backed, use `docs/agent-memory/handoffs/YYYY-MM-DD-<topic>-claude-report.md`.
- Short, single-command tasks can stay in chat Markdown, but release, package, credential, MCP tool, and multi-file implementation work should use file-backed Markdown handoffs.
- Handoffs must include objective, files to inspect/edit, required capabilities, constraints, execution steps, verification commands, acceptance criteria, things not to change, and stop/report conditions.
- Reports must include files changed, commands run, command results, unresolved risks, skipped checks, and decision points.
- Do not include secrets, full Cookie values, `.env` contents, npm tokens, GitHub tokens, or private credentials in handoff/report Markdown.

## Project Memory

This repository has a project-local memory system under `docs/agent-memory/`.

Before substantial planning, review, roadmap, or handoff work, Codex should read:

- `docs/agent-memory/README.md`
- `docs/agent-memory/project-facts.md`
- `docs/agent-memory/decisions.md`
- `docs/agent-memory/lessons-learned.md`

Update project memory when:

- the user corrects an assumption or workflow
- a durable technical decision is made
- a project-specific rule becomes clear
- a verification result changes the known project state
- a repeated pitfall is discovered

Do not store secrets, full Cookie values, `.env` content, npm tokens, GitHub tokens, or unverified guesses in memory.

Project-local hooks are enabled for Claude Code and Codex app after explicit user approval on 2026-05-28:

- Claude Code hook registration lives in `.claude/settings.local.json`.
- Codex app hook registration lives in `.codex/hooks.json`.
- Shared hook scripts live in `.codex/scripts/`.
- Codex runtime observations are stored under `C:\Users\ZX\.codex\memories\bilibili-mcp\`.
- Claude runtime observations are stored under `.claude\memory\` and `.claude\runtime\`.

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

## Current Roadmap

The active stabilization plan is:

- `docs/superpowers/plans/2026-05-27-stabilization-roadmap.md`

Use that plan as the source of truth for near-term work. The intended order is:

1. Remove hard-coded Bilibili credentials without removing Cookie-based access.
2. Fix npm package entry points so published package metadata targets `dist`.
3. Remove unused Smithery runtime configuration and related package scripts/dependency.
4. Add a real minimal test baseline.
5. Clean npm package contents.
6. Run final baseline verification.

Do not start the `src/bilibili/client.ts` split or new MCP tools until the stabilization baseline is complete and verified.

## Repository Map

- `src/index.ts`: MCP stdio entry point and reusable server export.
- `src/server.ts`: MCP tool registration and request handling.
- `src/cli.ts`: CLI entry point and credential setup flow.
- `src/config.ts`: runtime configuration and language preference handling.
- `src/bilibili/`: Bilibili API integration, auth, subtitles, comments, and shared types.
- `src/utils/`: validation, sanitization, retry, logging, cache, credentials, and error helpers.
- `README.md`, `README_EN.md`, `CHANGELOG.md`, `CHANGELOG_EN.md`: user-facing documentation.

## Development Commands

Use these commands for verification:

```bash
npm run build
```

The current `npm test` script is a stub that exits with an error. Do not treat `npm test` as a passing test suite unless the project adds real tests later.

Useful manual scripts in the repository include:

- `test_cookie_status.ts`
- `test_get_subtitle.ts`
- `test_subtitle_api.ts`
- `test_subtitle_full.ts`
- `test_mcp.js`
- `test_login.js`
- `test_subtitle.js`

Only run scripts that are relevant to the change. Some may require valid Bilibili cookie environment variables.

After a real test runner is added, `npm test` should become part of the normal verification path. Until then, explicitly say that `npm test` is still a stub when reporting verification.

## Core Execution Standards

### Think Before Changing

- State important assumptions explicitly.
- If the task is ambiguous and the ambiguity changes implementation direction, clarify before editing.
- If multiple interpretations exist, surface the tradeoff instead of silently choosing.

### Simplicity First

- Write the minimum needed to solve the task.
- Do not add speculative features.
- Do not introduce premature abstractions.
- Prefer the smaller clear solution over a generalized one.

### Surgical Changes

- Touch only directly relevant files.
- Do not do drive-by cleanup.
- Match the local style of the files you edit.
- Mention unrelated issues separately instead of fixing them opportunistically.

### Verify Before Done

- Run relevant checks when available.
- If verification is not possible, say so clearly.
- Do not use "should work" as a completion standard.

### Windows Paths

- This repository is worked on from Windows.
- Human-facing paths may use Windows backslashes.
- Commands or paths stored inside JSON, TOML, hooks, MCP config, or other cross-shell configuration should prefer absolute forward-slash paths when possible.
- Do not write configuration that depends on the current working directory unless the tool explicitly requires it.

## Coding Guidelines

- Keep changes tightly scoped to the requested update.
- Follow the existing TypeScript ESM style and Node16 module resolution.
- Preserve MCP compatibility and the reusable default server export behavior.
- Keep npm package entry points aligned with built output: `main`, `module`, and `types` should target `dist`, not `src`.
- Keep API-facing responses JSON-serializable and predictable.
- Validate user-provided BV IDs, URLs, language codes, and detail-level inputs before calling Bilibili APIs.
- Prefer existing utility modules over adding duplicate logic.
- Do not commit credentials, cookies, tokens, or local `.env` values.
- Preserve Cookie-based subtitle access. Bilibili Cookie values may be required for reliable subtitle retrieval, but they must come from `.env`, environment variables, or the global credential file, never from hard-coded source literals.
- Do not modify generated output in `dist/` unless the task explicitly requires release artifacts.
- Smithery is no longer part of the current project workflow. Do not recreate `smithery.json`, `smithery.yaml`, `dev: smithery dev`, `build:smithery`, or `@smithery/cli` unless the user explicitly brings Smithery back.

## Documentation And Encoding

Several existing Markdown files and comments contain mojibake/encoding corruption. When touching user-facing text:

- Prefer clean UTF-8 Chinese and English.
- Do not copy corrupted text into new content.
- If a change touches a corrupted section, repair only the relevant local section unless the task is a documentation cleanup.
- Avoid broad documentation rewrites during code-focused tasks.
- If terminal output displays Chinese as mojibake, verify the file with an explicit UTF-8 reader before concluding the file itself is corrupted.
- Do not write replacement characters or new mojibake into project files.

## Security Rules

- Treat any previously committed or locally visible Bilibili Cookie value as exposed.
- When removing a hard-coded Cookie, preserve the feature by replacing the literal with environment-based loading.
- Never print full Cookie values, `SESSDATA`, `bili_jct`, or `DedeUserID` in logs, tests, examples, or reports.
- If a task discovers a real secret in tracked files, report the file and field, remove or externalize it, and tell the user credential rotation is required.

## Documentation Freshness

- For OpenAI, Codex, MCP, SDK, npm publishing, or external tool behavior, prefer current official documentation over memory when behavior may have changed.
- For GitHub-hosted examples, remote repositories, PRs, issues, releases, or external agent configuration examples, inspect the live source before making a recommendation.

## Git And Handoff Rules

- Check `git status --short` before and after work.
- Do not revert user changes unless explicitly asked.
- Keep commits small and task-focused when commits are requested.
- More specific instruction files in subdirectories should win over this root file when present.
- Preserve existing local workflow/configuration artifacts unless the task explicitly asks to change them.
- Do not delete files because they look generated, temporary, or obsolete without confirming scope first.
- Deleting `smithery.json` and `smithery.yaml` is intentional under the stabilization roadmap. Treat `SMITHERY_PUBLISH_GUIDE.md` as documentation; delete it only if explicitly requested or covered by a documentation cleanup task.
- Codex handoffs to Claude Code should include:
  - objective
  - files to inspect or edit
  - constraints
  - verification expected
  - what not to change
- If Claude Code performs implementation, it should report:
  - files changed
  - commands run
  - command results
  - unresolved risks or skipped checks

## Capability Invocation Rules

Codex and Claude Code should use skills, MCP tools, and subagents deliberately instead of relying on implicit recall.

Before substantial planning, implementation, review, Git work, testing work, release work, or external-tool guidance:

1. Identify which capability category applies: skill, MCP/tool connector, Codex custom agent, or Claude Code subagent.
2. Check the locally documented capability names and paths in this file, `CLAUDE.md`, `.codex/agents/`, `.claude/agents/`, and the active skill list available to the current agent.
3. Invoke or explicitly name the relevant capability in the handoff when its trigger matches the task.
4. If a relevant capability is intentionally not used, state the reason briefly in the handoff or report.
5. Do not use unavailable capabilities by assumption. If a capability is not installed for the current agent, report that and use the closest installed fallback.

Skill usage rules:

- If the user explicitly names a skill, use that skill or state why it is unavailable.
- Use `vitest` for adding or maintaining the test baseline.
- Use `secret-scanning` for credential, Cookie, `.env`, package contents, workflow secrets, or pre-commit/pre-publish secret-risk work.
- Use the configured Git skills for commit, push, PR, CI, review-comment, and GitHub Actions workflows instead of ad hoc Git workflows.
- Do not assume Codex skills, `.agents\skills`, and Claude Code skills are shared. Claude Code skills must exist under `C:\Users\ZX\.claude\skills` or be explicitly synced there.

MCP/tool connector usage rules:

- Use the GitHub connector or GitHub skills for live GitHub repositories, PRs, issues, review comments, Actions logs, and remote CI state.
- Use official documentation or MCP-backed docs tools for OpenAI, Codex, MCP SDK, npm publishing, GitHub Actions, and other external behavior that may have changed.
- Use local shell commands for repository facts, package metadata, tests, and build output because the worktree is authoritative.
- Do not invent MCP server behavior or remote state from memory; inspect the live source, official docs, or local files.

Fixed MCP/tool connector triggers:

- For live GitHub repository facts, pull requests, issues, releases, review comments, remote branches, and Actions run state, use the GitHub connector or installed GitHub skills/CLI before making claims.
- For concrete failing GitHub Actions, npm publish, or PR checks, use `github:gh-fix-ci` or the GitHub connector to inspect the actual run logs before proposing a fix.
- For GitHub Actions workflow syntax, OIDC permissions, npm trusted publishing, npm provenance, runner behavior, caching, artifacts, or publish workflow design, use `github-actions-docs` and current official documentation.
- For OpenAI, Codex, OpenAI SDK/API, or MCP SDK behavior, use the relevant official documentation or MCP-backed docs capability before giving implementation guidance when behavior may have changed.
- For npm registry state, published versions, dist-tags, provenance, or package metadata, query the live registry with npm tooling; do not rely on `package.json` alone.
- For local MCP server behavior, tool lists, schemas, package metadata, tests, builds, and pack contents, use local shell commands from this worktree as the authority.
- For browser-visible local docs, demos, localhost pages, screenshots, or UI behavior, use the Browser/in-app browser tooling when the target is local or visual verification is requested.
- For current remote repository identity after owner/name changes, verify with `git remote -v`, `gh repo view`, or the GitHub connector before editing README, package metadata, publish trust guidance, or release instructions.
- For Lark/Feishu, Canva, Hugging Face, or other external app workflows, use the matching installed connector/skill only when the user explicitly asks for that external system or provides that system's link/context.

If a fixed MCP/tool trigger applies but the connector is unavailable or unauthenticated, report that state, use the closest safe CLI or official-doc fallback, and avoid presenting unverified remote state as fact.

Fixed CLI triggers:

- Use `git` CLI for local worktree facts: status, diff, log, branches, tags, remotes, staging, commits, and pushes requested by the user. Use GitHub MCP/connector or `gh` only when the question depends on remote GitHub state.
- Use `rg`, `Get-ChildItem`, and file reads for local code, docs, tests, and config inspection. Do not use MCP for facts already authoritative in the checked-out worktree.
- Use `npm`, `node`, `tsc`, and `vitest` commands for package metadata, scripts, tests, builds, and `npm pack --dry-run`; these local commands are more authoritative than MCP for this repository's current source state.
- Use `npm view` for npm registry versions, dist-tags, package metadata, and publish availability. Use npm/GitHub documentation tools for rules and requirements, not registry state.
- Use `gh` CLI for quick authenticated GitHub checks when local auth exists and structured connector access is unnecessary: `gh repo view`, `gh run list/view`, `gh release view`, `gh pr view`, and `gh issue view`. Prefer the GitHub connector or GitHub skills when the task needs richer PR/issue/review-comment context or connector-managed workflows.
- Use project Python hook scripts directly for memory-system health checks: `.codex/scripts/plan_tracker.py`, `.codex/scripts/generate_learning_proposals.py`, `.codex/scripts/context_budget.py`, and related hook scripts. Do not infer learning state from memory alone when these scripts can refresh it.
- Use local CLI smoke tests for the MCP package, such as `npx -y @xzxzzx/bilibili-mcp config` and `npx -y @xzxzzx/bilibili-mcp check`, when verifying installed-user credential guidance. Do not print Cookie values from any CLI output.
- Use external service CLIs, such as `lark-cli`, only when the matching external workflow is explicitly requested or already in scope; otherwise keep this repository's work local.

Subagent usage rules:

- Codex should use or recommend `.codex/agents/` only for planning, risk review, and release verification.
- Codex should name the relevant `.claude/agents/` subagent in Claude Code handoffs when implementation work clearly matches it.
- Claude Code should use `.claude/agents/` when the user asks, Codex names the subagent, or the task clearly matches the subagent description.
- Do not spawn autonomous agent trees or multi-agent teams unless the user explicitly asks for that workflow.
- Every report that used a subagent should name which subagent was used and summarize its result.

Fixed invocation triggers:

- For any work that changes or diagnoses tests, test helpers, fixtures, or Vitest configuration, use the `vitest` skill. If implementation is delegated to Claude Code, name the `test-baseline-builder` subagent unless the task is only running existing tests.
- For credential, Cookie, `.env`, token, redaction, package-secret, pre-commit secret, or pre-publish secret-risk work, use `secret-scanning`. If implementation is delegated to Claude Code, name `credential-sanitizer` for credential cleanup or `risk-reviewer` for post-change leak review.
- For `npm run build`, TypeScript, Node ESM, import/export, MCP compilation, or failing build output, use systematic debugging and name the Claude Code `build-error-resolver` subagent for implementation.
- For `package.json`, `package-lock.json`, npm scripts, package entry points, package contents, `npm pack --dry-run`, or Smithery cleanup, name the Claude Code `package-maintainer` subagent. Also run or request `npm pack --dry-run` when package contents can change.
- For release, tag, npm publish, GitHub Release, provenance, trusted publishing, or final release readiness work, use `github-actions-docs` for workflow/OIDC/npm documentation questions and name `release-verifier` before completion.
- For completed implementation that affects MCP tools, credentials, package publishing, release workflow, or shared Bilibili API behavior, use or request `risk-reviewer` before accepting the change.
- For GitHub Actions, npm publishing workflow YAML, OIDC, permissions, secrets, runners, artifacts, or caching, use `github-actions-docs`; for concrete failed checks or publish runs, use `github:gh-fix-ci`.
- For local commit only, use `git-local-commit`; for commit plus push, use `git-publish`; for branch plus draft PR workflow, use `github:yeet` only when explicitly requested.
- For substantial planning, roadmap synchronization, handoffs, verification records, or durable project rules, use `bilibili-mcp-memory` and update the matching file under `docs/agent-memory/` when a verified durable fact, decision, lesson, handoff, or verification result is produced.

If a fixed trigger applies but the named skill or subagent is unavailable in the current agent runtime, explicitly report the missing capability and use the closest installed fallback. If multiple triggers apply, use the smallest set that covers the risk and state that set before work or in the handoff.

## Git Skill Workflow

Use these Git skills as the default workflow for this repository:

- `git-local-commit`: use when the user asks for a local commit only. It should inspect the actual diff, stage only relevant files, create one focused commit, and never push.
- `git-publish`: use when the user asks to commit and push current changes to GitHub. It should preserve scope boundaries, push the current branch, and not create a PR by default.
- `github:yeet`: use only when the user explicitly wants a branch + commit + push + draft PR workflow.
- `github:gh-fix-ci`: use when GitHub Actions, npm publish, or PR checks fail and logs need to be inspected before proposing a fix.
- `github:gh-address-comments`: use when the user asks to inspect or address PR review comments.
- `github-actions-docs`: use when designing, explaining, securing, or maintaining GitHub Actions workflow YAML, OIDC, secrets, runners, artifacts, caching, or npm publish workflow documentation. This skill is installed at `C:\Users\ZX\.agents\skills\github-actions-docs`.

Claude Code uses a separate skill directory under `C:\Users\ZX\.claude\skills`. Do not assume a skill installed under `.agents\skills` is automatically available to Claude Code unless it has also been installed or synced there.

Use `github-actions-docs` for docs-grounded workflow guidance. Use `github:gh-fix-ci` for concrete failing checks and log inspection.

Do not use overlapping external Git commit or GitHub CLI skills unless they provide a clear advantage over the installed local skills above.

## Claude Code Subagents

Project-level Claude Code subagents live under `.claude/agents/`. They are adapted from ECC-style agents, but narrowed for this repository and the active stabilization roadmap.

Use them only for bounded work. Do not let subagents expand the roadmap, create autonomous teams, or bypass the user's manual orchestration model.

Recommended mapping:

- `credential-sanitizer`: use for Task 1 credential cleanup, hard-coded Cookie removal, and secret-leak checks. It must preserve Cookie-based subtitle access through external credentials.
- `package-maintainer`: use for Task 2, Task 3, and Task 5 package metadata, lockfile, npm scripts, Smithery runtime removal, and `npm pack --dry-run` work.
- `test-baseline-builder`: use for Task 4 minimal Vitest baseline. It should avoid network-dependent tests and real credential fixtures.
- `build-error-resolver`: use when `npm run build`, TypeScript, Node ESM, or MCP compilation fails.
- `risk-reviewer`: use after implementation when Codex or Claude Code needs a focused bug/security/regression review.
- `release-verifier`: use before completing a stabilization phase or release-oriented change to verify build, tests, package contents, secrets, Smithery removal, and MCP compatibility.

Codex should normally mention the relevant subagent in the Claude Code handoff instead of assuming Claude Code will auto-select it. Claude Code may use the named subagent when the user explicitly asks or when a Codex handoff recommends it.

## Codex Custom Agents

Project-level Codex custom agents live under `.codex/agents/` as standalone TOML files. They are intentionally fewer than the Claude Code subagents and should focus on decision, review, and verification work.

Available Codex agents:

- `stabilization-reviewer`: use before implementation to review roadmap order, task scope, Claude Code handoff quality, acceptance criteria, and rollback points.
- `risk-reviewer`: use after implementation to review concrete bugs, credential leakage, TypeScript/MCP compatibility, package risks, and missing verification.
- `release-verifier`: use before completing a stabilization phase or release-oriented change to verify build, tests, npm package contents, secrets, Smithery removal, and MCP compatibility.

Do not use Codex custom agents as autonomous worker teams by default. The user must explicitly ask Codex to spawn agents, and Codex should consolidate their results into a short recommendation.

## Review Checklist

Before calling a change complete, verify:

- `npm run build` passes, unless the failure is unrelated and clearly documented.
- `npm test` passes after a real test runner is added; before that, the stub status is clearly documented.
- `npm pack --dry-run` is checked for publishing-related changes.
- MCP tool names, schemas, and response shapes remain stable unless intentionally changed.
- Error handling returns useful messages without leaking credentials.
- Network-dependent behavior has clear fallback/error paths.
- Documentation updates match the implemented behavior.
