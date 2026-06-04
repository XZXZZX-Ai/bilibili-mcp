# Bilibili MCP Tool

[![npm version](https://img.shields.io/npm/v/@xzxzzx/bilibili-mcp.svg)](https://www.npmjs.com/package/@xzxzzx/bilibili-mcp)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![npm downloads](https://img.shields.io/npm/dm/@xzxzzx/bilibili-mcp.svg)](https://www.npmjs.com/package/@xzxzzx/bilibili-mcp)

Bilibili MCP server — 让 Claude、Cursor、Codex 等 AI 客户端直接读取 Bilibili 视频字幕、转录、元数据和热门评论的 MCP server。

🌐 [English Documentation](https://github.com/365903728-oss/bilibili-mcp/blob/master/README_EN.md) · 📜 [更新日志](https://github.com/365903728-oss/bilibili-mcp/blob/master/CHANGELOG.md) · 📦 [npm](https://www.npmjs.com/package/@xzxzzx/bilibili-mcp) · 🚀 [Release v1.4.0](https://github.com/365903728-oss/bilibili-mcp/releases/tag/v1.4.0)

> [!TIP]
> ⚠️ 使用前请配置 B 站 Cookie。Metadata 可能无需 Cookie，但字幕/转录/评论建议配置。详见 [**凭证配置**](#️-凭证配置)。

---

## ⚡ 快速开始

选择你正在使用的 AI 客户端，点击后可直接跳转到详细配置方法：

- [Claude Code](#claude-code)
- [Claude Desktop](#claude-desktop)
- [Cursor](#cursor)
- [Windsurf](#windsurf)
- [Zed](#zed)
- [Codex CLI](#codex-cli)
- [Gemini CLI](#gemini-cli)
- [Trae](#trae)
- [Antigravity](#antigravity)
- [OpenCode](#opencode)

---

## 📑 目录

- [⚡ 快速开始](#-快速开始)
- [🌟 功能特性](#-功能特性)
  - [1. 视频总结 (`get_video_info`)](#1-视频总结-get_video_info)
  - [2. 评论总结 (`get_video_comments`)](#2-评论总结-get_video_comments)
  - [3. 视频转录 (`get_video_transcript`)](#3-视频转录-get_video_transcript)
  - [4. 视频元数据 (`get_video_metadata`)](#4-视频元数据-get_video_metadata)
  - [5. 行为说明与错误处理](#5-行为说明与错误处理)
- [📋 环境要求](#-环境要求)
- [🚀 安装方式](#-安装方式)
- [⚙️ 凭证配置](#️-凭证配置)
- [🧭 该用哪个工具](#-该用哪个工具)
- [💡 工具调用示例](#-工具调用示例)
- [🛡️ API 限流机制](#️-api-限流机制)
- [🛠️ 开发指南](#️-开发指南)
- [⚖️ 安全性与免责声明](#️-安全性与免责声明)
- [💬 反馈与建议](#-反馈与建议)

---

## 🌟 功能特性

### 1. 视频总结 (`get_video_info`)
- 优先获取视频的 CC 或 AI 字幕
- 无字幕时自动降级为视频标题、简介和标签
- 支持多语言字幕选择（默认优先简体中文）
- 可手动指定偏好字幕语言（如 `en`, `zh-Hant` 等）

### 2. 评论总结 (`get_video_comments`)
- 获取视频热门评论，辅助判断视频真实口碑
- 自动过滤表情占位符（如 `[doge]`）以保持文本整洁
- 优先保留包含时间戳的评论（如 `05:20`），方便定位高能片段
- 支持两种详细程度：
  - `brief`: 10 条热门评论速览
  - `detailed`: 20 条热门评论 + 高赞连带回复
- 可选参数：
  - `limit`: 显式评论数量 `1-50`，覆盖 `detail_level` 的默认数量
  - `sort`: 排序方式 `"hot"`（按热度，默认）或 `"time"`（按时间）
  - `include_replies`: 是否包含高赞回复（默认 `true`）

### 3. 视频转录 (`get_video_transcript`)
- 返回纯字幕文本，按行合并
- 支持指定偏好语言（默认按 `zh-Hans` > `ai-zh` > `zh-CN` > `zh-Hant` > `en` 优先级选择）
- 可选参数：
  - `preferred_lang`: 偏好字幕语言代码
  - `fallback_to_description`: 字幕不可用时是否降级为视频描述（默认 `false`）
- 默认不降级：无字幕时返回 `SUBTITLE_UNAVAILABLE` 错误
- Cookie 失效时始终返回 `COOKIE_EXPIRED`，不静默降级

### 4. 视频元数据 (`get_video_metadata`)
- 返回视频标题、作者、时长、发布时间、描述、标签、播放/点赞/投币等统计信息
- 不获取字幕或评论
- 仅需 `bvid_or_url` 参数

### 5. 行为说明与错误处理

- **Cookie 过期智能检测**：当字幕获取为空时自动验证登录状态，区分“无字幕视频”与“凭证失效”，并抛出明确的 `COOKIE_EXPIRED` 错误，避免静默降级。

#### 无 Cookie 行为

- 部分公开视频元数据（`get_video_metadata`）可能在未登录状态下工作。
- 字幕（`get_video_info`、`get_video_transcript`）在未登录时可能无法获取、不完整或返回空结果。
- 评论（`get_video_comments`）在未登录时可能不完整、被限流或返回空列表。
- 不建议依赖无 Cookie 模式获取字幕或评论。

#### Cookie 凭据来源

- Cookie 凭据应通过 `.env` 文件、环境变量或凭据管理工具提供。
- 支持的环境变量：`BILIBILI_SESSDATA`、`BILIBILI_BILI_JCT`、`BILIBILI_DEDEUSERID`。
- **切勿**在源码、脚本、文档、测试、日志或示例中硬编码 Cookie 值。
- 如果 Cookie 值曾出现在仓库历史中，应尽快到 Bilibili 账号设置中轮换/失效旧 Cookie。

#### 预期错误码

| 错误码 | 含义 | 调用方建议 |
|--------|------|-----------|
| `VALIDATION_ERROR` | 输入参数不合法 | 检查并修正 `bvid_or_url` 或其他参数 |
| `COOKIE_EXPIRED` | Cookie 已失效或未登录 | 用户应更新/轮换 Bilibili 凭据 |
| `SUBTITLE_UNAVAILABLE` | 视频无可用的字幕 | 对 `get_video_transcript` 可重试并设置 `fallback_to_description: true` |

## 📋 环境要求

- **Node.js**: v18.0.0 或更高版本
- Bilibili 账号凭证 (Cookie)

---

## 🚀 安装方式

### 推荐方式

| 场景 | 命令 |
|---|---|
| 临时运行 | `npx -y @xzxzzx/bilibili-mcp` |
| 全局安装 | `npm install -g @xzxzzx/bilibili-mcp` |
| 配置 Cookie | `bilibili-mcp config` |
| 检查配置 | `bilibili-mcp check` |

> [!NOTE]
> 不要在客户端配置文件中写入真实 Cookie。建议先用 `bilibili-mcp config` 或环境变量配置凭证，详见 [⚙️ 凭证配置](#️-凭证配置)。


### Claude Code

```bash
claude mcp add bilibili-mcp --command "npx" --args "-y" --args "@xzxzzx/bilibili-mcp"
```

或手动编辑 `~/.claude.json`，在 `mcpServers` 节点下添加与 Claude Desktop 相同的 JSON。

### Claude Desktop

打开 Settings → Developer → Edit Config，或直接编辑：

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

Settings → Features → MCP Servers → + Add New MCP Server：

- Type: `command`

- Command: `npx -y @xzxzzx/bilibili-mcp`

高级用户也可在项目根目录创建 `.cursor/mcp.json`。

### Windsurf

编辑 `~/.codeium/windsurf/mcp_config.json`：
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

编辑 `settings.json`，添加 `context_servers`：
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

或手动编辑 `~/.codex/config.toml`：
```toml
[mcp_servers.bilibili-mcp]
command = "npx"
args = ["-y", "@xzxzzx/bilibili-mcp"]
```

### Gemini CLI

编辑 `~/.gemini/settings.json`，在 `mcpServers` 下添加标准 command+args 配置。国内环境请确保已配置 HTTP_PROXY。

### Trae

Settings → AI → MCP → Add Server：

- Type: `command` (stdio)

- Command: `npx`

- Arguments: `["-y", "@xzxzzx/bilibili-mcp"\]

### Antigravity

侧边栏 → MCP Store → Manage MCP Servers → View raw config，或在以下路径手动编辑：

- Windows: `%USERPROFILE%\.gemini/antigravity\mcp_config.json`

- macOS/Linux: `~/.gemini/antigravity/mcp_config.json`

### OpenCode

编辑 `~/.config/opencode/opencode.json`：
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



## ⚙️ 凭证配置

为了稳定获取字幕、转录和评论，建议配置 Bilibili Cookie。公开视频元数据可能无需 Cookie，但不要依赖无 Cookie 模式获取字幕或评论。

### 推荐方式：CLI 向导

```bash
npm install -g @xzxzzx/bilibili-mcp
bilibili-mcp config
bilibili-mcp check
```

CLI 会把凭证保存在本地配置目录，不会写入仓库。

### 环境变量方式

适合 Docker、本地开发或手动配置 MCP 客户端环境变量。

| 变量名 | 说明 |
|---|---|
| `BILIBILI_SESSDATA` | Bilibili 登录 Cookie 中的 SESSDATA |
| `BILIBILI_BILI_JCT` | Bilibili 登录 Cookie 中的 bili_jct |
| `BILIBILI_DEDEUSERID` | Bilibili 用户 ID |

`.env` 示例：

```env
BILIBILI_SESSDATA=<your_sessdata>
BILIBILI_BILI_JCT=<your_bili_jct>
BILIBILI_DEDEUSERID=<your_dedeuserid>
```

### Cookie 获取提醒

请只从你自己的 Bilibili 登录会话中获取 Cookie。不同浏览器的开发者工具界面会变化，具体步骤请以浏览器实际界面为准。

不要把 Cookie 发给他人，不要粘贴到公开聊天、Issue、PR、README、日志或测试文件。

### 安全须知

- Cookie 只应保存在本地配置、环境变量或 `.env` 中。
- `.env` 已被 `.gitignore` 排除，但仍要避免提交。
- Cookie 泄露后应立即在 Bilibili 账号侧失效旧登录状态。
- 本项目不会把 Cookie 上传到除 Bilibili 官方 API 以外的第三方服务。

---

## 🧭 该用哪个工具？

| 目标 | 推荐工具 | 返回重点 |
|---|---|---|
| 想让 AI 总结一个视频 | `get_video_info` | 字幕优先；无字幕时返回标题、简介、标签 |
| 只想拿完整转录文本 | `get_video_transcript` | 纯字幕文本、语言、数据来源 |
| 想查看标题、作者、播放量等结构化信息 | `get_video_metadata` | 标题、作者、时长、发布时间、标签、统计数据 |
| 想看观众反馈和热门评论 | `get_video_comments` | 热门评论、时间戳评论、可选回复 |

## 💡 工具调用示例

> AI 客户端会自动将你的自然语言意图转换为对应的 JSON 调用。

### `get_video_transcript`

**适合**：需要把视频内容交给 AI 做摘要、笔记、问答或知识整理。

请求示例：

```json
{
  "name": "get_video_transcript",
  "arguments": {
    "bvid_or_url": "https://www.bilibili.com/video/BV1xx411c7mD",
    "preferred_lang": "zh-Hans",
    "fallback_to_description": false
  }
}
```

返回内容：`bvid`、`title`、`language`、`transcript`（按行合并）、`data_source`（`subtitle` 或 `description`）。

> 默认无字幕时返回 `SUBTITLE_UNAVAILABLE`。如需降级，设置 `fallback_to_description: true`。

### `get_video_metadata`

**适合**：想快速了解视频基本信息，不需要字幕或评论内容。

请求示例：

```json
{
  "name": "get_video_metadata",
  "arguments": {
    "bvid_or_url": "BV1xx411c7mD"
  }
}
```

返回内容：`bvid`、`title`、`author`、`duration`、`pubdate` / `pubdate_timestamp`、`description`、`tags` 和 `stats`（播放、点赞、投币、收藏、分享、评论、弹幕）。

### `get_video_info`

**适合**：让 AI 总结视频核心内容——会优先尝试字幕，无字幕时回退到简介和标签。

请求示例：

```json
{
  "name": "get_video_info",
  "arguments": {
    "bvid_or_url": "https://www.bilibili.com/video/BV1xx411c7mD",
    "preferred_lang": "zh-Hans"
  }
}
```

返回内容：`data_source`（`subtitle` 或 `description`）、`video_info`（标题、描述、标签、字幕文本、发布时间）。

> 无字幕视频会自动降级返回描述和标签（即 `data_source: "description"`）。

### `get_video_comments`

**适合**：想了解观众对视频的真实评价、找精彩时间点。

请求示例：

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

返回内容：`comments[]`（含 `author`、`content`、`likes`、`timestamp`、`has_timestamp`）、`summary`（总数和时间戳评论数）。

> Cookie 过期或未登录可能导致评论为空。`sort: "time"` 可获取最新评论，`include_replies: false` 不返回子回复。

---

## 🛡️ API 限流机制

为保证工具长效可用并合规调用底层接口，已内置以下限流策略：

- **请求间隔**：500ms（0.5秒）
- **执行方式**：加入队列顺序处理，禁止大并发请求。

---

## 🛠️ 开发指南

```bash
# 1. 克隆仓库
git clone https://github.com/365903728-oss/bilibili-mcp.git
cd bilibili-mcp

# 2. 安装依赖包
npm install

# 3. 启动监听与实时编译
npm run watch
```

本工具输出报错信息统一使用 `console.error`，以避免干扰 Stdio 协议数据。

---

## ⚖️ 安全性与免责声明

> **⚠️ 重要：使用本工具即代表您同意以下条款**

- **商标声明**：Bilibili (哔哩哔哩) 是哔哩哔哩公司的注册商标。本项目为基于公开协议的第三方开源辅助工具。
- **协议精神**：本项目**仅供个人学习、辅助阅读使用**。坚决抵制任何用于商业剥削、大规模滥用抓取等违规操作。
- **责任归属**：所有请求均为用户本地发起。开发者不对由于高频使用等原因导致的账号风控或其他后果负责。
- **隐私保护**：本工具严格保护用户隐私，所有凭证信息仅在本地加密/非加密存储，除与 Bilibili 官方接口通信外，无任何后台上传行为。

### 许可证

基于 **GNU General Public License v3.0** 开源。

---

## 🛠️ 开发过程

本项目是一个典型的 AI 协同开发的结晶，完整经历了从原型到完善的过程：

1.  **初版生成**：由 **Claude Code** (搭载 **GLM-4.7** 模型) 快速搭建核心架构与基础逻辑。
2.  **调试与优化**：在 **Antigravity** 环境下，利用 **Claude** 和 **Gemini** 模型进行深度的 Bug 修复与功能增强，确保了字幕提取与评论分析的稳定性。

---

## 💬 反馈与建议

如果您在使用过程中遇到任何问题，或者有好的功能建议，欢迎通过以下方式联系：

- **提交 Issue**：[GitHub Issues](https://github.com/365903728-oss/bilibili-mcp/issues) —— **推荐方式**，我会定期查看并回复。
- **项目讨论**：在 [GitHub Discussions](https://github.com/365903728-oss/bilibili-mcp/discussions)（如果已开启）中交流。

感谢您的支持！

