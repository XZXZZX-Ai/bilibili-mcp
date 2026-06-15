# Task 1 Package Dependency Health Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the package dependency health baseline by synchronizing `package-lock.json` with `package.json` version `1.4.6` and updating `esbuild` past the current audited vulnerable range.

**Architecture:** Keep this phase as a package-only maintenance change. Do not change TypeScript source, tests, MCP tool contracts, credential behavior, README content, release workflow semantics, or encoding-corrupted metadata during this task unless a verification command proves the package health fix requires it.

**Tech Stack:** npm, Node.js, TypeScript ESM package metadata, Vitest, npm audit, npm pack, project `package-maintainer` and `release-verifier` subagents.

---

## Scope

Task 1 is only about package and dependency health.

Expected direct edits:

- `package.json`: update the direct `esbuild` dev dependency range from `^0.28.0` to a safe compatible range.
- `package-lock.json`: refresh the root package version from `1.4.5` to `1.4.6` and resolve `esbuild` / optional `@esbuild/*` packages to a safe version.

Expected inspections:

- `.github/workflows/publish.yml`: verify the change does not require release workflow edits.
- `.npmignore`: verify package dry-run output is still clean.

Out of scope:

- Do not fix mojibake in `package.json`, `.npmignore`, or `.github/workflows/publish.yml`; that belongs to the encoding cleanup task.
- Do not change `main`, `module`, `types`, `bin`, `files`, `publishConfig`, repository metadata, or release scripts unless verification proves they are broken by this dependency update.
- Do not change `src/`, `tests/`, README files, or MCP schemas.
- Do not publish, tag, push, or create a GitHub release.

## Capability Use

- Claude Code implementation should use the project `package-maintainer` subagent because the task touches `package.json`, `package-lock.json`, npm audit, and `npm pack --dry-run`.
- Codex review should use or explicitly name `release-verifier` before accepting the result because package contents and release readiness are affected.
- Use `secret-scanning` style checks before any commit or publish-oriented report because package and workflow files are in scope.
- Use local CLI commands for package facts: `node`, `npm`, `rg`, `git`.

---

### Task 1: Refresh Package Dependency Health

**Files:**

- Modify: `package.json`
- Modify: `package-lock.json`
- Inspect: `.github/workflows/publish.yml`
- Inspect: `.npmignore`

- [x] **Step 1: Confirm the starting package state**

Run:

```bash
git status --short
node -e "const p=require('./package.json'); const l=require('./package-lock.json'); console.log(JSON.stringify({package:p.version, lock:l.version, root:l.packages[''].version, esbuild:p.devDependencies.esbuild}, null, 2))"
npm audit --json
```

Expected current state:

```json
{
  "package": "1.4.6",
  "lock": "1.4.5",
  "root": "1.4.5",
  "esbuild": "^0.28.0"
}
```

Expected audit state before the fix:

```text
npm audit exits non-zero with one high severity direct dev dependency finding for esbuild in the range >=0.17.0 <0.28.1.
```

If `git status --short` shows unrelated dirty files, preserve them. Do not stage, revert, or modify unrelated files.

- [x] **Step 2: Refresh only the vulnerable dependency and lockfile**

Run:

```bash
npm install --save-dev esbuild@^0.28.1
```

Expected direct result:

```text
package.json keeps the existing dependency set and changes only the esbuild devDependency range as needed.
package-lock.json root package version becomes 1.4.6.
package-lock.json resolves esbuild and the optional @esbuild/* packages to 0.28.1 or newer.
```

Do not run `npm update` for unrelated dependencies. Do not manually edit the generated `integrity` or `resolved` fields in `package-lock.json`.

- [x] **Step 3: Confirm the package metadata after install**

Run:

```bash
node -e "const p=require('./package.json'); const l=require('./package-lock.json'); const esbuild=l.packages['node_modules/esbuild']; console.log(JSON.stringify({package:p.version, lock:l.version, root:l.packages[''].version, packageEsbuild:p.devDependencies.esbuild, lockEsbuild:esbuild && esbuild.version}, null, 2))"
```

Expected state:

```json
{
  "package": "1.4.6",
  "lock": "1.4.6",
  "root": "1.4.6",
  "packageEsbuild": "^0.28.1",
  "lockEsbuild": "0.28.1"
}
```

If npm resolves a later compatible `0.28.x` version, accept it only if `npm audit --json` in Step 4 reports no high or critical vulnerabilities.

- [x] **Step 4: Verify audit, tests, build, and package dry-run**

Run:

```bash
npm audit --json
npm test
npm run build
npm pack --dry-run
```

Expected:

```text
npm audit exits zero or reports zero high and zero critical vulnerabilities.
npm test passes all current Vitest files.
npm run build passes.
npm pack --dry-run creates an @xzxzzx/bilibili-mcp package preview for version 1.4.6.
The package preview includes dist, README.md, README_EN.md, LICENSE, and package.json.
The package preview does not include src, tests, docs/agent-memory, .claude, .codex, .env, or Git metadata.
```

If `npm audit --json` still reports high or critical vulnerabilities after `esbuild` is updated, stop and report the exact package name, version range, and `fixAvailable` value. Do not broaden the dependency update without review.

- [x] **Step 5: Inspect release workflow and package ignore boundary**

Run:

```bash
rg -n "smithery|Smithery|NPM_TOKEN|NODE_AUTH_TOKEN|npm_[A-Za-z0-9]|ghp_[A-Za-z0-9]|SESSDATA=|bili_jct=|DedeUserID=" package.json package-lock.json .github/workflows .npmignore
git diff -- package.json package-lock.json
```

Expected:

```text
No real npm token, GitHub token, Bilibili Cookie, SESSDATA, bili_jct, or DedeUserID value appears.
No Smithery runtime configuration is restored.
The diff is limited to package-lock root version synchronization and esbuild-related package resolution changes.
```

If `rg` matches only generic variable names such as `NPM_TOKEN` or `NODE_AUTH_TOKEN`, report them as non-secret names, not leaked values.

- [x] **Step 6: Record verification if Task 1 completes**

If Step 4 and Step 5 pass, append a dated entry to `docs/agent-memory/verification-log.md`:

```markdown
## 2026-06-14 Task 1 Package Dependency Health

- Commands: `npm audit --json`; `npm test`; `npm run build`; `npm pack --dry-run`; package/workflow secret scan with `rg`.
- Result: `package-lock.json` root version matches `package.json` version `1.4.6`, `esbuild` is outside the audited vulnerable range, tests/build/package dry-run pass, and no package-surface secret leak was found.
- Caveat: No npm publish, tag, push, or GitHub release was performed.
```

Do not write to `docs/agent-memory/decisions.md` or `docs/agent-memory/lessons-learned.md` unless this task discovers a new durable decision or repeated pitfall.

- [ ] **Step 7: Prepare commit only after explicit user approval**

If the user asks for a local commit, use the configured `git-local-commit` skill and stage only the Task 1 files:

```bash
git add package.json package-lock.json docs/agent-memory/verification-log.md
git commit -m "chore: refresh package dependency health"
```

If the user has not asked for a commit, stop after reporting the changed files, verification commands, and remaining dirty worktree state.

---

## Acceptance Criteria

- `package.json` and `package-lock.json` both represent package version `1.4.6`.
- `esbuild` resolves to `0.28.1` or newer within the compatible `0.28.x` range, and `npm audit --json` has no high or critical vulnerability remaining from `esbuild`.
- `npm test` passes.
- `npm run build` passes.
- `npm pack --dry-run` passes and package contents remain clean.
- No Smithery runtime config is restored.
- No token, Cookie, or credential value is introduced.
- No source, test, MCP schema, README, release workflow, or encoding cleanup changes are mixed into this task.

## Rollback Point

If this task breaks audit, tests, build, package dry-run, or package contents, revert only the Task 1 files:

```bash
git restore -- package.json package-lock.json docs/agent-memory/verification-log.md
```

Use the restore command only if those files contain no unrelated user changes. If unrelated user changes are present in any of those files, stop and report the conflicting paths instead of restoring.

## Self-Review

- Spec coverage: This plan covers the Task 1 roadmap items: lockfile version mismatch, `esbuild` audit finding, package dry-run, release workflow boundary inspection, package secret scan, and verification memory.
- Placeholder scan: No open-ended placeholder steps remain; every step has concrete commands and expected outcomes.
- Scope control: The plan explicitly excludes encoding cleanup, source refactors, tests refactors, release publication, tags, pushes, and workflow behavior changes.
