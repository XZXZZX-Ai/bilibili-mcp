# Claude Code Goal Prompts: Credential Guidance MCP Tools

Use this file with:

- Plan: `docs/superpowers/plans/2026-06-05-credential-guidance-mcp-tools-implementation-plan.md`
- Repository: `C:\Users\ZX\bilibili-mcp`
- Execution model requested by user: Claude Code with DeepSeek V4

Do not write the model choice into repository config, scripts, package metadata, README, or source files. It is only the user-selected execution environment.

---

## Prompt 0: Start Goal Mode

Paste this into Claude Code first:

```text
Use goal mode for this task.

Goal:
Implement the credential guidance MCP tools described in:
docs/superpowers/plans/2026-06-05-credential-guidance-mcp-tools-implementation-plan.md

Read the full plan before editing. Then execute all tasks end to end in this same goal run:
1. Add safe credential guidance helpers and tests.
2. Add safe credential source/status detection.
3. Register get_credential_setup_instructions and check_bilibili_credentials MCP tools.
4. Add next_steps to COOKIE_EXPIRED and SUBTITLE_UNAVAILABLE error payloads.
5. Update tool descriptions so installing agents discover credential setup.
6. Update README.md and README_EN.md for the new runtime credential helper tools.
7. Run final verification: npm test, npm run build, npm pack --dry-run, and the secret/stale-client scan from the plan.

Required project rules:
- Use the repository instructions in AGENTS.md and CLAUDE.md.
- Use Superpowers executing-plans or subagent-driven-development for the implementation.
- Use project-local Claude subagents when appropriate:
  - test-baseline-builder for TDD implementation.
  - build-error-resolver only if tests/build fail.
  - risk-reviewer after implementation for credential leak and MCP compatibility review.
- Do not hard-code any model choice into repository files.
- Do not touch generated dist/ unless explicitly required by the plan.
- Do not touch unrelated dirty files such as docs/agent-memory/pending-learning-proposals.md or .codex/scripts/__pycache__/.
- Do not revert user changes.
- Do not include real Cookie values, SESSDATA, bili_jct, DedeUserID, npm tokens, or GitHub tokens in source, tests, docs, logs, or reports.

Execution standard:
- Follow TDD: write failing tests first, then minimal implementation, then verify.
- Keep existing MCP tool names and behavior backward-compatible.
- The new tools must never return raw Cookie values.
- If a product or architecture decision is required beyond the plan, stop and report the decision point.

Final report required:
- Files changed.
- Commands run and results.
- New test count or changed test baseline.
- Confirmation that no Cookie values are returned/logged/documented.
- Confirmation that Coze, Langcli, MiniMax, Mavis, and Kimi Work were not reintroduced to README.
- Any skipped checks or unresolved risks.
```

---

## Prompt 1: Phase 1 Helper And Status Tests

Use only if Claude Code asks for phase-specific direction, or if you want to resume from this phase.

```text
Continue the same goal run. Execute Phase 1 from the implementation plan.

Implement only the safe credential helper and status foundation:
- Create tests/credential-guidance.test.ts.
- Create src/utils/credential-guidance.ts.
- Modify src/utils/credentials.ts only as needed for safe source detection.

Required behavior:
- buildCredentialSetupInstructions returns setup commands:
  - npx -y @xzxzzx/bilibili-mcp config
  - npx -y @xzxzzx/bilibili-mcp check
- buildCredentialNextSteps returns actionable next steps for errors.
- buildCredentialStatus returns:
  - configured
  - source: env | global_config | none
  - logged_in
  - next_steps
  - security_notes
- No raw Cookie values or full DedeUserID may appear in returned payloads.

Verification:
- npm test -- tests/credential-guidance.test.ts

Stop only if the plan requires a decision or if tests reveal an existing incompatible behavior.
```

---

## Prompt 2: Phase 2 MCP Tool Registration

Use only if Claude Code asks for phase-specific direction, or if you want to resume from this phase.

```text
Continue the same goal run. Execute Phase 2 from the implementation plan.

Implement MCP tool registration:
- Modify src/server.ts.
- Modify tests/server-tools.test.ts.
- Create tests/server-credential-tools.test.ts if useful.

New MCP tools:
- get_credential_setup_instructions
- check_bilibili_credentials

Rules:
- Both tools have no required input.
- Both return JSON text through MCP content.
- get_credential_setup_instructions returns safe setup guidance and no secrets.
- check_bilibili_credentials returns safe credential status and no secrets.
- Existing content tools remain backward compatible.
- Tool descriptions for subtitle/comment/info usage must mention get_credential_setup_instructions so installing agents can discover credential setup.

Verification:
- npm test -- tests/server-tools.test.ts
- npm test -- tests/server-credential-tools.test.ts

Stop only if MCP SDK handler internals have changed and the existing test pattern can no longer inspect tools/list or tools/call.
```

---

## Prompt 3: Phase 3 Error next_steps

Use only if Claude Code asks for phase-specific direction, or if you want to resume from this phase.

```text
Continue the same goal run. Execute Phase 3 from the implementation plan.

Add actionable next_steps to existing error payloads:
- COOKIE_EXPIRED responses include buildCredentialNextSteps().
- SUBTITLE_UNAVAILABLE responses include credential setup next steps and mention fallback_to_description: true when appropriate.

Also update stale .env-only Cookie error messages in:
- src/bilibili/subtitle.ts
- src/bilibili/http.ts

Use ASCII text for new error messages to avoid mojibake.

Rules:
- Do not change the error code names.
- Do not remove Cookie-based subtitle access.
- Do not leak raw Cookie values.

Verification:
- npm test -- tests/server-credential-tools.test.ts tests/bilibili-transcript.test.ts tests/bilibili-video-api.test.ts
```

---

## Prompt 4: Phase 4 Documentation

Use only if Claude Code asks for phase-specific direction, or if you want to resume from this phase.

```text
Continue the same goal run. Execute Phase 4 from the implementation plan.

Update README.md and README_EN.md:
- Mention get_credential_setup_instructions.
- Mention check_bilibili_credentials.
- Update the agent-installer note so agents know they can call these tools after connecting the MCP server.

Rules:
- Do not reintroduce unsupported clients removed earlier:
  - Coze
  - Langcli
  - MiniMax
  - Mavis
  - Kimi Work
- Do not add real Cookie values or examples in key=value form.
- Keep existing README structure and style.
- Do not do broad documentation rewrites.

Verification:
- rg -n "get_credential_setup_instructions|check_bilibili_credentials|SESSDATA=|bili_jct=|DedeUserID=" README.md README_EN.md
- rg -n "Coze|Langcli|MiniMax|Mavis|Kimi Work" README.md README_EN.md
```

---

## Prompt 5: Phase 5 Final Verification And Report

Use only if Claude Code asks for phase-specific direction, or if you want to force final verification.

```text
Continue the same goal run. Execute final verification from the implementation plan.

Run:
- npm test
- npm run build
- npm pack --dry-run
- rg -n "SESSDATA=|bili_jct=|DedeUserID=|npm_[A-Za-z0-9]|ghp_[A-Za-z0-9]|Coze|Langcli|MiniMax|Mavis|Kimi Work" README.md README_EN.md src tests

Expected:
- Tests pass.
- Build passes.
- npm pack dry run passes.
- No real secrets.
- Removed unsupported clients are not reintroduced to README.
- New credential helper tools are included in package source and README.

Final report format:

Files changed:
- ...

Commands run:
- command: result

Credential safety:
- Confirm whether any Cookie values are returned, logged, or documented.

MCP compatibility:
- Confirm existing tools are unchanged and new tools are additive.

Skipped checks or risks:
- ...
```

