# QA Checklists

This directory stores human-facing QA checklists for release, package/install, MCP client, credential, stdio, and public tool-flow verification.

Use `docs/templates/qa-checklist.md` when changes affect:

- releases, npm publish, npm package contents, `bin`, `main`, `module`, `types`, or install paths
- MCP stdio startup, tool discovery, tool schemas, or public tool response behavior
- credential setup, credential checks, Cookie handling, or secret redaction
- README installation instructions or user-facing setup flows
- post-release checks against npm, GitHub Releases, or real MCP clients

Do not create QA checklists for routine internal refactors, narrow tests-only changes, or agent-rule documentation changes unless they affect real user workflows.
