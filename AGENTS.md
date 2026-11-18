# Repository Guide

The current assistant handles the task directly. Check the working tree before editing and preserve unrelated changes. Use [CONTEXT.md](CONTEXT.md) for product terms, [docs/adr/](docs/adr/) for decisions, and the [tool reference](docs/tool-reference.md) for public contracts.

## Development

- Do simple, well-defined work directly. For other development, use `ask-dev` to select the skills the task needs.
- For a small fix with an existing GitHub Issue, use the reproduction and acceptance criteria already recorded there. Add missing details to that Issue when authorized, then fix, test, and deliver it.
- For a substantial new feature, use a GitHub Issue for the specification and development plan. Break the plan into independently verifiable tickets with acceptance criteria. Use `to-spec` and `to-tickets` when the user explicitly invokes them. Follow the [tracker](docs/agents/issue-tracker.md), [triage labels](docs/agents/triage-labels.md), and [domain guidance](docs/agents/domain.md).
- Run `npm run verify:local` before delivery and exercise changed user-visible behavior through its normal entry point. Inspect the diff and commit only this task's changes locally after verification, unless the user directs otherwise. Pushing, creating pull requests or tags, and releasing require authorization.

## Code Simplicity

- Make the smallest complete change. Reuse existing code, keep simple single-use logic at its call site, and extract helpers for reuse, complex boundaries, or meaningful concepts.
- Validate unknown input at its trust boundary, then pass validated types inward. Catch errors where recovery, cleanup, or translation needs them.
- Before expanding scope for a speculative race or security edge case, explain the failure mode, evidence or uncertainty, and added complexity, and obtain the user's agreement.

## Product Boundaries

- Maintain TypeScript ECMAScript modules (ESM) with Node16 resolution, the reusable Model Context Protocol (MCP) server and stdio entry point, and package entry points under generated `dist/`.
- Validate tool inputs before requests. Keep process resource ceilings fixed, tool responses bounded and JSON-serializable, and stdout reserved for the protocol during server operation.
- Keep Cookie-backed subtitle access through external credentials. Redact credentials in errors and logs and keep private values out of source, commits, and reports.
- Preserve media URL validation and HTTPS connection pinning at every redirect hop, and cancellation and cleanup for automatic speech recognition (ASR) subprocesses. Keep model installation and switching in the setup flow.
- Keep Smithery runtime configuration retired unless explicitly requested.
