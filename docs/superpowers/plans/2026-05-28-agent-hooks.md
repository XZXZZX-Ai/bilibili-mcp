# Agent Hooks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Configure project-local hooks for Claude Code and Codex app.

**Architecture:** Claude Code stores hook registration in `.claude/settings.local.json`; Codex app stores hook registration in `.codex/hooks.json`. Both call shared scripts in `.codex/scripts/` and pass `--agent claude` or `--agent codex` so runtime observations are separated. Codex runtime observations live under `C:\Users\ZX\.codex\memories\bilibili-mcp\` because the project `.codex\` directory is reserved for hook configuration.

**Tech Stack:** Claude Code hooks JSON, Codex app hooks JSON, PowerShell, Python 3, repository-local Markdown memory.

---

### Task 1: Document Hook Design

**Files:**
- Create: `docs/superpowers/specs/2026-05-28-agent-hooks-design.md`
- Create: `docs/superpowers/plans/2026-05-28-agent-hooks.md`

- [x] **Step 1: Write the design document**

Record purpose, scope, hook behavior, safety rules, rollback, and verification.

- [x] **Step 2: Write this implementation plan**

Record exact files and verification commands.

### Task 2: Add Shared Hook Scripts

**Files:**
- Create: `.codex/scripts/session-start.ps1`
- Create: `.codex/scripts/post_tool_use.py`
- Create: `.codex/scripts/pre_compact.py`
- Create: `.codex/scripts/stop_summary.py`
- Create: `.codex/scripts/context_budget.py`
- Create: `.codex/scripts/generate_learning_proposals.py`

- [ ] **Step 1: Create `session-start.ps1`**

The script prints bounded repository context, git status, and memory previews.

Run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\.codex\scripts\session-start.ps1
```

Expected: output includes `bilibili-mcp hook context`, branch, git status, and project memory headings.

- [ ] **Step 2: Create `post_tool_use.py`**

The script reads hook JSON from stdin, redacts sensitive values, and records failed command observations.

Run:

```powershell
'{"tool_name":"Bash","tool_input":{"command":"npm run build"},"tool_response":{"exit_code":1,"stderr":"example failure"}}' | python .\.codex\scripts\post_tool_use.py --agent codex
```

Expected: `C:\Users\ZX\.codex\memories\bilibili-mcp\memory\observations.jsonl` exists and contains a redacted failed build observation.

- [x] **Step 3: Create `pre_compact.py`**

The script writes a checkpoint before context compaction.

Run:

```powershell
'{"event":"PreCompact"}' | python .\.codex\scripts\pre_compact.py --agent codex
```

Expected: `C:\Users\ZX\.codex\memories\bilibili-mcp\runtime\pre-compact-checkpoint.md` exists.

- [ ] **Step 4: Create `stop_summary.py`**

The script writes a lightweight summary from recent observations.

Run:

```powershell
python .\.codex\scripts\stop_summary.py --agent codex
```

Expected: `C:\Users\ZX\.codex\memories\bilibili-mcp\runtime\last-stop-summary.txt` and `C:\Users\ZX\.codex\memories\bilibili-mcp\memory\observation-summary.md` exist.

- [x] **Step 5: Create `context_budget.py`**

The script writes a lightweight context budget report.

Run:

```powershell
python .\.codex\scripts\context_budget.py
```

Expected: `docs/agent-memory/context-budget-report.md` exists.

- [x] **Step 6: Create `generate_learning_proposals.py`**

The script reads Codex and Claude Code candidate observations and writes pending learning proposals.

Run:

```powershell
python .\.codex\scripts\generate_learning_proposals.py --source manual
```

Expected: `docs/agent-memory/pending-learning-proposals.md` exists and says proposals are review-only.

### Task 3: Register Codex App Hooks

**Files:**
- Create: `.codex/hooks.json`

- [ ] **Step 1: Add Codex hook registration**

Register:

- `SessionStart` with matcher `startup|resume`
- `PostToolUse` with matcher `Bash`
- `PreCompact`
- `Stop`

Run:

```powershell
node -e "JSON.parse(require('fs').readFileSync('.codex/hooks.json','utf8')); console.log('codex hooks json ok')"
```

Expected: `codex hooks json ok`.

### Task 4: Register Claude Code Hooks

**Files:**
- Modify: `.claude/settings.local.json`

- [ ] **Step 1: Add Claude hook registration**

Preserve existing `permissions.defaultMode = "bypassPermissions"` and `permissions.allow`.

Register:

- `SessionStart` with matcher `startup|resume`
- `PostToolUse` with matcher `Bash`
- `PreCompact`
- `Stop`

Run:

```powershell
node -e "JSON.parse(require('fs').readFileSync('.claude/settings.local.json','utf8')); console.log('claude settings json ok')"
```

Expected: `claude settings json ok`.

### Task 5: Final Verification

**Files:**
- Inspect: `.codex/hooks.json`
- Inspect: `.claude/settings.local.json`
- Inspect: `C:\Users\ZX\.codex\memories\bilibili-mcp\memory\`
- Inspect: `C:\Users\ZX\.codex\memories\bilibili-mcp\runtime\`

- [ ] **Step 1: Run hook script dry checks**

Run:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\.codex\scripts\session-start.ps1
'{"tool_name":"Bash","tool_input":{"command":"npm run build"},"tool_response":{"exit_code":1,"stderr":"example failure with SESSDATA=secret-value"}}' | python .\.codex\scripts\post_tool_use.py --agent codex
python .\.codex\scripts\stop_summary.py --agent codex
'{"tool_name":"Bash","tool_input":{"command":"npm run build"},"tool_response":{"exit_code":1,"stderr":"example failure with bili_jct=secret-value"}}' | python .\.codex\scripts\post_tool_use.py --agent claude
python .\.codex\scripts\stop_summary.py --agent claude
```

Expected: scripts complete without error, and generated observations contain `[REDACTED]` instead of secret values.

- [ ] **Step 2: Inspect working tree**

Run:

```powershell
git status --short
```

Expected: hook files and docs are visible; unrelated existing Smithery deletions remain untouched.
