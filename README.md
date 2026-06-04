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

- [Codex app / Codex CLI](#codex-app--codex-cli)
- [Claude Code](#claude-code)
- [OpenCode](#opencode)
- [Pi](#pi)
- [Oh My Pi](#oh-my-pi)
- [Crush](#crush)
- [DeepSeek-TUI](#deepseek-tui)
- [Deep Code](#deep-code)
- [Reasonix](#reasonix)
- [Langcli](#langcli)
- [GitHub Copilot CLI](#github-copilot-cli)
- [OpenClaw](#openclaw)
- [Hermes](#hermes)
- [Cursor](#cursor)
- [Cline](#cline)
- [Kilo Code](#kilo-code)
- [VS Code](#vs-code)
- [GitHub Copilot (VS Code)](#github-copilot-vs-code)
- [WorkBuddy](#workbuddy)
- [CodeBuddy](#codebuddy)
- [Trae SOLO CN](#trae-solo-cn)
- [Trae SOLO International](#trae-solo-international)
- [Trae CN](#trae-cn)
- [Trae International](#trae-international)
- [Claude Desktop](#claude-desktop)
- [Windsurf](#windsurf)
- [Zed](#zed)
- [Antigravity / Antigravity CLI](#antigravity--antigravity-cli)
- [Cherry Studio](#cherry-studio)
- [LobeHub / LobeChat](#lobehub--lobechat)
- [AstrBot](#astrbot)
- [nanobot](#nanobot)

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
- [🚀 客户端接入方式](#-客户端接入方式)
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

## 🚀 客户端接入方式

> [!NOTE]
> 不要在客户端配置文件中写入真实 Cookie。建议先用 `bilibili-mcp config` 或环境变量配置凭证，详见 [⚙️ 凭证配置](#️-凭证配置)。

### Codex app / Codex CLI

Codex app、Codex CLI 和 Codex IDE extension 共用 MCP 配置。优先使用下面任一方式添加：

#### Codex app

打开 Settings → Integrations & MCP，添加自定义 MCP server：

- Command: `npx`
- Arguments: `["-y", "@xzxzzx/bilibili-mcp"]`

#### Codex CLI

```bash
codex mcp add bilibili-mcp -- npx -y @xzxzzx/bilibili-mcp
```

配置后，在 Codex CLI TUI 中运行 `/mcp` 查看 server 状态。

#### 手动配置

也可以直接编辑 Codex 配置文件：

- 用户级：`~/.codex/config.toml`
- 项目级：`.codex/config.toml`（仅在 Codex 信任该项目时加载）

```toml
[mcp_servers.bilibili-mcp]
command = "npx"
args = ["-y", "@xzxzzx/bilibili-mcp"]
```

### Claude Code

```bash
claude mcp add bilibili-mcp -- npx -y @xzxzzx/bilibili-mcp
```

默认会作为当前项目的本地 MCP server 保存。配置后可在 Claude Code 中运行 `/mcp`，或在终端运行 `claude mcp list` 检查连接状态。

如果希望所有项目都可用，可使用用户级 scope：

```bash
claude mcp add --scope user bilibili-mcp -- npx -y @xzxzzx/bilibili-mcp
```

也可以手动编辑 `~/.claude.json`，在对应项目或用户配置下添加与 Claude Desktop 相同的 JSON。

### OpenCode

编辑 OpenCode 配置文件 `~/.config/opencode/opencode.json`，在 `mcp` 下添加本地 MCP server：

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

OpenCode 会把 MCP tools 加入可用工具上下文。使用时可在提示词中明确要求使用 `bilibili-mcp`。

### Pi

Pi 通过 `pi-mcp-adapter` 使用 MCP。先安装 adapter：

```bash
pi install npm:pi-mcp-adapter
```

重启 Pi 后，优先使用项目级共享配置：

```text
.mcp.json
```

添加：

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

也可以使用用户级共享配置：

```text
~/.config/mcp/mcp.json
```

Pi 还支持 Pi 专属覆盖文件：

- 全局：`~/.pi/agent/mcp.json`
- 项目级：`.pi/mcp.json`

如果你已经在 Cursor、Claude Code、Codex、Windsurf 等客户端里配置过 MCP，可在 Pi 中运行 `/mcp setup` 导入或生成配置；终端也可运行：

```bash
pi-mcp-adapter init
```

Pi 默认 lazy 连接 MCP server，只有实际调用工具时才启动。进入 Pi 后使用 `/mcp` 查看 server 状态和工具列表。不要在 Pi 的 MCP 配置里写真实 Cookie；凭证请用 `bilibili-mcp config` 或环境变量配置。

### Oh My Pi

Oh My Pi (`omp`) 原生支持 MCP，优先使用 OMP 专属配置文件：

- 项目级：`.omp/mcp.json`
- 用户级：`~/.omp/agent/mcp.json`

也可以使用可被其他 MCP client 复用的项目根配置：

- `mcp.json`
- `.mcp.json`

添加：

```json
{
  "$schema": "https://raw.githubusercontent.com/can1357/oh-my-pi/main/packages/coding-agent/src/config/mcp-schema.json",
  "mcpServers": {
    "bilibili-mcp": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@xzxzzx/bilibili-mcp"]
    }
  }
}
```

也可以在 OMP 会话中使用引导式配置：

```text
/mcp add
```

修改配置后使用：

```text
/mcp reload
/mcp list
/mcp test bilibili-mcp
```

OMP 支持 `stdio`、`http` 和 `sse` MCP。不要在 `env`、`args` 或配置文件中写真实 Cookie。

### Crush

Crush 支持项目级和用户级 JSON 配置，MCP server 写在 `mcp` 对象下。

配置优先级：

- 项目级：`.crush.json`
- 项目级：`crush.json`
- 用户级：`~/.config/crush/crush.json`

添加：

```json
{
  "$schema": "https://charm.land/crush.json",
  "mcp": {
    "bilibili-mcp": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@xzxzzx/bilibili-mcp"]
    }
  }
}
```

Crush 也支持 HTTP 和 SSE MCP。不要在 `env` 或 `args` 中写真实 Cookie；凭证请使用本项目的 CLI 向导或环境变量。

### DeepSeek-TUI

DeepSeek-TUI 同时是 MCP client 和 MCP server。作为 MCP client 时，可用 `deepseek mcp add` 添加本项目：

```bash
deepseek mcp add bilibili-mcp -- npx -y @xzxzzx/bilibili-mcp
```

也可以编辑：

```text
~/.deepseek/mcp.json
```

添加：

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

可用 `deepseek mcp list` 和 `deepseek mcp validate` 检查配置。DeepSeek-TUI 暴露的 MCP 工具通常以 `mcp_<server>_<tool>` 形式出现。

### Deep Code

Deep Code 使用 `~/.deepcode/settings.json` 配置 MCP server。把 `bilibili-mcp` 加到 `mcpServers`：

```json
{
  "mcpServers": {
    "bilibili-mcp": {
      "command": "npx",
      "args": ["@xzxzzx/bilibili-mcp"]
    }
  }
}
```

Deep Code 文档说明 `command` 为 `npx` 时会自动补充 `-y`。配置后启动 `deepcode`，输入 `/mcp` 查看 MCP server 状态和可用工具。

### Reasonix

Reasonix 支持原生 MCP。最简单的方式是启动时传入 `--mcp`：

```bash
npx reasonix code --mcp "bilibili=npx -y @xzxzzx/bilibili-mcp"
```

也可以编辑全局配置：

```text
~/.reasonix/config.json
```

在 `mcp` 数组中添加：

```json
{
  "mcp": [
    "bilibili=npx -y @xzxzzx/bilibili-mcp"
  ]
}
```

Reasonix 的格式是 `name=command arg1 arg2`。如果需要项目级覆盖，可放在项目的 `.reasonix/` 下。

### Langcli

Langcli 当前官方文档只明确提供内置 Chrome MCP 用法，没有找到可添加任意 stdio MCP server 的 `mcpServers` 或 CLI 配置方式。因此这里暂不提供 `bilibili-mcp` 接入配置，避免误导用户。

如果只需要使用 Langcli 的内置 Chrome MCP，可按官方文档启动：

```bash
langcli --chrome
```

然后在 Langcli 中输入：

```text
/mcp
```

在 MCP 面板里管理 `mcp-chrome`。等 Langcli 官方公开任意 MCP server 配置方式后，再补充本项目的 `npx -y @xzxzzx/bilibili-mcp` 接入示例。

### GitHub Copilot CLI

GitHub Copilot CLI 可在交互模式里使用 `/mcp add` 添加 MCP server。按表单选择 `STDIO` 或 `Local`，然后填入：

- Server Name: `bilibili-mcp`
- Command: `npx`
- Args: `-y @xzxzzx/bilibili-mcp`

也可以编辑用户级配置：

```text
~/.copilot/mcp-config.json
```

添加：

```json
{
  "mcpServers": {
    "bilibili-mcp": {
      "type": "local",
      "command": "npx",
      "args": ["-y", "@xzxzzx/bilibili-mcp"],
      "env": {},
      "tools": ["*"]
    }
  }
}
```

项目级配置可用 `.mcp.json` 或 `.github/mcp.json`，并且会优先于用户级同名 server。进入 Copilot CLI 后可用 `/mcp show` 查看状态。

### OpenClaw

使用 OpenClaw 的 MCP registry 注册本服务：

```bash
openclaw mcp set bilibili-mcp '{"command":"npx","args":["-y","@xzxzzx/bilibili-mcp"]}'
```

检查配置：

```bash
openclaw mcp list
openclaw mcp show bilibili-mcp
```

也可以在 OpenClaw 配置中加入同等结构：

```json
{
  "mcp": {
    "servers": {
      "bilibili-mcp": {
        "command": "npx",
        "args": ["-y", "@xzxzzx/bilibili-mcp"]
      }
    }
  }
}
```

`openclaw mcp set` 只写入 OpenClaw 的 MCP server 定义；具体运行时是否启用，取决于你的 OpenClaw agent/runtime 配置。

### Hermes

编辑 `~/.hermes/config.yaml`，在 `mcp_servers` 下添加：

```yaml
mcp_servers:
  bilibili-mcp:
    command: "npx"
    args: ["-y", "@xzxzzx/bilibili-mcp"]
```

如果你已经在运行 Hermes 会话，使用 `/reload-mcp` 重新加载 MCP 配置；也可以开启一个新的 Hermes 会话。

### Cursor

Cursor 编辑器和 Cursor CLI (`cursor-agent`) 共用同一套 `mcp.json` 配置。CLI 会自动读取编辑器已配置的 MCP server。

#### 方式一：Cursor 编辑器

在 Cursor 设置中打开 MCP / MCP Servers，添加自定义 stdio server；也可以直接编辑配置文件。

项目级配置：

```text
.cursor/mcp.json
```

全局配置：

```text
~/.cursor/mcp.json
```

配置内容：

```json
{
  "mcpServers": {
    "bilibili-mcp": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@xzxzzx/bilibili-mcp"]
    }
  }
}
```

#### 方式二：Cursor CLI

Cursor CLI 使用同一份 `mcp.json`，无需单独再写一份配置。可用下面命令检查：

```bash
cursor-agent mcp list
cursor-agent mcp list-tools bilibili-mcp
```

如果 MCP server 需要认证，Cursor CLI 使用：

```bash
cursor-agent mcp login bilibili-mcp
```

### Cline

Cline 支持本地 STDIO 和远程 MCP。编辑 Cline MCP 配置文件，加入：

```json
{
  "mcpServers": {
    "bilibili-mcp": {
      "command": "npx",
      "args": ["-y", "@xzxzzx/bilibili-mcp"],
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

Cline CLI 用户可用 JSON 方式查看或管理 MCP 设置：

```bash
cline config mcp --json
```

配置后在 Cline 的 MCP 面板确认 server 已启用。不要把真实 Cookie 写进 Cline 配置。

### Kilo Code

Kilo Code 的 MCP server 写在主配置文件的 `mcp` 对象下。

配置位置：

- 全局：`~/.config/kilo/kilo.jsonc`
- 项目级：`kilo.jsonc`
- 项目级：`.kilo/kilo.jsonc`

添加：

```jsonc
{
  "mcp": {
    "bilibili-mcp": {
      "type": "local",
      "command": ["npx", "-y", "@xzxzzx/bilibili-mcp"],
      "enabled": true,
      "timeout": 10000
    }
  }
}
```

也可以在 Kilo Code 设置 UI 中打开 Agent Behaviour → MCP Servers 添加。项目级配置优先于全局配置。

### VS Code

VS Code 原生支持 MCP 配置。工作区配置可通过命令面板打开：

```text
MCP: Open Workspace Folder MCP Configuration
```

这会创建或打开：

```text
.vscode/mcp.json
```

添加：

```json
{
  "servers": {
    "bilibili-mcp": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@xzxzzx/bilibili-mcp"]
    }
  }
}
```

用户级配置可用命令面板打开：

```text
MCP: Open User Configuration
```

VS Code MCP 还支持 HTTP、SSE、Windows named pipe 和 Unix socket。配置后可在 VS Code 的 MCP server 列表中启动、停止或查看 server 状态。使用本项目时不要把真实 Cookie 写进 `.vscode/mcp.json`。

### GitHub Copilot (VS Code)

GitHub Copilot Chat 在 VS Code 中读取 VS Code MCP 配置。工作区配置可写入：

```text
.vscode/mcp.json
```

添加：

```json
{
  "servers": {
    "bilibili-mcp": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@xzxzzx/bilibili-mcp"]
    }
  }
}
```

也可以用命令面板打开 `MCP: Open User Configuration` 配置全局 MCP。配置后在 Copilot Chat Agent Mode 中使用该 server 的工具。

### WorkBuddy

WorkBuddy 官方文档推荐通过界面配置 MCP。进入侧边栏 插件 → MCP 服务器 → 配置 MCP，然后添加：

```json
{
  "mcpServers": {
    "bilibili-mcp": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@xzxzzx/bilibili-mcp"]
    }
  }
}
```

也可以按作用域编辑配置文件：

- 用户级：`~/.workbuddy/mcp.json`
- 项目级：`<项目目录>/.workbuddy/mcp.json`

### CodeBuddy

#### 方式一：CodeBuddy CLI

CodeBuddy CLI 可以直接添加 stdio MCP server：

```bash
codebuddy mcp add --scope user bilibili-mcp -- npx -y @xzxzzx/bilibili-mcp
```

检查配置：

```bash
codebuddy mcp list
codebuddy mcp get bilibili-mcp
```

#### 方式二：CodeBuddy IDE

在 CodeBuddy IDE 侧栏对话面板右上角打开 CodeBuddy Settings → MCP → Add MCP，填入：

```json
{
  "mcpServers": {
    "bilibili-mcp": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@xzxzzx/bilibili-mcp"],
      "description": "Bilibili MCP server"
    }
  }
}
```

如果使用项目级 `.mcp.json`，请确认 CodeBuddy settings 允许启用该项目 MCP server。

### Trae SOLO CN

Trae SOLO CN 是 Trae 中国版的 SOLO 工作方式。官方公开文档没有给出独立于 Trae MCP 的专属配置文件；当前可按 Trae 项目级 MCP 配置接入，然后在 SOLO Coder 中使用。

在项目根目录创建 `.trae/mcp.json`：

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

然后在 Trae 的 MCP 管理面板中确认项目配置导入已启用，并在 SOLO Coder 中使用该 MCP server。

### Trae SOLO International

Trae SOLO International 已存在，官方 FAQ 说明国际版 SOLO 面向 Pro 用户。没有找到单独的 SOLO 专属 MCP JSON 格式；可使用 Trae International 的 MCP 配置方式，然后在 SOLO Coder / Builder with MCP 中调用。

项目级配置同样使用 `.trae/mcp.json`：

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

如果使用 Trae International 的 UI，打开 AI 对话窗口右上角 Settings → MCP，手动添加同等 `mcpServers` 配置。

### Trae CN

在 Trae CN 中打开 AI 对话窗口右上角设置入口，进入 MCP 配置；也可以直接编辑 MCP 配置文件。

常见配置路径：

- Windows: `%APPDATA%\Trae\User\settings\mcp.json`
- macOS: `~/Library/Application Support/Trae/User/settings/mcp.json`
- 项目级：`.trae/mcp.json`

添加：

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

如果你使用项目级 `.trae/mcp.json`，请在 Trae 的 MCP 管理面板中确认项目配置导入已启用。

### Trae International

在 Trae 国际版中打开 AI 对话窗口右上角 Settings → MCP，选择 Add 或手动配置 MCP server。

如果需要直接编辑项目级配置，可创建 `.trae/mcp.json`：

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

Trae 支持 stdio MCP server；本项目使用 `npx` 启动 stdio server。

### Claude Desktop

打开 Claude Desktop 的 Settings → Developer → Edit Config，或直接编辑：

- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`

添加：

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

保存后重启 Claude Desktop。该配置适合本地 stdio MCP server；不要在 `env`、`args` 或配置文件里写真实 Cookie。

### Windsurf

Windsurf 的 MCP 由 Cascade 使用。官方入口是 Cascade 面板右上角的 `MCPs` 图标，或 Windsurf Settings → Cascade → MCP Servers。

#### 方式一：Cascade / MCP Servers UI

打开 MCP Marketplace 或 MCP Servers 设置后，添加自定义 stdio MCP server：

- Command: `npx`
- Arguments: `["-y", "@xzxzzx/bilibili-mcp"]`

Windsurf 也支持 MCP deeplink；如果你在文档或网页中提供安装入口，可以使用 `windsurf://windsurf-mcp-registry?serverName=<server-name>` 打开对应 MCP registry 页面。

#### 方式二：Raw config

直接编辑：

```text
~/.codeium/windsurf/mcp_config.json
```

添加：

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

Windsurf/Cascade 支持 `stdio`、Streamable HTTP 和 SSE MCP。本项目使用本地 stdio server，因此不要把真实 Bilibili Cookie 写进该配置文件；凭证请用 `bilibili-mcp config` 或环境变量配置。

### Zed

Zed 使用 `context_servers` 配置 MCP，不使用 `mcpServers`。可以通过 Agent Panel 的 settings view 添加自定义 server，也可以直接编辑 `settings.json`。

#### 方式一：Agent Panel UI

打开 Agent Panel 的 Settings view，点击 Add Custom Server，填入本项目的 stdio server 配置。

配置后，在 Agent Panel 的 settings view 中查看 server 名称旁边的状态圆点；绿色表示 server active。

#### 方式二：settings.json

用户级设置可通过 Zed 的 `zed: open settings` 打开。项目级设置可写入：

```text
.zed/settings.json
```

添加：

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

#### 方式三：Zed extension

Zed 也支持以 extension 的方式安装 MCP server。通用自定义 server 用上面的 `context_servers` 更直接；如果未来本项目发布 Zed MCP extension，再改用 extension 安装。

Zed 支持 MCP Tools 和 Prompts，也支持远程 MCP；远程 server 使用 `url` 和可选 `headers`。本项目是本地 stdio server，不要在 Zed 配置里写真实 Bilibili Cookie。

### Antigravity / Antigravity CLI

Gemini CLI 已迁移到 Antigravity CLI。新的 MCP 配置不再写在 `~/.gemini/settings.json`，而是使用独立的 `mcp_config.json`。

Antigravity IDE 可通过 MCP Store → Manage MCP Servers → View raw config 打开配置；Antigravity CLI 可通过 `/mcp` 管理 MCP servers。

常见配置路径：

- Antigravity IDE：`~/.gemini/antigravity/mcp_config.json`
- Antigravity CLI 全局：`~/.gemini/antigravity-cli/mcp_config.json`
- Antigravity CLI 工作区：`.agents/mcp_config.json`

添加：

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

保存后重启 Antigravity / Antigravity CLI，或在 CLI 中使用 `/mcp` 检查 server 是否加载。

### Cherry Studio

Cherry Studio 在 Settings → MCP Server 中添加 MCP server。添加本项目时选择 `STDIO`：

- Name: `bilibili-mcp`
- Type: `STDIO`
- Command: `npx`
- Parameters: `-y @xzxzzx/bilibili-mcp`

保存后，Cherry Studio 会启动该 MCP server；在聊天窗口中启用对应 MCP server 后即可调用工具。

### LobeHub / LobeChat

LobeChat Desktop 支持导入 MCP server JSON。打开：

```text
Settings → Default Agent → Plugin Settings → Custom Plugins → Quick JSON Configuration Import
```

粘贴：

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

安装后，在对应 Agent 的插件设置中启用该 MCP server。不要把真实 Cookie 写进 LobeChat 配置；凭证请通过本项目 CLI 或环境变量配置。

### AstrBot

AstrBot 通过 WebUI 管理 MCP。先确保 AstrBot 运行环境可使用 `npm` 和 `node`，然后在 WebUI 的 MCP 服务器管理入口添加本地 MCP server：

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

如果 AstrBot 运行在 Docker 中，需要确保容器内已安装 Node.js / npm，且容器能访问运行 MCP server 所需的网络。

### nanobot

nanobot 的配置文件是：

```text
~/.nanobot/config.json
```

在 `tools.mcpServers` 下添加：

```json
{
  "tools": {
    "mcpServers": {
      "bilibili-mcp": {
        "command": "npx",
        "args": ["-y", "@xzxzzx/bilibili-mcp"]
      }
    }
  }
}
```

nanobot 的 MCP 配置兼容 Claude Desktop / Cursor 风格；也支持远程 MCP 的 `url` 和 `headers`。凭证仍应由本项目 CLI 或环境变量管理，不要写入 nanobot 配置。

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

