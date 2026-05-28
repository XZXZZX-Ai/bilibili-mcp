# Agent Memory And Learning System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a repository-local learning and memory system for `@xzxzzx/bilibili-mcp` inspired by ECC, without enabling automatic Claude Code hooks in the first phase.

**Architecture:** Create Markdown memory files under `docs/agent-memory/`, connect them to `AGENTS.md` and `CLAUDE.md`, and install one project-specific memory skill for both Codex and Claude Code. Keep the system explicit, local, and safe for the current stabilization phase.

**Tech Stack:** Markdown, AGENTS.md, CLAUDE.md, Codex skills, Claude Code skills, PowerShell, Python validation scripts.

---

## File Structure

- Create `docs/agent-memory/README.md`: explains the memory system and update rules.
- Create `docs/agent-memory/project-facts.md`: stores durable repository facts.
- Create `docs/agent-memory/decisions.md`: stores durable project decisions.
- Create `docs/agent-memory/lessons-learned.md`: stores corrections and reusable operating lessons.
- Create `docs/agent-memory/handoff-log.md`: stores Codex-to-Claude and Claude-to-Codex handoff records.
- Create `docs/agent-memory/verification-log.md`: stores important verification results.
- Modify `AGENTS.md`: tell Codex when to read and update project memory.
- Modify `CLAUDE.md`: tell Claude Code when to read and update project memory.
- Create `C:\Users\ZX\.codex\skills\bilibili-mcp-memory\SKILL.md`: project memory workflow skill for Codex.
- Create `C:\Users\ZX\.claude\skills\bilibili-mcp-memory\SKILL.md`: same project memory workflow skill for Claude Code.
- Do not create or modify Claude Code hooks.
- Do not modify `.claude/settings.local.json`.
- Do not modify `C:\Users\ZX\.claude\settings.json`.

---

### Task 1: Create Repository Memory Files

**Files:**
- Create: `docs/agent-memory/README.md`
- Create: `docs/agent-memory/project-facts.md`
- Create: `docs/agent-memory/decisions.md`
- Create: `docs/agent-memory/lessons-learned.md`
- Create: `docs/agent-memory/handoff-log.md`
- Create: `docs/agent-memory/verification-log.md`

- [ ] **Step 1: Create the memory directory**

Run:

```powershell
New-Item -ItemType Directory -Force docs\agent-memory | Out-Null
```

Expected: `docs\agent-memory` exists.

- [ ] **Step 2: Create `README.md`**

Create `docs/agent-memory/README.md` with this content:

```markdown
# Agent Memory

This directory is the repository-local learning and memory system for `@xzxzzx/bilibili-mcp`.

It exists so Codex and Claude Code can preserve durable project facts, decisions, lessons, handoffs, and verification history across update cycles without enabling automatic Claude Code hooks.

## Files

- `project-facts.md`: stable facts that are currently true.
- `decisions.md`: durable decisions and the reason behind each decision.
- `lessons-learned.md`: corrections, mistakes, and reusable operating lessons.
- `handoff-log.md`: Codex-to-Claude execution handoffs and Claude-to-Codex reports.
- `verification-log.md`: important command results and verification caveats.

## Update When

- The user corrects an assumption or workflow.
- A project-specific rule becomes clear.
- A durable technical decision is made.
- A stabilization task is completed or reprioritized.
- A verification result changes the known project state.
- A repeated pitfall is discovered.

## Do Not Store

- Full Bilibili Cookie strings.
- `SESSDATA`, `bili_jct`, or `DedeUserID` values.
- npm tokens, GitHub tokens, or `.env` content.
- Private user credentials.
- Unverified guesses or transient command output.

## Entry Format

Use dated entries:

```markdown
## 2026-05-27

- Fact: ...
- Evidence: ...
- Impact: ...
```

Keep entries concise and evidence-backed.
```

- [ ] **Step 3: Create `project-facts.md`**

Create `docs/agent-memory/project-facts.md` with this content:

```markdown
# Project Facts

## 2026-05-27

- Fact: This repository is `@xzxzzx/bilibili-mcp`, a TypeScript MCP server for extracting Bilibili video subtitles, metadata, and popular comments.
- Evidence: `AGENTS.md` project role section.
- Impact: Preserve MCP server compatibility and user-facing tool behavior during stabilization.

- Fact: Cookie-based Bilibili access must remain supported, but Cookie values must not be hard-coded.
- Evidence: User correction during stabilization planning and `docs/superpowers/plans/2026-05-27-stabilization-roadmap.md`.
- Impact: Replace literal credentials with `.env`, environment variables, or the credential helper instead of removing authenticated access.

- Fact: Smithery runtime config is no longer part of the active project workflow.
- Evidence: User instruction to delete Smithery config and roadmap Task 3.
- Impact: Do not recreate `smithery.json`, `smithery.yaml`, `dev: smithery dev`, `build:smithery`, or `@smithery/cli`.

- Fact: Claude Code skills live under `C:\Users\ZX\.claude\skills`, which is separate from `C:\Users\ZX\.agents\skills` and `C:\Users\ZX\.codex\skills`.
- Evidence: Local directory inspection on 2026-05-27.
- Impact: When preparing Claude Code skills, install or sync them into `.claude\skills`.
```

- [ ] **Step 4: Create `decisions.md`**

Create `docs/agent-memory/decisions.md` with this content:

```markdown
# Decisions

## 2026-05-27

- Decision: Complete the stabilization roadmap before splitting `src/bilibili/client.ts` or adding new MCP tools.
- Reason: Security, package metadata, tests, and publish contents are higher-risk foundations.
- Evidence: `docs/superpowers/plans/2026-05-27-stabilization-roadmap.md`.

- Decision: Use Vitest for the minimal real test baseline.
- Reason: It handles TypeScript ESM tests cleanly and matches the installed `vitest` skill.
- Evidence: Stabilization roadmap Task 4 and installed Claude Code skill at `C:\Users\ZX\.claude\skills\vitest`.

- Decision: Start with repository-local memory files and a project memory skill, not ECC-style automatic hooks.
- Reason: The repository is still in stabilization, and hooks would change Claude Code runtime behavior.
- Evidence: `docs/superpowers/specs/2026-05-27-agent-memory-learning-system-design.md`.
```

- [ ] **Step 5: Create `lessons-learned.md`**

Create `docs/agent-memory/lessons-learned.md` with this content:

```markdown
# Lessons Learned

## 2026-05-27

- Lesson: Do not assume `.agents\skills` skills are available to Claude Code.
- Evidence: `vitest`, `secret-scanning`, and `github-actions-docs` were first installed under `.agents\skills`; Claude Code needed copies under `.claude\skills`.
- Future behavior: Check the target agent's actual skill directory before claiming a skill is installed for that agent.

- Lesson: Removing hard-coded Bilibili Cookie values must not remove Cookie-based subtitle access.
- Evidence: User clarified that subtitles may require Cookie access.
- Future behavior: Externalize credentials while preserving authenticated retrieval paths.

- Lesson: Some existing Markdown and terminal output can contain mojibake.
- Evidence: `AGENTS.md` and `CLAUDE.md` include encoding safety rules.
- Future behavior: Verify files as UTF-8 before copying or rewriting Chinese text.
```

- [ ] **Step 6: Create `handoff-log.md`**

Create `docs/agent-memory/handoff-log.md` with this content:

```markdown
# Handoff Log

## 2026-05-27

- Owner: Codex
- Objective: Design a repository-local learning and memory system inspired by ECC.
- Files in scope: `docs/agent-memory/`, `AGENTS.md`, `CLAUDE.md`, `C:\Users\ZX\.codex\skills\bilibili-mcp-memory`, `C:\Users\ZX\.claude\skills\bilibili-mcp-memory`.
- Constraints: Do not enable Claude Code hooks in the first phase. Do not store secrets. Preserve the manual Codex-plans and Claude-executes workflow.
- Verification expected: Confirm memory files exist, agent instructions reference them, both skills exist, and no hook settings were modified.
- Unresolved risks: Later ECC-style hooks require a separate opt-in design and rollback path.
```

- [ ] **Step 7: Create `verification-log.md`**

Create `docs/agent-memory/verification-log.md` with this content:

```markdown
# Verification Log

## 2026-05-27

- Command: `npm run build`
- Result: Passed before memory-system work.
- Area: Stabilization baseline.
- Caveat: This result does not verify the memory-system files because they are documentation and skill configuration.

- Command: `git status --short`
- Result: Worktree contains intentional deletes for `smithery.json` and `smithery.yaml`, plus untracked `AGENTS.md`, `CLAUDE.md`, and `docs/`.
- Area: Repository state before memory-system implementation.
- Caveat: Do not assume all untracked files belong to a single commit without reviewing scope.
```

- [ ] **Step 8: Verify memory files exist**

Run:

```powershell
Get-ChildItem docs\agent-memory | Select-Object Name
```

Expected names:

```text
README.md
decisions.md
handoff-log.md
lessons-learned.md
project-facts.md
verification-log.md
```

---

### Task 2: Update Agent Instruction Files

**Files:**
- Modify: `AGENTS.md`
- Modify: `CLAUDE.md`

- [ ] **Step 1: Add memory rules to `AGENTS.md`**

In `AGENTS.md`, add this section after `## Working Mode`:

```markdown
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

Automatic ECC-style hooks are not enabled in the first phase. Do not add Claude Code hooks for memory or learning unless the user explicitly approves a later hook upgrade.
```

- [ ] **Step 2: Add memory rules to `CLAUDE.md`**

In `CLAUDE.md`, add this section after `## Active Stabilization Plan`:

```markdown
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

Automatic ECC-style hooks are not enabled in the first phase. Do not modify `.claude/settings.local.json`, `C:\Users\ZX\.claude\settings.json`, or hook configuration for memory unless the user explicitly approves a later hook upgrade.
```

- [ ] **Step 3: Verify both instruction files reference memory**

Run:

```powershell
Select-String -Path AGENTS.md,CLAUDE.md -Pattern "docs/agent-memory|Automatic ECC-style hooks|Project Memory"
```

Expected: Both files contain `Project Memory`, `docs/agent-memory`, and `Automatic ECC-style hooks`.

---

### Task 3: Create The Codex Memory Skill

**Files:**
- Create: `C:\Users\ZX\.codex\skills\bilibili-mcp-memory\SKILL.md`

- [ ] **Step 1: Create the Codex skill directory**

Run:

```powershell
New-Item -ItemType Directory -Force C:\Users\ZX\.codex\skills\bilibili-mcp-memory | Out-Null
```

Expected: the directory exists.

- [ ] **Step 2: Create `SKILL.md` for Codex**

Create `C:\Users\ZX\.codex\skills\bilibili-mcp-memory\SKILL.md` with this content:

```markdown
---
name: bilibili-mcp-memory
description: Use when working in `C:\Users\ZX\bilibili-mcp` and the user asks to review, update, capture, or use project memory; record decisions, lessons learned, handoffs, verification results, or stable project facts; or prepare Codex-to-Claude handoffs that should consult repository-local memory.
---

# Bilibili MCP Project Memory

Use this skill for repository-local memory work in `C:\Users\ZX\bilibili-mcp`.

## Memory Location

Read and update:

- `docs/agent-memory/README.md`
- `docs/agent-memory/project-facts.md`
- `docs/agent-memory/decisions.md`
- `docs/agent-memory/lessons-learned.md`
- `docs/agent-memory/handoff-log.md`
- `docs/agent-memory/verification-log.md`

## Workflow

1. Inspect the relevant memory files before changing them.
2. Decide which memory file matches the requested capture.
3. Add only durable, verified, project-specific information.
4. Use dated entries.
5. Keep entries concise.
6. Do not store secrets, full Cookie values, `.env` content, npm tokens, GitHub tokens, or unverified guesses.
7. Report which memory files changed and why.

## File Selection

- Use `project-facts.md` for stable facts that are currently true.
- Use `decisions.md` for durable choices and reasons.
- Use `lessons-learned.md` for corrections, mistakes, and repeated pitfalls.
- Use `handoff-log.md` for Codex-to-Claude handoffs and Claude-to-Codex reports.
- Use `verification-log.md` for important command results and caveats.

## Constraints

- Preserve the user's manual orchestration model: Codex plans and reviews; Claude Code executes bounded tasks.
- Do not enable ECC-style hooks in this phase.
- Do not modify Claude Code hook settings unless the user explicitly approves a later hook upgrade.
```

- [ ] **Step 3: Verify Codex skill frontmatter**

Run:

```powershell
Get-Content -TotalCount 8 C:\Users\ZX\.codex\skills\bilibili-mcp-memory\SKILL.md
```

Expected: output starts with YAML frontmatter containing `name: bilibili-mcp-memory` and a `description`.

---

### Task 4: Create The Claude Code Memory Skill

**Files:**
- Create: `C:\Users\ZX\.claude\skills\bilibili-mcp-memory\SKILL.md`

- [ ] **Step 1: Create the Claude Code skill directory**

Run:

```powershell
New-Item -ItemType Directory -Force C:\Users\ZX\.claude\skills\bilibili-mcp-memory | Out-Null
```

Expected: the directory exists.

- [ ] **Step 2: Copy the Codex skill to Claude Code**

Run:

```powershell
Copy-Item -LiteralPath C:\Users\ZX\.codex\skills\bilibili-mcp-memory\SKILL.md -Destination C:\Users\ZX\.claude\skills\bilibili-mcp-memory\SKILL.md -Force
```

Expected: `C:\Users\ZX\.claude\skills\bilibili-mcp-memory\SKILL.md` exists and matches the Codex copy.

- [ ] **Step 3: Verify both skill copies exist**

Run:

```powershell
foreach ($path in "C:\Users\ZX\.codex\skills\bilibili-mcp-memory\SKILL.md", "C:\Users\ZX\.claude\skills\bilibili-mcp-memory\SKILL.md") {
  [pscustomobject]@{ Path = $path; Exists = Test-Path $path }
}
```

Expected: both rows show `Exists` as `True`.

---

### Task 5: Verify Hook Boundary And Memory Safety

**Files:**
- Inspect: `.claude/settings.local.json`
- Inspect: `C:\Users\ZX\.claude\settings.json`
- Inspect: `docs/agent-memory/*.md`
- Inspect: `AGENTS.md`
- Inspect: `CLAUDE.md`

- [ ] **Step 1: Verify project settings were not changed for hooks**

Run:

```powershell
git diff -- .claude/settings.local.json
```

Expected: no diff, because this phase must not modify project Claude hook settings.

- [ ] **Step 2: Verify global Claude settings were not modified by this plan**

Run:

```powershell
if (Test-Path C:\Users\ZX\.claude\settings.json) {
  Get-Item C:\Users\ZX\.claude\settings.json | Select-Object FullName,LastWriteTime,Length
}
```

Expected: file metadata is displayed for inspection only. Do not edit this file in this phase.

- [ ] **Step 3: Scan memory files for forbidden secret labels**

Run:

```powershell
Select-String -Path docs\agent-memory\*.md -Pattern "SESSDATA=|bili_jct=|DedeUserID=|Cookie:|npm_" -CaseSensitive
```

Expected: no matches.

- [ ] **Step 4: Verify no automatic hooks were added to memory instructions**

Run:

```powershell
Select-String -Path AGENTS.md,CLAUDE.md,docs\agent-memory\*.md -Pattern "SessionStart|PreToolUse|PostToolUse|PreCompact|Stop"
```

Expected: matches only describe deferred hook upgrade or say hooks are not enabled in the first phase.

---

### Task 6: Final Verification And Report

**Files:**
- Inspect: all changed files
- Verify: `git status --short`

- [ ] **Step 1: Check worktree status**

Run:

```powershell
git status --short
```

Expected: changes include the new memory docs, updated `AGENTS.md` and `CLAUDE.md`, existing intentional Smithery deletes, and existing docs work. Review scope before staging or committing.

- [ ] **Step 2: Verify memory system files**

Run:

```powershell
$required = @(
  "docs\agent-memory\README.md",
  "docs\agent-memory\project-facts.md",
  "docs\agent-memory\decisions.md",
  "docs\agent-memory\lessons-learned.md",
  "docs\agent-memory\handoff-log.md",
  "docs\agent-memory\verification-log.md",
  "C:\Users\ZX\.codex\skills\bilibili-mcp-memory\SKILL.md",
  "C:\Users\ZX\.claude\skills\bilibili-mcp-memory\SKILL.md"
)
foreach ($path in $required) {
  [pscustomobject]@{ Path = $path; Exists = Test-Path $path }
}
```

Expected: all rows show `Exists` as `True`.

- [ ] **Step 3: Run Markdown and text sanity checks**

Run:

```powershell
$pattern = ("TO" + "DO|T" + "BD|place" + "holder")
Select-String -Path docs\agent-memory\*.md,AGENTS.md,CLAUDE.md -Pattern $pattern -CaseSensitive
```

Expected: no matches.

- [ ] **Step 4: Report results**

Return a concise report with:

```markdown
## Files changed
- ...

## Skills created
- `C:\Users\ZX\.codex\skills\bilibili-mcp-memory`
- `C:\Users\ZX\.claude\skills\bilibili-mcp-memory`

## Verification
- ...

## Not changed
- No ECC hooks enabled.
- No Claude Code settings hook changes made.
- No secrets stored in memory files.
```

- [ ] **Step 5: Commit only if requested**

Do not commit automatically. If the user requests a commit, inspect `git diff` first and stage only files in scope:

```powershell
git add AGENTS.md CLAUDE.md docs\agent-memory docs\superpowers\specs\2026-05-27-agent-memory-learning-system-design.md docs\superpowers\plans\2026-05-27-agent-memory-learning-system.md
git commit -m "docs: add agent memory system plan"
```

Expected: one focused commit for the memory system documentation and planning files. Do not stage unrelated files without user approval.

---

## Self-Review

- Spec coverage: covers repository memory files, AGENTS/CLAUDE integration, Codex and Claude Code memory skills, no-hook boundary, data safety, and verification.
- Completion marker scan: no open work markers remain outside checklist syntax.
- Type consistency: all paths match the confirmed Windows workspace and skill directories.
- Scope check: this plan implements the first phase only and does not enable ECC hooks.
