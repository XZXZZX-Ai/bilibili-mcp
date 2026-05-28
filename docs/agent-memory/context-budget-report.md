# Context Budget Report

Status: REVIEW
Estimated always-relevant documentation tokens: 15617
Configured project hook entries: 8

## Files

| File | Lines | Est. tokens |
|---|---:|---:|
| `AGENTS.md` | 332 | 4639 |
| `CLAUDE.md` | 403 | 4812 |
| `docs\agent-memory\README.md` | 63 | 612 |
| `docs\superpowers\plans\2026-05-27-stabilization-roadmap.md` | 584 | 4185 |
| `docs\superpowers\specs\2026-05-28-agent-hooks-design.md` | 179 | 1369 |

## Guidance

- Keep AGENTS.md and CLAUDE.md focused; avoid duplicating long workflow text.
- Keep hooks project-local and avoid loading broad external rules by default.
- Prefer on-demand skills over always-loaded instructions.
- Re-run this script after adding MCP servers, broad rules, or large agent docs.
