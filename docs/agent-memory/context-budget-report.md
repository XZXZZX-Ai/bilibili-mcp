# Context Budget Report

Status: REVIEW
Estimated always-relevant documentation tokens: 13840
Configured project hook entries: 8

## Files

| File | Lines | Est. tokens |
|---|---:|---:|
| `AGENTS.md` | 297 | 3949 |
| `CLAUDE.md` | 359 | 3946 |
| `docs\agent-memory\README.md` | 63 | 612 |
| `docs\superpowers\plans\2026-05-27-stabilization-roadmap.md` | 585 | 3964 |
| `docs\superpowers\specs\2026-05-28-agent-hooks-design.md` | 179 | 1369 |

## Guidance

- Keep AGENTS.md and CLAUDE.md focused; avoid duplicating long workflow text.
- Keep hooks project-local and avoid loading broad external rules by default.
- Prefer on-demand skills over always-loaded instructions.
- Re-run this script after adding MCP servers, broad rules, or large agent docs.
