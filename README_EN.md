# Bilibili MCP Tool

[![npm version](https://img.shields.io/npm/v/@xzxzzx/bilibili-mcp.svg)](https://www.npmjs.com/package/@xzxzzx/bilibili-mcp)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![npm downloads](https://img.shields.io/npm/dm/@xzxzzx/bilibili-mcp.svg)](https://www.npmjs.com/package/@xzxzzx/bilibili-mcp)

## ✨ **Equip your AI assistant with "Bilibili Eyes"**: One-click extraction of video subtitles and popular comments for efficient information summarization 🚀

> [!TIP]
> ⚠️ **Quick Start**: Please make sure to configure your Bilibili Cookies before use, otherwise video subtitles and comments cannot be extracted. See [**⚙️ Credential Configuration**](#⚙️-credential-configuration)(Cookies are only stored locally and will not be uploaded anywhere).

View this document in [简体中文](./README.md)  
📜 **[Changelog](./CHANGELOG_EN.md)**

---

## 📑 Table of Contents

- [Bilibili MCP Tool](#bilibili-mcp-tool)
  - [✨ **Equip your AI assistant with "Bilibili Eyes"**: One-click extraction of video subtitles and popular comments for efficient information summarization 🚀](#-equip-your-ai-assistant-with-bilibili-eyes-one-click-extraction-of-video-subtitles-and-popular-comments-for-efficient-information-summarization-)
  - [📑 Table of Contents](#-table-of-contents)
  - [⚡ Pre-check](#-pre-check)
  - [🌟 Features](#-features)
    - [1. Video Summarization (`get_video_info`)](#1-video-summarization-get_video_info)
    - [2. Comment Summarization (`get_video_comments`)](#2-comment-summarization-get_video_comments)
    - [3. Video Transcript (`get_video_transcript`)](#3-video-transcript-get_video_transcript)
    - [4. Video Metadata (`get_video_metadata`)](#4-video-metadata-get_video_metadata)
    - [5. Behavior and Error Handling](#5-behavior-and-error-handling)
  - [📋 Requirements](#-requirements)
  - [🚀 Installation](#-installation)
    - [🖱️ Cursor](#️-cursor)
    - [Claude Code](#claude-code)
      - [Method 1: Fast Installation via CLI (Recommended)](#method-1-fast-installation-via-cli-recommended)
      - [Method 2: Manual Addition via Config File](#method-2-manual-addition-via-config-file)
    - [Claude Desktop](#claude-desktop)
      - [Method 1: Manual Addition via Config File](#method-1-manual-addition-via-config-file)
      - [Method 2: Global npm Installation](#method-2-global-npm-installation)
    - [🏗️ Trae (Official IDE by ByteDance)](#️-trae-official-ide-by-bytedance)
    - [🌊 Windsurf (Official IDE by Codeium)](#-windsurf-official-ide-by-codeium)
    - [⚡ Zed](#-zed)
    - [♊ Gemini CLI (Official Google CLI)](#-gemini-cli-official-google-cli)
    - [⌨️ Codex CLI (Official OpenAI CLI)](#️-codex-cli-official-openai-cli)
    - [🪐 Antigravity (Official Google IDE)](#-antigravity-official-google-ide)
    - [📦 OpenCode](#-opencode)
  - [⚙️ Credential Configuration](#️-credential-configuration)
    - [🔑 Step 1: Obtain Bilibili Cookies](#-step-1-obtain-bilibili-cookies)
    - [📝 Step 2: Apply Credentials](#-step-2-apply-credentials)
      - [Method A: CLI Wizard (Recommended, for global installations)](#method-a-cli-wizard-recommended-for-global-installations)
      - [Method B: Manual Environment Variables (for local development or Docker)](#method-b-manual-environment-variables-for-local-development-or-docker)
      - [🔒 Security Notice](#-security-notice)
  - [💡 Usage Examples](#-usage-examples)
  - [🛡️ API Rate Limiting](#️-api-rate-limiting)
  - [🛠️ Development Guide](#️-development-guide)
  - [⚖️ Safety and Disclaimer](#️-safety-and-disclaimer)
    - [License](#license)
  - [🛠️ Development Process](#️-development-process)
  - [💬 Feedback \& Suggestions](#-feedback--suggestions)

---

## ⚡ Pre-check

> [!IMPORTANT]
> **This tool requires Bilibili Credentials (Cookies) to function fully.**
> Without proper credentials, you may face issues retrieving subtitles, popular comments, or encounter frequent API rate limiting.

Before proceeding with installation, please ensure you are familiar with [How to obtain and configure Cookies](#⚙️-credential-configuration).

---

## 🌟 Features

### 1. Video Summarization (`get_video_info`)
- Prioritizes retrieving CC or AI subtitles.
- Automatically falls back to video title, description, and tags if no subtitles are available.
- Supports multi-language subtitle selection (defaults to Simplified Chinese).
- Supports manual preference for subtitle languages (e.g., `en`, `zh-Hant`).

### 2. Comment Summarization (`get_video_comments`)
- Retrieves popular comments to help gauge video sentiment.
- Filters emoji placeholders (e.g., `[doge]`) for cleaner text.
- Prioritizes comments with timestamps (e.g., `05:20`) for quick highlight location.
- Supports two levels of detail:
  - `brief`: 10 popular comments summary.
  - `detailed`: 20 popular comments + high-quality replies.
- Optional parameters:
  - `limit`: Explicit comment count `1-50`, overrides `detail_level` default.
  - `sort`: Sort order `"hot"` (default) or `"time"`.
  - `include_replies`: Whether to include top replies (default `true`).

### 3. Video Transcript (`get_video_transcript`)
- Returns clean subtitle text, joined by newlines.
- Supports preferred language selection (defaults to `zh-Hans` > `ai-zh` > `zh-CN` > `zh-Hant` > `en` priority).
- Optional parameters:
  - `preferred_lang`: Preferred subtitle language code.
  - `fallback_to_description`: Fall back to video description if subtitles unavailable (default `false`).
- By default, returns `SUBTITLE_UNAVAILABLE` error when no subtitles exist.
- Cookie expiration always returns `COOKIE_EXPIRED`, never silently falls back.

### 4. Video Metadata (`get_video_metadata`)
- Returns video title, author, duration, publish date, description, tags, and stats (views, likes, coins, etc.).
- Does not fetch subtitles or comments.
- Only requires the `bvid_or_url` parameter.

### 5. Behavior and Error Handling

- **Intelligent Cookie Expiration Detection**: Automatically verifies login status when subtitles are empty, distinguishing between "videos without subtitles" and "invalid credentials," and throwing a clear `COOKIE_EXPIRED` error to prevent silent degradation.

#### Without Cookie

- Some public video metadata (`get_video_metadata`) may work without authentication.
- Subtitles (`get_video_info`, `get_video_transcript`) may be unavailable, incomplete, or fail without authentication.
- Comments (`get_video_comments`) may be incomplete, empty, or rate-limited without authentication.
- Do not rely on cookie-less mode for reliable subtitle or comment access.

#### Credential Sources

- Credentials should be supplied via `.env` file, environment variables, or the credential helper.
- Supported environment variables: `BILIBILI_SESSDATA`, `BILIBILI_BILI_JCT`, `BILIBILI_DEDEUSERID`.
- **Never** hard-code Cookie values in source code, scripts, docs, tests, logs, or examples.
- If Cookie values were previously exposed in repository history, rotate them immediately via Bilibili account settings.

#### Expected Error Codes

| Code | Meaning | Caller Action |
|------|---------|---------------|
| `VALIDATION_ERROR` | Invalid input parameter | Fix the `bvid_or_url` or other parameter |
| `COOKIE_EXPIRED` | Cookie expired or not logged in | User should refresh/rotate Bilibili credentials |
| `SUBTITLE_UNAVAILABLE` | No subtitles available for this video | For `get_video_transcript`, retry with `fallback_to_description: true` |

## 📋 Requirements

- **Node.js**: v18.0.0 or higher.
- Bilibili Account Credentials (Cookies).

---

## 🚀 Installation

### 🖱️ Cursor

Cursor supports MCP natively. You can add it via the UI:

1. Open Cursor Settings: `Cursor Settings` > `Features` > `MCP Servers`.
2. Click **+ Add New MCP Server**.
3. Fill in the following:
   - **Name**: `bilibili-mcp`
   - **Type**: Select `command`.
   - **Command**: `npx -y @xzxzzx/bilibili-mcp` (If on Windows and facing path issues, try `cmd /k npx -y @xzxzzx/bilibili-mcp`).
4. Click **Add**. You might need to click the refresh icon next to the server list to load tools.

> **Tip**: Advanced users can also create a `.cursor/mcp.json` in the project root.

### Claude Code

#### Method 1: Fast Installation via CLI (Recommended)

Run this command in your terminal:

```bash
claude mcp add bilibili-mcp --command "npx" --args "-y" --args "@xzxzzx/bilibili-mcp"
```

Restart Claude Code after completion.

#### Method 2: Manual Addition via Config File

1. Open Claude Code config (usually at `~/.claude.json`).
2. Add the following to the `mcpServers` node:

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
3. Save and restart Claude Code.

### Claude Desktop

Claude Desktop supports MCP servers via a global configuration file:

#### Method 1: Manual Addition via Config File

1. Open the Claude Desktop configuration file:
   - Windows Path: `%APPDATA%\Claude\claude_desktop_config.json`
   - macOS Path: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - *Tip: You can also open this file by clicking **Edit Config** in **Settings** -> **Developer** within Claude Desktop.*
2. Add the following to the `mcpServers` node:

```json
{
  "mcpServers": {
    "bilibili-mcp": {
      "command": "npx",
      "args": ["-y", "@xzxzzx/bilibili-mcp"],
      "env": {
        "BILIBILI_SESSDATA": "YOUR_SESSDATA",
        "BILIBILI_BILI_JCT": "YOUR_bili_jct",
        "BILIBILI_DEDEUSERID": "YOUR_DedeUserID"
      }
    }
  }
}
```
3. Save the file and restart Claude Desktop or start a new conversation to load the tools.

#### Method 2: Global npm Installation

Manage configuration via the CLI tool after installation:

```bash
npm install -g @xzxzzx/bilibili-mcp
```

Verification & Inspection:
1. `bilibili-mcp --help` (View help)
2. `bilibili-mcp config` (Interactive cookie configuration)
3. `bilibili-mcp check` (Check configuration status)

### 🏗️ Trae (Official IDE by ByteDance)

Trae provides a very convenient UI for MCP integration:

1. Open Trae Settings: Click the gear icon -> **Settings** (or `Cmd/Ctrl + ,`).
2. Go to **AI** tab -> **MCP**.
3. Click **Add Server**.
4. Enter:
   - **Name**: `bilibili-mcp`
   - **Type**: Select `command` (stdio)
   - **Command**: `npx`
   - **Arguments**: `["-y", "@xzxzzx/bilibili-mcp"]`
5. Click **Save**.

> **Tip**: Trae also automatically recognizes `.trae/mcp_config.json` in the project root.

### 🌊 Windsurf (Official IDE by Codeium)

Windsurf supports integration via standard JSON config:

1. Open Windsurf Settings: `Cmd/Ctrl + ,` -> Click **Advanced** -> **Cascade**.
2. Click **Add custom server +** or **View raw config** (opens `mcp_config.json`).
3. For manual editing, the path is usually:
   - Windows: `%USERPROFILE%\.codeium\windsurf\mcp_config.json`
   - macOS/Linux: `~/.codeium/windsurf/mcp_config.json`
4. Add to the `mcpServers` node:
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
5. Save and restart Windsurf.

### ⚡ Zed

Zed uses the `context_servers` field in `settings.json`:

1. Open Zed Settings: `Cmd + ,` (macOS) or `Ctrl + ,` (Windows/Linux).
2. Add or modify the `context_servers` node:

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
3. Save the file. Zed will automatically restart the Context Server.

### ♊ Gemini CLI (Official Google CLI)

Gemini CLI manages MCP via global or project-level `settings.json`:

1. Locate global config:
   - Windows: `%USERPROFILE%\.gemini\settings.json`
   - macOS/Linux: `~/.gemini/settings.json`
2. Add to the `mcpServers` node:

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
3. For project-level, create `.gemini/settings.json` in the project root.

### ⌨️ Codex CLI (Official OpenAI CLI)

Codex CLI uses TOML and supports quick addition via command line:

**Method 1: CLI Addition (Recommended)**
Run in terminal:
```bash
codex mcp add bilibili-mcp -- npx -y @xzxzzx/bilibili-mcp
```

**Method 2: Manual Edit**
1. Locate config: `~/.codex/config.toml` (Global) or `.codex/config.toml` (Project).
2. Add:
```toml
[mcp_servers.bilibili-mcp]
command = "npx"
args = ["-y", "@xzxzzx/bilibili-mcp"]
```

### 🪐 Antigravity (Official Google IDE)

Antigravity natively supports MCP. Add via UI or config file:

**Method 1: UI Addition (Recommended)**
1. Click `...` in the sidebar -> **MCP Store**.
2. Click **Manage MCP Servers -> View raw config**.

**Method 2: Manual Edit**
- Windows: `%USERPROFILE%\.gemini\antigravity\mcp_config.json`
- macOS/Linux: `~/.gemini/antigravity/mcp_config.json`

Add to `mcpServers` node:
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

### 📦 OpenCode

Edit the config file:

1. Edit `~/.config/opencode/opencode.json`.
2. Add to `mcp` node:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "mcp": {
    "bilibili-mcp": {
      "type": "local",
      "command": ["npx", "-y", "@xzxzzx/bilibili-mcp"],
      "enabled": true
    }
  }
}
```

---

---

## ⚙️ Credential Configuration

To retrieve full comment data, bypass anonymous access limits, and ensure stability, you **must** configure Bilibili Cookies.

### 🔑 Step 1: Obtain Bilibili Cookies

1. Log in to [bilibili.com](https://www.bilibili.com) in your desktop browser.
2. Press `F12` to open Developer Tools (or right-click and select "Inspect").
3. Go to the **Application** tab -> Find **Cookies** in the left menu -> Click `https://www.bilibili.com`.
4. Locate the following three key variables and record their **Value**:
    - `SESSDATA`
    - `bili_jct` (also known as CSRF Token)
    - `DedeUserID` (your numerical User ID)

> [!TIP]
> If you can't find them in the `Application` tab, check the `Network` tab for any request, and look for the `Cookie` field under `Headers`.

### 📝 Step 2: Apply Credentials

Choose one of the following methods based on your preference:

#### Method A: CLI Wizard (Recommended, for global installations)
If installed via npm (`npm i -g @xzxzzx/bilibili-mcp`), run:
```bash
bilibili-mcp config
```
The interactive wizard will guide you through entering credentials and save them **locally** (`~/.bilibili-mcp/config.json`).

#### Method B: Manual Environment Variables (for local development or Docker)
Create a `.env` file in the project root and enter the following variables:

| Variable | Description |
| :--- | :--- |
| **BILIBILI_SESSDATA** | Value of `SESSDATA` |
| **BILIBILI_BILI_JCT** | Value of `bili_jct` |
| **BILIBILI_DEDEUSERID** | Value of `DedeUserID` |

> [!WARNING]
> The `.env` file is for local use only. **Never commit it to Git or any public repository.**

#### 🔒 Security Notice
- **Privacy**: Your credentials are only stored on your local device. This tool **never** uploads them to any third-party server besides official Bilibili APIs.
- **Isolation**: The `.env` file is excluded by `.gitignore`.
- **Expiration**: Cookies expire over time. If you encounter `412` or permission errors, try updating your cookies.

---

## 💡 Usage Examples

AI assistants will call these tools using JSON:

```json
// Default language video info
{
  "name": "get_video_info",
  "arguments": { "bvid_or_url": "BV1xx4x1x7xx" }
}

// 10 popular comments summary
{
  "name": "get_video_comments",
  "arguments": { "bvid_or_url": "BV1xx4x1x7xx", "detail_level": "brief" }
}

// Transcript-only text (returns error if no subtitles)
{
  "name": "get_video_transcript",
  "arguments": { "bvid_or_url": "BV1xx4x1x7xx" }
}

// Video metadata
{
  "name": "get_video_metadata",
  "arguments": { "bvid_or_url": "BV1xx4x1x7xx" }
}

// Comments with custom limit + sort
{
  "name": "get_video_comments",
  "arguments": { "bvid_or_url": "BV1xx4x1x7xx", "limit": 5, "sort": "time", "include_replies": false }
}
```

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
