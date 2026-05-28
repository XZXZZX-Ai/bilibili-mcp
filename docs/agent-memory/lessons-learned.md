# Lessons Learned

## 2026-05-27

- Lesson: Do not assume `.agents\skills` skills are available to Claude Code.
- Evidence: `vitest`, `secret-scanning`, and `github-actions-docs` were first installed under `.agents\skills`; Claude Code needed copies under `.claude\skills`.
- Future behavior: Check the target agent's actual skill directory before claiming a skill is installed for that agent.

- Lesson: Removing hard-coded Bilibili Cookie values must not remove Cookie-based subtitle access.
- Evidence: User clarified that subtitles may require Cookie access.
- Future behavior: Externalize credentials while preserving authenticated retrieval paths.

- Lesson: Some existing Markdown and terminal output can contain mojibake.
- Evidence: `AGENTS.md` and `CLAUDE.md` include encoding safety rules.
- Future behavior: Verify files as UTF-8 before copying or rewriting Chinese text.

## 2026-05-28

- Lesson: The project `.codex\` directory can be suitable for hook configuration but not necessarily for mutable runtime logs.
- Evidence: A dry run of `post_tool_use.py --agent codex` failed with Windows access denial when creating `.codex\memory`.
- Future behavior: Store Codex runtime hook observations under `C:\Users\ZX\.codex\memories\bilibili-mcp\`.
