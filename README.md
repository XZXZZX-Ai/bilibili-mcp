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

```bash
# 直接运行
npx -y @xzxzzx/bilibili-mcp

# Claude Code 一键添加
claude mcp add bilibili-mcp --command "npx" --args "-y" --args "@xzxzzx/bilibili-mcp"
```

<details><summary><b>Claude Desktop 配置</b></summary>

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

更多客户端配置见 [安装方式](#-安装方式)。

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

### 客户端配置速查

所有客户端使用同一核心配置：`command: npx`，`args: ["-y", "@xzxzzx/bilibili-mcp"]`。

| 客户端 | 接入方式 | 配置路径 / 命令 |
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
> 不要在客户端配置文件中写入真实 Cookie。Cookie 配置见 [⚙️ 凭证配置](#️-凭证配置)。

<details><summary><b>展开查看各客户端详细配置</b></summary>

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

</details>

## ⚙️ 凭证配置

为了获取更完整的评论数据、绕过匿名访问限制并确保工具稳定运行，**必须**配置 B 站 Cookie。

### 🔑 第一步：获取 Bilibili Cookie

1. 在电脑浏览器登录 [bilibili.com](https://www.bilibili.com)
2. 按 `F12` 打开开发者工具（或在页面右键选择“检查”）。
3. 切换到 **Application (应用)** 选项卡 -> 在左侧菜单找到 **Cookies** -> 点击 `https://www.bilibili.com`。
4. 在右侧列表中找到以下三个关键变量，并记录它们的 **Value**：
    - `SESSDATA`
    - `bili_jct` (即 CSRF Token)
    - `DedeUserID` (您的用户数字 ID)

> [!TIP]
> 如果您在 `Application` 找不到，也可以查看 `Network` (网络) 选项卡中的任意一个请求，在 `Headers` -> `Cookie` 字段中也能找到这些值。

### 📝 第二步：应用凭证

您可以针对不同的使用习惯选择以下任一方式：

#### 方式 A：使用 CLI 向导（推荐，适用于全局安装）
如果您全局安装了 npm 包（`npm i -g @xzxzzx/bilibili-mcp`），直接运行：
```bash
bilibili-mcp config
```
交互向导将引导您输入凭证并安全保存在**本地**配置目录（`~/.bilibili-mcp/config.json`）中。

#### 方式 B：手动配置环境变量（适用于本地开发或 Docker）
在项目根目录创建 `.env` 文件，手动填入以下变量：

| 变量名 | 说明 |
| :--- | :--- |
| **BILIBILI_SESSDATA** | `SESSDATA` 的值 |
| **BILIBILI_BILI_JCT** | `bili_jct` 的值 |
| **BILIBILI_DEDEUSERID** | `DedeUserID` 的值 |

> [!WARNING]
> `.env` 文件仅供本地加载，**切勿提交到 Git 或公开仓库**。

#### 🔒 安全须知

- **隐私保护**：您的凭证信息仅存储在您的本地设备上。本工具**绝不会**将其上传至除 Bilibili 官方 API 以外的任何第三方服务器。
- **配置隔离**：`.env` 文件已被 `.gitignore` 排除。
- **时效性**：Cookie 具有时效性。若遇到 `412` 或权限错误，请尝试更新 Cookie。

---

## 💡 工具调用示例

在支持 MCP 的对话流中，你可以直接输入自然语言，底层会自动调用对应的 JSON 格式配置：

```json
// 获取默认语言视频信息
{
  "name": "get_video_info",
  "arguments": { "bvid_or_url": "BV1xx4x1x7xx" }
}

// 获取 10 条简短评估
{
  "name": "get_video_comments",
  "arguments": { "bvid_or_url": "BV1xx4x1x7xx", "detail_level": "brief" }
}

// 获取纯字幕文本（无字幕时返回错误）
{
  "name": "get_video_transcript",
  "arguments": { "bvid_or_url": "BV1xx4x1x7xx" }
}

// 获取视频元数据
{
  "name": "get_video_metadata",
  "arguments": { "bvid_or_url": "BV1xx4x1x7xx" }
}

// 获取评论（自定义数量+排序）
{
  "name": "get_video_comments",
  "arguments": { "bvid_or_url": "BV1xx4x1x7xx", "limit": 5, "sort": "time", "include_replies": false }
}
```

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

