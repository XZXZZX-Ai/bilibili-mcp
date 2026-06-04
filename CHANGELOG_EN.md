# Changelog

All notable changes to the **Bilibili MCP Server** will be documented in this file.

---

## [1.4.0] - 2026-06-04

### 🚀 Added
- **Two new MCP tools**:
  - `get_video_transcript`: Returns clean subtitle text. Does not silently fall back to description by default; returns `SUBTITLE_UNAVAILABLE` when subtitles are unavailable.
  - `get_video_metadata`: Returns title, author, duration, publish date, description, tags, and stats without fetching subtitles or comments.
- `get_video_comments` now supports `limit` (1-50), `sort` (hot/time), `include_replies` (boolean). Old calling style remains compatible.

### 🔧 Changed
- **Security hardening**: Preserved Cookie-backed subtitle access while requiring credentials to come from environment variables or the credential helper; package contents, docs, tests, and examples do not include real Cookie values.
- **Package entry points**: `main`/`module`/`types` in `package.json` now correctly target `dist` build output.
- **Smithery removal**: Deleted `smithery.json`, `smithery.yaml`, `@smithery/cli` dependency, and related scripts.
- **Bilibili module split**: Refactored the large `client.ts` into focused modules (`http.ts`, `wbi.ts`, `fingerprint.ts`, `video-api.ts`, `comments-api.ts`) while preserving public API compatibility.
- Subtitle fallback, WBI signing, and buvid fingerprint behavior are unchanged.

### 🧪 Tests
- Real Vitest baseline: 110 unit tests covering validation, BVID parsing, input sanitization, subtitle fallback, comment wrapper controls, MCP schemas, and API behavior.
- Tests do not require real network access, Cookies, or external APIs.

### 📝 Docs
- README updated: all 4 tools documented, new comment parameters, no-cookie and Cookie-backed behavior, error codes, and standard degradation strategy.

## [1.3.7] - 2026-03-09

### 🚀 Added
- **Intelligent Cookie Expiration Detection**: When the subtitle interface returns an empty list, the tool now calls `/x/web-interface/nav` to verify the current login status before deciding whether to trigger a `COOKIE_EXPIRED` error.
  - If **Logged In** but no subtitles → Gracefully falls back to the description (normal behavior).
  - If **Not Logged In** (Cookie expired) → Throws a clear error to prevent "silent degradation," making it easier for users and AI to troubleshoot.
- *Security Note*: Error messages only contain status descriptions and are **strictly de-identified, never leaking actual Cookie content**.

---

## [1.3.5] - 2026-03-08
- Initial stable release with support for basic video info and comment fetching.
