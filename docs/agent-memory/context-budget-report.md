# Context Budget Report

Status: OK
Estimated always-relevant documentation tokens: 8362
Configured project hook entries: 9

## Files

| File | Lines | Est. tokens |
|---|---:|---:|
| `RULES.md` | 392 | 4629 |
| `AGENTS.md` | 11 | 278 |
| `docs\agent-memory\README.md` | 83 | 1024 |
| `docs\agent-memory\active-work.md` | 160 | 2431 |

## Guidance

- Keep shared rules in RULES.md and Codex-specific guidance in AGENTS.md.
- Keep hooks project-local and avoid loading broad external rules by default.
- Prefer on-demand skills over always-loaded instructions.
- Re-run this script after adding MCP servers, broad rules, or large agent docs.
