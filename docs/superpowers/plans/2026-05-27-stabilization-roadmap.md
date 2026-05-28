# Stabilization Roadmap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `@xzxzzx/bilibili-mcp` safer and easier to publish before any major refactor or feature expansion, while preserving Cookie-based subtitle access.

**Architecture:** This plan preserves the current MCP tool behavior and focuses on project hygiene, publishing correctness, and a minimal test baseline. It avoids splitting `src/bilibili/client.ts` in this first pass so the package remains behaviorally stable before deeper refactoring.

**Tech Stack:** TypeScript, Node.js ESM, MCP SDK, npm, GitHub Actions.

---

## Current Findings

- `npm run build` currently passes.
- `npm pack --dry-run` currently produces a package, but package entry metadata is not aligned with the published `dist` output.
- `get_subtitle.py` contains hard-coded Bilibili cookie values and must be rewritten to read from `.env` or environment variables. Cookie support must stay because authenticated access is required for reliable subtitle retrieval.
- Smithery is no longer part of the project workflow, so `smithery.json` and `smithery.yaml` should be deleted instead of version-aligned.
- Root-level manual scripts are useful for debugging but are not organized as a reliable test suite.
- `src/bilibili/client.ts` is the main future refactor target, but it should not be split until the safety and publishing baseline is clean.

## File Structure For This Phase

- Modify `package.json`: fix package entry points, scripts, and package metadata.
- Delete `smithery.json`: remove unused Smithery runtime metadata.
- Delete `smithery.yaml`: remove unused Smithery runtime metadata.
- Modify `package.json`: remove Smithery-only scripts and dependency if they are no longer used.
- Modify or delete `get_subtitle.py`: remove hard-coded credentials.
- Create `tests/` only if adding a real test runner in this phase.
- Do not modify `src/bilibili/client.ts` behavior in this phase unless a verification failure proves a small fix is required.
- Do not modify `dist/` manually. Rebuild with `npm run build` when needed.

---

### Task 1: Remove Hard-Coded Bilibili Credentials Without Removing Cookie Support

> **Status (2026-05-28):** `get_subtitle.py` is an ignored local debug script (listed in `.gitignore`). Hard-coded Bilibili credentials were removed from the local copy and replaced with `os.environ.get()` calls. Cookie-based subtitle access is preserved. No repository-tracked code diff is expected for this file unless the project later decides to promote it into a maintained script. Old Cookie values should be treated as exposed and rotated/invalidated by the user.

**Files:**
- Modify: `get_subtitle.py` (ignored local debug script, not tracked)
- Inspect: `.gitignore`
- Verify: `git status --short --ignored get_subtitle.py` (expected: `!! get_subtitle.py`)

- [x] **Step 1: Inspect the credential-bearing script**

Run:

```bash
python - <<'PY'
from pathlib import Path
p = Path("get_subtitle.py")
text = p.read_text(encoding="utf-8")
for needle in ["sessdata =", "bili_jct =", "dedeuserid =", "SESSDATA=", "DedeUserID="]:
    print(needle, needle in text)
PY
```

Expected: at least one credential marker is present.

- [x] **Step 2: Replace hard-coded secrets with environment variables**

Rewrite the credential section to this exact pattern so the script still works when valid Cookie values are supplied through environment variables:

```python
import os

sessdata = os.environ.get("BILIBILI_SESSDATA", "")
bili_jct = os.environ.get("BILIBILI_BILI_JCT", "")
dedeuserid = os.environ.get("BILIBILI_DEDEUSERID", "")

if not sessdata or not bili_jct or not dedeuserid:
    raise SystemExit(
        "Missing BILIBILI_SESSDATA, BILIBILI_BILI_JCT, or BILIBILI_DEDEUSERID."
    )
```

Keep the rest of the script if it remains useful as a manual debugging script. Do not remove Cookie-based subtitle access; remove only literal secret values from source code.

- [x] **Step 3: Verify no literal credential remains**

Run:

```bash
python - <<'PY'
from pathlib import Path
text = Path("get_subtitle.py").read_text(encoding="utf-8") if Path("get_subtitle.py").exists() else ""
bad = ["<first-8-hex-of-sessdata>", "<bili-jct-value>", "<dedeuserid-value>"]
found = [item for item in bad if item in text]
print("found:", found)
raise SystemExit(1 if found else 0)
PY
```

Expected: `found: []`.

- [x] **Step 4: Report credential rotation requirement**

Report to the user that the old Bilibili cookie values were present in the repository and should be considered exposed. The user should rotate or invalidate those credentials outside this repository.

- [x] **Step 5: Commit if requested**

Do not commit automatically. The file is git-ignored and should remain local-only. If the project later promotes `get_subtitle.py` into a maintained script, commit it at that time with environment-variable-based credentials.

---

### Task 2: Fix npm Package Entry Points

**Files:**
- Modify: `package.json`
- Verify: `npm run build`
- Verify: `npm pack --dry-run`

- [x] **Step 1: Inspect current package metadata**

Run:

```bash
node -e "const p=require('./package.json'); console.log({main:p.main,module:p.module,types:p.types,bin:p.bin,files:p.files})"
```

Expected before change: `main` points at `src/index.ts`.

- [x] **Step 2: Update entry metadata**

Set these fields in `package.json`:

```json
{
  "main": "dist/index.js",
  "module": "dist/index.js",
  "types": "dist/index.d.ts",
  "bin": {
    "bilibili-mcp": "dist/cli.js"
  }
}
```

Keep `"type": "module"` unchanged.

- [x] **Step 3: Build**

Run:

```bash
npm run build
```

Expected: TypeScript compilation passes.

- [x] **Step 4: Dry-run package**

Run:

```bash
npm pack --dry-run
```

Expected:

- `dist/index.js` is included.
- `dist/index.d.ts` is included.
- `package.json` points to `dist/index.js`.
- No source-only entry point is required for normal package resolution.

- [x] **Step 5: Commit if requested**

```bash
git add package.json
git commit -m "fix: point package entry to dist output"
```

---

### Task 3: Remove Unused Smithery Configuration

**Files:**
- Delete: `smithery.json`
- Delete: `smithery.yaml`
- Modify: `package.json`
- Inspect: `SMITHERY_PUBLISH_GUIDE.md`
- Verify: `npm run build`
- Verify: `npm pack --dry-run`

- [x] **Step 1: Confirm Smithery config files are unused**

Run:

```bash
node -e "const p=require('./package.json'); console.log({dev:p.scripts?.dev, buildSmithery:p.scripts?.['build:smithery'], smithery:p.devDependencies?.['@smithery/cli']})"
```

Expected before cleanup: Smithery scripts or dependency may still exist.

- [x] **Step 2: Delete Smithery runtime config files**

Remove these files:

```bash
git rm smithery.json smithery.yaml
```

Expected: both files are staged for deletion if using git, or absent from the worktree if editing without staging.

- [x] **Step 3: Remove Smithery-only package entries**

If the project is no longer using Smithery, remove these entries from `package.json`:

```json
{
  "scripts": {
    "dev": "smithery dev",
    "build:smithery": "smithery build"
  },
  "devDependencies": {
    "@smithery/cli": "^4.5.0"
  }
}
```

Do not remove `prepublishOnly`, `build`, `start`, `test:env`, or `release`.

- [x] **Step 4: Update lockfile after dependency removal**

Run:

```bash
npm install
```

Expected: `package-lock.json` no longer includes `@smithery/cli` if it was removed from `package.json`.

- [x] **Step 5: Build**

Run:

```bash
npm run build
```

Expected: TypeScript compilation passes.

- [x] **Step 6: Dry-run package**

Run:

```bash
npm pack --dry-run
```

Expected: package contents do not include `smithery.json` or `smithery.yaml`.

- [x] **Step 7: Decide what to do with the guide**

`SMITHERY_PUBLISH_GUIDE.md` is documentation, not runtime config. Keep it only if historical publishing notes are still useful. If the project will never use Smithery again, delete it in a separate documentation cleanup task.

- [x] **Step 8: Commit if requested**

```bash
git add package.json package-lock.json smithery.json smithery.yaml
if [ -f SMITHERY_PUBLISH_GUIDE.md ]; then git add SMITHERY_PUBLISH_GUIDE.md; fi
git commit -m "chore: remove unused smithery configuration"
```

---

### Task 4: Establish A Real Minimal Test Baseline

**Files:**
- Modify: `package.json`
- Create: `tests/bvid.test.ts`
- Create: `tests/validation.test.ts`
- Optional Create: `tests/cache.test.ts`
- Verify: `npm test`

- [x] **Step 1: Choose a lightweight test runner**

Use Node's built-in test runner plus TypeScript execution support, or use a minimal established runner such as `vitest`. Recommended for this project: `vitest`, because it handles TypeScript test files cleanly.

Install only if the user approves dependency changes:

```bash
npm install -D vitest
```

- [x] **Step 2: Update scripts**

Set:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "build": "tsc"
  }
}
```

Preserve existing unrelated scripts such as `prepublishOnly`, `test:env`, and `release`. Do not restore `dev` or `build:smithery` after Smithery removal unless the user explicitly brings Smithery back.

- [x] **Step 3: Add BV utility tests**

Create `tests/bvid.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { containsBVId, extractBVId, isValidBVId, normalizeBVId } from "../src/utils/bvid.js";

describe("bvid utilities", () => {
  it("extracts BV id from a plain BV id", () => {
    expect(extractBVId("BV1T6PQzQErF")).toBe("BV1T6PQzQErF");
  });

  it("extracts BV id from a Bilibili URL", () => {
    expect(extractBVId("https://www.bilibili.com/video/BV1T6PQzQErF/")).toBe("BV1T6PQzQErF");
  });

  it("rejects invalid input", () => {
    expect(() => extractBVId("not-a-video")).toThrow("Invalid Bilibili video ID or URL");
  });

  it("validates BV id format", () => {
    expect(isValidBVId("BV1T6PQzQErF")).toBe(true);
    expect(isValidBVId("BV123")).toBe(false);
  });

  it("normalizes extracted BV ids", () => {
    expect(normalizeBVId(" https://www.bilibili.com/video/BV1T6PQzQErF/ ")).toBe("BV1T6PQZQERF");
  });

  it("detects BV ids inside text", () => {
    expect(containsBVId("watch BV1T6PQzQErF now")).toBe(true);
    expect(containsBVId("watch av123 now")).toBe(false);
  });
});
```

- [x] **Step 4: Add validation tests**

Create `tests/validation.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { validateBVInput, validateDetailLevel, validateLanguage } from "../src/utils/validation.js";

describe("input validation", () => {
  it("accepts BV input and Bilibili URLs", () => {
    expect(() => validateBVInput("BV1T6PQzQErF")).not.toThrow();
    expect(() => validateBVInput("https://www.bilibili.com/video/BV1T6PQzQErF/")).not.toThrow();
  });

  it("rejects unrelated input", () => {
    expect(() => validateBVInput("hello")).toThrow("Input must contain BV ID or Bilibili URL");
  });

  it("validates language code format", () => {
    expect(() => validateLanguage("zh-Hans")).not.toThrow();
    expect(() => validateLanguage("en")).not.toThrow();
    expect(() => validateLanguage("中文")).toThrow("Invalid language code format");
  });

  it("validates comment detail level", () => {
    expect(() => validateDetailLevel("brief")).not.toThrow();
    expect(() => validateDetailLevel("detailed")).not.toThrow();
    expect(() => validateDetailLevel("full")).toThrow('Invalid detail level: must be "brief" or "detailed"');
  });
});
```

- [x] **Step 5: Run tests**

Run:

```bash
npm test
```

Expected: all tests pass.

- [x] **Step 6: Run build**

Run:

```bash
npm run build
```

Expected: TypeScript compilation passes.

- [x] **Step 7: Commit if requested**

```bash
git add package.json package-lock.json tests/bvid.test.ts tests/validation.test.ts
git commit -m "test: add minimal utility test baseline"
```

---

### Task 5: Clean Publish Package Contents

**Files:**
- Modify: `.npmignore` if needed
- Inspect: `dist/`
- Verify: `npm pack --dry-run`

- [x] **Step 1: Inspect package contents**

Run:

```bash
npm pack --dry-run
```

Expected: review whether debug files such as `dist/debug_subtitle2.mjs` are included.

- [x] **Step 2: Remove accidental debug artifacts from publish output**

If debug artifacts are generated or already present in `dist/`, decide whether they are:

- source-controlled release artifacts that should be removed from the repository, or
- ignored publish artifacts that should be excluded through `.npmignore`.

Do not manually edit `dist/` unless the task explicitly includes release artifact cleanup.

- [x] **Step 3: Add publish exclusions if needed**

If `dist/debug_subtitle2.mjs` should not publish, add an exclusion to `.npmignore`:

```gitignore
dist/debug_*
```

Also exclude local outputs if they are not already excluded:

```gitignore
error*.log
subtitle_data.json
transcript_output.json
sub_BV*.txt
```

- [x] **Step 4: Verify package contents again**

Run:

```bash
npm pack --dry-run
```

Expected: debug artifacts and local output files are not included in the package.

- [x] **Step 5: Commit if requested**

```bash
git add .npmignore
git commit -m "chore: exclude debug artifacts from npm package"
```

---

### Task 6: Final Baseline Verification

> **Status (2026-05-28):** All checks passed. `npm run build` ✅, `npm test` (45 tests) ✅, `npm pack --dry-run` (74 files, clean) ✅. Smithery fully removed. No hard-coded credentials detected. Package entry points target `dist`. Stabilization baseline is complete.

**Files:**
- Inspect: changed files only
- Verify: `git status --short`
- Verify: `npm run build`
- Verify: `npm test`
- Verify: `npm pack --dry-run`

- [x] **Step 1: Check worktree**

Run:

```bash
git status --short
```

Expected: only intentional files are modified.

- [x] **Step 2: Run build**

Run:

```bash
npm run build
```

Expected: TypeScript compilation passes.

- [x] **Step 3: Run tests**

Run:

```bash
npm test
```

Expected: test suite passes. If no test runner was added because dependency changes were not approved, state that clearly.

- [x] **Step 4: Run package dry-run**

Run:

```bash
npm pack --dry-run
```

Expected:

- package entry points target `dist`
- package includes built JS and declarations
- package excludes obvious local debug artifacts
- no credentials are included

- [x] **Step 5: Return implementation report**

Report:

- files changed
- commands run
- command results
- whether credentials were removed
- whether unused Smithery config files and scripts are removed
- whether package entry points are fixed
- any skipped checks or unresolved risks

---

## Later Roadmap After This Plan

Do not start these until the stabilization baseline above is complete and verified.

### Phase 2: Split `src/bilibili/client.ts`

Target file split:

- `src/bilibili/http.ts`: timeout, rate limiting, retry, response parsing.
- `src/bilibili/wbi.ts`: WBI key retrieval, mix key, signature generation.
- `src/bilibili/fingerprint.ts`: buvid fetching and cache.
- `src/bilibili/video-api.ts`: video info and subtitle API calls.
- `src/bilibili/comments-api.ts`: comment API calls and fallback.
- `src/bilibili/client.ts`: compatibility exports only.

Acceptance criteria:

- current public imports keep working
- `npm run build` passes
- utility and API tests cover key fallback behavior
- no MCP response shape changes

### Phase 3: Improve MCP Tool Surface

Candidate tools:

- `get_video_transcript`: returns clean subtitle text only.
- `get_video_metadata`: returns title, author, duration, publication time, tags, and stats.
- `get_video_comments`: adds explicit `limit`, `sort`, and `include_replies` options.

Acceptance criteria:

- existing `get_video_info` and `get_video_comments` remain backward compatible
- new tools have stable schemas
- docs and npm package metadata match implementation

### Phase 4: Documentation And Release Polish

Targets:

- update README install and credential sections
- document no-cookie vs cookie behavior
- document expected error codes
- align changelog with release version
- verify GitHub Actions publish flow

---

## Self-Review

- Spec coverage: covers security, publishing, version alignment, minimal tests, package contents, and final verification.
- Placeholder scan: no deferred placeholders are used as implementation steps.
- Type consistency: test examples import current TypeScript source modules and keep existing function names.
- Scope check: Phase 1 is intentionally limited to stabilization; deeper `client.ts` refactor is listed as later roadmap.
