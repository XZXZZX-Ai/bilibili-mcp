# Codex Adapter

<!-- harness-adapter: codex; shared-core: RULES.md; contract: harness.task-contract/v1 -->

Read [RULES.md](RULES.md) before substantive work. It owns implementation permissions, verification, and acceptance.

For product terminology use [CONTEXT.md](CONTEXT.md). For public tool inputs and results use the [tool reference](docs/tool-reference.md). Verify user-visible changes at their normal entry point.

Use the active Codex skill catalog. A manual-only skill needs a native `$skill` invocation. If required evidence is missing, use the shared gate with host `codex` before governed writes. Project reviewers under `.codex/agents/` are read-only unless explicitly assigned the single writer lease.

Before an implementation write, honor the selected adapter or ask once if none was selected. In `codex-direct`, Codex owns implementation through the accepted local commit. For an authorized Paseo handoff, follow the [collaboration procedure](docs/agent-memory/agent-communication.md#codex-paseo-claude) before launching Claude. Codex owns acceptance and returns repairs to the Claude writer.
