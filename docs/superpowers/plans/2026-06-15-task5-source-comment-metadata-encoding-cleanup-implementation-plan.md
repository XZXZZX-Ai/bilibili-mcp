# Task 5 Source Comment And Metadata Encoding Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clean only confirmed mojibake in source comments and package metadata while preserving runtime behavior, public MCP contracts, credential safety, and existing valid UTF-8 Chinese text.

**Architecture:** Treat encoding cleanup as a verification-first, behavior-neutral documentation pass. Use UTF-8 file reads, not terminal display, to identify real corruption; edit only comments or package metadata strings that are confirmed corrupted; then verify with tests, build, and diff review.

**Tech Stack:** TypeScript ESM, Node16 module resolution, npm package metadata, Vitest, Windows PowerShell, Python UTF-8 readers.

---

## Scope

Task 5 is only about source comment and metadata encoding cleanup.

Expected direct edits only if real mojibake is confirmed:

- `src/config.ts`: comments only.
- `src/utils/cache.ts`: comments only.
- `src/utils/logger.ts`: comments only.
- `src/bilibili/*.ts`: comments only, selected files only.
- `src/server/tool-schemas.ts`: user-facing MCP descriptions only if confirmed corrupted.
- `package.json`: `description` or `keywords` only if confirmed corrupted.
- `docs/agent-memory/verification-log.md`: append verification after successful completion.

Out of scope:

- Do not change runtime logic.
- Do not change exported types, function signatures, imports, cache keys, error codes, response JSON shapes, MCP tool names, or MCP tool order.
- Do not change README, README_EN, changelogs, package-lock, workflow files, credential logic, logging logic, or tests unless a test fixture contains confirmed mojibake directly related to this task.
- Do not "improve" valid Chinese wording.
- Do not translate all Chinese comments to English.
- Do not trust PowerShell mojibake-looking terminal output as proof of file corruption.
- Do not commit unless the user explicitly asks.

## Current Observations

UTF-8 Python inspection on 2026-06-15 showed several files that PowerShell displays as mojibake are actually clean UTF-8 in-file, for example:

- `src/config.ts`
- `src/utils/cache.ts`
- `src/utils/logger.ts`
- `src/bilibili/comments.ts`
- `src/bilibili/types.ts`
- `src/bilibili/metadata.ts`
- `src/bilibili/video-api.ts`
- `src/bilibili/http.ts`
- `src/bilibili/comments-api.ts`

Therefore Task 5 may become a "verify no source cleanup needed" task. That is acceptable if the UTF-8 scanner and diff review prove no real corrupted text remains in the scoped files.

## Capability Use

- Use normal scoped editing plus `risk-reviewer` perspective after implementation because this task is easy to over-edit.
- Use local CLI commands for source facts and verification: `python`, `rg`, `git diff`, `npm test`, `npm run build`.
- Use `bilibili-mcp-memory` only for final verification log or a newly discovered durable lesson.

---

### Task 1: Preflight Worktree And Encoding Baseline

**Files:**

- Inspect: `git status --short`
- Inspect: `src/**/*.ts`
- Inspect: `package.json`

- [x] **Step 1: Check current worktree state**

Run:

```bash
git status --short
```

Expected:

```text
Task 3, Task 4, active-plan tracker, and unrelated files may still be dirty.
Do not stage, commit, revert, or clean them during Task 5 planning/execution.
```

If Task 3/4 commits are still pending, report that Task 5 should not be committed together with those changes. Continue only with inspection or a separate Task 5 branch/commit boundary if the user explicitly wants to proceed.

- [x] **Step 2: Run a UTF-8 corruption scanner**

Run this Windows-safe scanner from the repository root:

```powershell
@'
from pathlib import Path

MOJIBAKE_MARKERS = [
    "\ufffd",
    "Ã", "Â", "â€", "â€™", "â€œ", "â€�",
    "鈥", "銆", "锛", "锟",
    "閰", "鐨", "璇", "鍥", "鐢", "浠", "绋",
    "涓", "鍏", "鏃", "鏍", "鐩", "褰", "鍦",
    "妯", "瀹", "堕", "湁", "藉", "鍙", "鍚",
]

SKIP_DIRS = {"node_modules", "dist", ".git", ".claude", ".codex"}
TARGETS = [Path("src"), Path("package.json")]

def is_skipped(path: Path) -> bool:
    return any(part in SKIP_DIRS for part in path.parts)

paths: list[Path] = []
for target in TARGETS:
    if target.is_file():
        paths.append(target)
    elif target.is_dir():
        paths.extend(sorted(target.rglob("*")))

for path in paths:
    if is_skipped(path) or path.suffix not in {".ts", ".json"}:
        continue
    text = path.read_text(encoding="utf-8", errors="replace")
    hits = []
    for line_number, line in enumerate(text.splitlines(), start=1):
        if any(marker in line for marker in MOJIBAKE_MARKERS):
            hits.append((line_number, line))
    if hits:
        print(f"## {path}")
        for line_number, line in hits[:30]:
            print(f"{line_number}: {line}")
        if len(hits) > 30:
            print(f"... {len(hits) - 30} more")
'@ | python -
```

Expected:

```text
Either no hits, or a small list of candidate lines.
Candidate lines are not automatically defects; they must be manually inspected as UTF-8 before editing.
```

- [x] **Step 3: Check package metadata**

Run:

```bash
node -e "const p=require('./package.json'); console.log(JSON.stringify({description:p.description,keywords:p.keywords},null,2))"
```

Expected current clean output:

```json
{
  "description": "Bilibili MCP tool for video metadata, transcripts, subtitles, and comment summarization",
  "keywords": [
    "mcp",
    "model-context-protocol",
    "bilibili",
    "video",
    "comments",
    "subtitle",
    "transcript",
    "metadata",
    "chinese",
    "b站",
    "视频总结",
    "评论总结"
  ]
}
```

If output already matches this shape and contains no mojibake, do not edit `package.json`.

---

### Task 2: Confirm Candidates Before Editing

**Files:**

- Inspect: files reported by Task 1 scanner.
- Do not edit yet.

- [x] **Step 1: Print candidate lines with `repr`**

For each candidate file from Task 1, run this command after replacing `src/config.ts` with the candidate path:

```powershell
@'
from pathlib import Path

path = Path("src/config.ts")
for line_number, line in enumerate(path.read_text(encoding="utf-8", errors="replace").splitlines(), start=1):
    if line_number <= 120:
        print(f"{line_number}: {line!r}")
'@ | python -
```

Expected:

```text
The real file content is visible as Python string repr.
If the line is clean Chinese or English, do not edit it.
Only edit lines that still contain confirmed mojibake in UTF-8 repr output.
```

- [x] **Step 2: Classify candidates**

Prepare this short classification in the execution report:

```markdown
## Encoding Candidate Classification

- `path:line`: clean UTF-8, no edit.
- `path:line`: confirmed mojibake in comment, edit.
- `path:line`: confirmed mojibake in user-facing string, edit only if it is in Task 5 scope.
- `path:line`: uncertain, stop and ask Codex/user before editing.
```

If all candidates are clean UTF-8, skip Tasks 3 and 4 and proceed to Task 5 verification/memory record.

---

### Task 3: Clean Confirmed Source Comments Only

**Files:**

- Modify only files with confirmed mojibake comments.

- [x] **Step 1: Replace confirmed corrupted file headers**

If a file header comment is confirmed corrupted, replace only that comment block. Use short English if exact original Chinese meaning is uncertain.

Examples:

```ts
/**
 * Centralized runtime configuration.
 */
```

```ts
/**
 * Cache manager for video information and comment data.
 */
```

```ts
/**
 * Unified logger with secret redaction.
 */
```

Do not change imports, exports, type definitions, or runtime statements in this step.

- [x] **Step 2: Replace confirmed corrupted inline comments**

For confirmed corrupted inline comments, prefer direct, minimal replacements. Examples:

```ts
// Request rate limit configuration
```

```ts
// WBI cache configuration
```

```ts
// Load optional config from environment variables
```

```ts
// Keep logs on stderr so stdout remains valid MCP protocol output.
```

Do not edit comments that are already clean UTF-8 Chinese.

- [x] **Step 3: Verify source-only comment diff**

Run:

```bash
git diff -- src
```

Expected:

```text
Diff contains only comment changes in the selected source files.
No executable code, imports, type declarations, object literals, schema values, or string values changed unless Task 4 identified a confirmed user-facing mojibake string.
```

If a runtime line changed accidentally, stop and revert only that accidental edit manually before continuing.

---

### Task 4: Clean Confirmed Metadata Strings Only If Needed

**Files:**

- Modify only if confirmed corrupted: `package.json`
- Do not modify: `package-lock.json` unless npm changes it unexpectedly; avoid running npm install.

- [x] **Step 1: Decide whether `package.json` needs editing**

Use the output from Task 1 Step 3.

If `description` and `keywords` are already clean, record:

```text
package.json metadata is already clean; no package metadata edit needed.
```

If a metadata string is confirmed corrupted, replace only that string. Use this known-good metadata if needed:

```json
{
  "description": "Bilibili MCP tool for video metadata, transcripts, subtitles, and comment summarization",
  "keywords": [
    "mcp",
    "model-context-protocol",
    "bilibili",
    "video",
    "comments",
    "subtitle",
    "transcript",
    "metadata",
    "chinese",
    "b站",
    "视频总结",
    "评论总结"
  ]
}
```

- [x] **Step 2: Verify metadata diff**

Run:

```bash
git diff -- package.json package-lock.json
```

Expected:

```text
Either no diff, or only package.json description/keywords string cleanup.
package-lock.json should not change.
```

---

### Task 5: Full Behavior-Neutral Verification And Memory Record

**Files:**

- Modify if completed: `docs/agent-memory/verification-log.md`
- Inspect: `src/`
- Inspect: `package.json`

- [x] **Step 1: Run build and tests**

Run:

```bash
npm run build
npm test
```

Expected:

```text
TypeScript build passes.
Full Vitest suite passes.
```

- [x] **Step 2: Run final encoding and scope checks**

Run:

```bash
node -e "const p=require('./package.json'); console.log(JSON.stringify({description:p.description,keywords:p.keywords},null,2))"
git diff -- src package.json package-lock.json docs/agent-memory/verification-log.md
git status --short
```

Expected:

```text
Package metadata is clean.
Diff is behavior-neutral: comments and confirmed metadata strings only, plus verification-log append.
Existing unrelated dirty files remain unstaged and untouched.
```

- [x] **Step 3: Record Task 5 verification**

If Step 1 and Step 2 pass, append one of these entries to `docs/agent-memory/verification-log.md`.

If real cleanup was needed:

```markdown
## 2026-06-15 Task 5 Source Comment And Metadata Encoding Cleanup

- Commands: UTF-8 source/metadata scan with Python; `node -e` package metadata check; `npm run build`; `npm test`; behavior-neutral diff review.
- Result: Confirmed mojibake in scoped source comments or package metadata was cleaned without changing runtime logic, MCP tool contracts, credential loading, logging behavior, cache behavior, package dependencies, or release configuration.
- Caveat: PowerShell terminal mojibake was not treated as file corruption; only UTF-8-confirmed corrupted text was edited.
```

If no real cleanup was needed:

```markdown
## 2026-06-15 Task 5 Source Comment And Metadata Encoding Cleanup

- Commands: UTF-8 source/metadata scan with Python; `node -e` package metadata check; `npm run build`; `npm test`; behavior-neutral diff review.
- Result: Scoped source comments and package metadata were verified as clean UTF-8 or already acceptable; no source or package metadata cleanup was required.
- Caveat: PowerShell terminal mojibake was not treated as file corruption; only UTF-8 file reads were used for encoding judgment.
```

Do not update `docs/agent-memory/decisions.md` or `docs/agent-memory/lessons-learned.md` unless a new durable lesson is discovered.

---

## Acceptance Criteria

- Confirmed mojibake is identified using UTF-8 file reads, not terminal rendering.
- Clean UTF-8 Chinese comments are preserved.
- If source edits are made, they are comment-only unless a confirmed package metadata string is corrupted.
- `package.json` is unchanged if its metadata is already clean.
- `package-lock.json` is unchanged.
- `npm run build` passes.
- `npm test` passes.
- No MCP tool names, schemas, response shapes, cache keys, credential behavior, logging behavior, imports, exports, or runtime logic are changed.
- `docs/agent-memory/verification-log.md` records whether cleanup was performed or skipped as unnecessary.

## Rollback Point

If this task accidentally changes runtime logic or breaks tests/build, revert only Task 5 files:

```bash
git restore -- src/config.ts src/utils/cache.ts src/utils/logger.ts src/bilibili package.json package-lock.json docs/agent-memory/verification-log.md
```

Use the restore command only if those files contain no unrelated user changes. If unrelated user changes are present, stop and report the conflicting paths instead of restoring.

## Commit Boundary

If the user asks for a local commit after successful verification, use the configured `git-local-commit` skill and stage only Task 5 files that actually changed.

If source or package metadata changed:

```bash
git add src/config.ts src/utils/cache.ts src/utils/logger.ts src/bilibili package.json docs/agent-memory/verification-log.md
git commit -m "docs: clean source encoding"
```

If no source/package cleanup was required and only verification memory changed:

```bash
git add docs/agent-memory/verification-log.md
git commit -m "docs: record source encoding verification"
```

If the user has not asked for a commit, stop after reporting changed files, verification commands, skipped checks, and remaining dirty worktree state.

## Self-Review

- Spec coverage: This plan covers source comment cleanup, package metadata inspection, UTF-8-first validation, build/test verification, diff scope review, verification memory, and rollback boundaries.
- Placeholder scan: The plan contains exact files, commands, expected outputs, example replacements, and decision branches for cleanup-needed vs no-cleanup-needed.
- Scope control: The plan explicitly excludes runtime changes, MCP contract changes, credential/logging behavior changes, package dependency changes, broad README edits, and commits without user approval.
