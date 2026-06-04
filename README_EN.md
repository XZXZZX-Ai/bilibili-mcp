# Bilibili MCP Tool

[![npm version](https://img.shields.io/npm/v/@xzxzzx/bilibili-mcp.svg)](https://www.npmjs.com/package/@xzxzzx/bilibili-mcp)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![npm downloads](https://img.shields.io/npm/dm/@xzxzzx/bilibili-mcp.svg)](https://www.npmjs.com/package/@xzxzzx/bilibili-mcp)

MCP server that gives AI clients access to Bilibili video subtitles, transcripts, metadata, and popular comments.

View in [简体中文](https://github.com/365903728-oss/bilibili-mcp/blob/master/README.md) · 📜 [Changelog](https://github.com/365903728-oss/bilibili-mcp/blob/master/CHANGELOG_EN.md) · 📦 [npm](https://www.npmjs.com/package/@xzxzzx/bilibili-mcp) · 🚀 [Release v1.4.0](https://github.com/365903728-oss/bilibili-mcp/releases/tag/v1.4.0)

> [!TIP]
> ⚠️ Configure your Bilibili Cookies before use. Metadata may work without cookies, but subtitles/transcripts/comments require them. See [**Credential Configuration**](#-credential-configuration).

---

## ⚡ Quick Start

```bash
# Run directly
npx -y @xzxzzx/bilibili-mcp

# Claude Code one-liner
claude mcp add bilibili-mcp --command "npx" --args "-y" --args "@xzxzzx/bilibili-mcp"
```

<details><summary><b>Claude Desktop config</b></summary>

```json
{
  "mcpServers": {
    "bilibili-mcp": {
      "command": "npx",
      "args": ["-y", "@xzxzzx/bilibili-mcp"],
      "env": {
        "BILIBILI_SESSDATA": "<your_sessdata>",
        "BILIBILI_BILI_JCT": "<your_bili_jct>",
        "BILIBILI_DEDEUSERID": "<your_dedeuserid>"
      }
    }
  }
}
```
</details>

More client setups under [Installation](#-installation).

---

## 📑 Table of Contents

- [⚡ Quick Start](#-quick-start)
- [🌟 Features](#-features)
  - [1. Video Summarization (`get_video_info`)](#1-video-summarization-get_video_info)
  - [2. Comment Summarization (`get_video_comments`)](#2-comment-summarization-get_video_comments)
  - [3. Video Transcript (`get_video_transcript`)](#3-video-transcript-get_video_transcript)
  - [4. Video Metadata (`get_video_metadata`)](#4-video-metadata-get_video_metadata)
  - [5. Behavior and Error Handling](#5-behavior-and-error-handling)
- [📋 Requirements](#-requirements)
- [🚀 Installation](#-installation)
- [⚙️ Credential Configuration](#-credential-configuration)
- [🧭 Which tool should I use?](#-which-tool-should-i-use)
- [💡 Tool Call Examples](#-tool-call-examples)
- [🛡️ API Rate Limiting](#️-api-rate-limiting)
- [🛠️ Development Guide](#️-development-guide)
- [⚖️ Safety & Disclaimer](#️-safety--disclaimer)
- [💬 Feedback & Suggestions](#-feedback--suggestions)

---

## 📋 Requirements

- **Node.js**: v18.0.0 or higher.
- Bilibili Account Credentials (Cookies).

---

## 🚀 Installation

### Recommended

| Scenario | Command |
|---|---|
| Run directly | `npx -y @xzxzzx/bilibili-mcp` |
| Global install | `npm install -g @xzxzzx/bilibili-mcp` |
| Configure cookies | `bilibili-mcp config` |
| Check config | `bilibili-mcp check` |

### Client Quick Reference

All clients use the same core config: `command: npx`, `args: ["-y", "@xzxzzx/bilibili-mcp"]`.

| Client | Method | Config Path / Command |
|---|---|---|
| Claude Code | CLI | `claude mcp add bilibili-mcp --command "npx" --args "-y" --args "@xzxzzx/bilibili-mcp"` |
| Claude Desktop | JSON | Settings → Developer → Edit Config |
| Cursor | UI / JSON | Settings → Features → MCP Servers |
| Windsurf | JSON | `~/.codeium/windsurf/mcp_config.json` |
| Zed | JSON | `settings.json` → `context_servers` |
| Codex CLI | TOML | `codex mcp add bilibili-mcp -- npx -y @xzxzzx/bilibili-mcp` |
| Gemini CLI | JSON | `~/.gemini/settings.json` |
| Trae | UI / JSON | Settings → AI → MCP |
| Antigravity | UI / JSON | MCP Store → Manage MCP Servers |
| OpenCode | JSON | `~/.config/opencode/opencode.json` |

> [!NOTE]
> Do not write real Cookie values in client config files. See [⚙️ Credential Configuration](#-credential-configuration).

<details><summary><b>Expand for detailed per-client setup</b></summary>

### Claude Code

```bash
claude mcp add bilibili-mcp --command "npx" --args "-y" --args "@xzxzzx/bilibili-mcp"
```

Alternatively, edit `~/.claude.json` and add the same JSON block shown for Claude Desktop under `mcpServers`.

### Claude Desktop

Open Settings → Developer → Edit Config, or directly edit:

- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "bilibili-mcp": {
      "command": "npx",
      "args": ["-y", "@xzxzzx/bilibili-mcp"]
    }
  }
}
```

### Cursor

Settings → Features → MCP Servers → + Add New MCP Server:

- Type: `command`

- Command: `npx -y @xzxzzx/bilibili-mcp`

Advanced users can also create `.cursor/mcp.json` in the project root.

### Windsurf

Edit `~/.codeium/windsurf/mcp_config.json`:
```json
{
  "mcpServers": {
    "bilibili-mcp": {
      "command": "npx",
      "args": ["-y", "@xzxzzx/bilibili-mcp"]
    }
  }
}
```

### Zed

Edit `settings.json`, add `context_servers`:
```json
{
  "context_servers": {
    "bilibili-mcp": {
      "command": "npx",
      "args": ["-y", "@xzxzzx/bilibili-mcp"]
    }
  }
}
```

### Codex CLI

```bash
codex mcp add bilibili-mcp -- npx -y @xzxzzx/bilibili-mcp
```

Or edit `~/.codex/config.toml`:
```toml
[mcp_servers.bilibili-mcp]
command = "npx"
args = ["-y", "@xzxzzx/bilibili-mcp"]
```

### Gemini CLI

Edit `~/.gemini/settings.json`, add standard command+args config under `mcpServers`. Ensure HTTP_PROXY is configured for users in mainland China.

### Trae

Settings → AI → MCP → Add Server:

- Type: `command` (stdio)

- Command: `npx`

- Arguments: `["-y", "@xzxzzx/bilibili-mcp"\]

### Antigravity

Sidebar → MCP Store → Manage MCP Servers → View raw config, or manually edit:

- Windows: `%USERPROFILE%\.gemini/antigravity\mcp_config.json`

- macOS/Linux: `~/.gemini/antigravity/mcp_config.json`

### OpenCode

Edit `~/.config/opencode/opencode.json`:
```json
{
  "mcp": {
    "bilibili-mcp": {
      "type": "local",
      "command": ["npx", "-y", "@xzxzzx/bilibili-mcp"],
      "enabled": true
    }
  }
}
```

</details>

## ⚙️ Credential Configuration

For reliable access to subtitles, transcripts, and comments, configure Bilibili Cookies. Public video metadata may work without cookies, but do not rely on cookieless mode for subtitles or comments.

### Recommended: CLI Wizard

```bash
npm install -g @xzxzzx/bilibili-mcp
bilibili-mcp config
bilibili-mcp check
```

The CLI saves credentials to a local config directory, outside the repository.

### Environment Variables

For Docker, local development, or manual MCP client configuration.

| Variable | Description |
|---|---|
| `BILIBILI_SESSDATA` | SESSDATA from your Bilibili login cookie |
| `BILIBILI_BILI_JCT` | bili_jct from your Bilibili login cookie |
| `BILIBILI_DEDEUSERID` | Your Bilibili user ID |

`.env` example:

```env
BILIBILI_SESSDATA=<your_sessdata>
BILIBILI_BILI_JCT=<your_bili_jct>
BILIBILI_DEDEUSERID=<your_dedeuserid>
```

### Obtaining Cookies

Get cookies from your own Bilibili login session only. Browser developer tools vary; follow your browser"s actual interface.

Do not share cookies with others. Do not paste them into public chats, issues, PRs, READMEs, logs, or test files.

### Security Notice

- Keep cookies in local config, environment variables, or `.env` only.
- `.env` is excluded by `.gitignore`, but always avoid committing it.
- If cookies are leaked, invalidate the old session on Bilibili"s account settings immediately.
- This project does not upload cookies to any third-party service other than Bilibili"s official API.

---

## 🧭 Which tool should I use?

| Goal | Recommended tool | What you get |
|---|---|---|
| Summarize a video | `get_video_info` | Subtitles first; falls back to title, description, tags |
| Get clean transcript text | `get_video_transcript` | Plain subtitle text, language, data source |
| See structured metadata | `get_video_metadata` | Title, author, duration, publish date, tags, stats |
| View audience reactions | `get_video_comments` | Popular comments, timestamped highlights, optional replies |

## 💡 Tool Call Examples

> Your AI client will automatically turn your natural-language intent into the corresponding JSON call.

### `get_video_transcript`

**Best for**: feeding video content into AI for summarization, note-taking, Q&A, or knowledge management.

Request:

```json
{
  "name": "get_video_transcript",
  "arguments": {
    "bvid_or_url": "https://www.bilibili.com/video/BV1xx411c7mD",
    "preferred_lang": "en",
    "fallback_to_description": false
  }
}
```

Returns: `bvid`, `title`, `language`, `transcript` (newline-joined), `data_source` (`subtitle` or `description`).

> Returns `SUBTITLE_UNAVAILABLE` when no subtitles exist. Set `fallback_to_description: true` to fall back.

### `get_video_metadata`

**Best for**: quickly checking video basics without subtitles or comments.

Request:

```json
{
  "name": "get_video_metadata",
  "arguments": {
    "bvid_or_url": "BV1xx411c7mD"
  }
}
```

Returns: `bvid`, `title`, `author`, `duration`, `pubdate` / `pubdate_timestamp`, `description`, `tags`, and `stats` (views, likes, coins, favorites, shares, replies, danmaku).

### `get_video_info`

**Best for**: letting AI summarize a video -- attempts subtitles first, falls back to description and tags.

Request:

```json
{
  "name": "get_video_info",
  "arguments": {
    "bvid_or_url": "https://www.bilibili.com/video/BV1xx411c7mD",
    "preferred_lang": "en"
  }
}
```

Returns: `data_source` (`subtitle` or `description`), `video_info` (title, description, tags, subtitle text, publish date).

> Videos without subtitles automatically degrade to description and tags (`data_source: "description"`).

### `get_video_comments`

**Best for**: gauging audience sentiment and finding highlight timestamps.

Request:

```json
{
  "name": "get_video_comments",
  "arguments": {
    "bvid_or_url": "BV1xx411c7mD",
    "detail_level": "detailed",
    "limit": 10,
    "sort": "hot",
    "include_replies": true
  }
}
```

Returns: `comments[]` (author, content, likes, timestamp, has_timestamp), `summary` (total count, timestamp count).

> Expired or missing cookies may result in empty comments. Use `sort: "time"` for newest comments, `include_replies: false` to skip replies.

---

## 🛡️ API Rate Limiting

Built-in strategies to ensure long-term availability:
- **Interval**: 500ms (0.5s).
- **Execution**: Sequential queue, no concurrency.

---

## 🛠️ Development Guide

```bash
git clone https://github.com/365903728-oss/bilibili-mcp.git
cd bilibili-mcp
npm install
npm run watch
```

---

## ⚖️ Safety and Disclaimer

- **Trademark**: Bilibili is a registered trademark of Bilibili Inc. This is a third-party open-source tool.
- **Liability**: Requests originate locally. Developers are not responsible for account restrictions.
- **Privacy**: No back-end uploading; credentials stored locally.

### License
Open-sourced under **GNU General Public License v3.0**.

---

## 🛠️ Development Process

This project is a crystal of AI-collaborative development, spanning from prototype to refinement:

1.  **Initial Generation**: Core architecture and base logic were rapidly built by **Claude Code** (powered by **GLM-4.7** model).
2.  **Debugging & Optimization**: Bugs were fixed and features enhanced using **Claude** and **Gemini** models within the **Antigravity** environment, ensuring stable subtitle extraction and comment analysis.
3.  **Multi-IDE Compatibility**: Through iterative updates, it now seamlessly supports Cursor, Trae, Windsurf, Zed, and mainstream AI CLI tools.

---

## 💬 Feedback & Suggestions

If you encounter any issues or have feature suggestions, feel free to reach out:

- **Submit an Issue**: [GitHub Issues](https://github.com/365903728-oss/bilibili-mcp/issues) — **Recommended**, I check and respond regularly.
- **Discussions**: Join our [GitHub Discussions](https://github.com/365903728-oss/bilibili-mcp/discussions) (if enabled) for general chat.

Thank you for your support!
