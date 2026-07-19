# 更新日志 (Changelog)

所有关于 **Bilibili MCP Server** 的显著更改都将记录在此文件中。

---

## [1.6.4] - 2026-07-20

### 修复
- 并发 HTTP 请求现在按配置间隔依次获得启动时机，同时仍允许响应体处理重叠。
- 空字幕列表会统一验证登录状态；瞬时字幕失败产生的简介降级结果不再进入缓存。
- 评论缓存键包含详细程度与显式数量，移除重复元数据请求，并通过有界分页兑现 `limit: 1-50`。
- 登录状态、字幕和 WBI 请求保留 HTTP 状态以正确区分可重试错误；补齐传输错误归一化与请求计时器清理。
- MCP stdio 启动测试改为等待实际 ready 信号，消除固定 300ms 延迟造成的偶发失败。

### 安全
- 将间接依赖 Hono 从 4.12.23 更新至 4.12.31，清除生产依赖审计中的高危告警。

### 验证
- 通过 20 个 Vitest 文件中的 180 项测试、TypeScript 构建、npm 生产依赖审计、package dry-run、MCP stdio smoke 与凭据模式扫描。

---

## [1.6.3] - 2026-06-19

### 修复
- 补齐结构化错误响应依赖的中英文凭据操作建议 helper，修复 v1.6.2 发布工作流在干净 checkout 中测试失败的问题。
- 补齐 MCP 更新检查响应的 `notes_en` / `notes_zh` 字段实现与测试，使发布包行为与 README 文档一致。

### 验证
- 重新通过完整 Vitest 测试、TypeScript 构建、npm package dry-run 和等价 MCP stdio smoke。

---

## [1.6.1] - 2026-06-18

### 文档
- 中文 README 补充 `@latest` MCP 配置、全局安装更新和 `bilibili-mcp check-update` 的明确说明。
- 英文 README 的 agent 安装引导补充 `check_mcp_update`。
- 英文工具选择表补充 `check_mcp_update`，并补充中英文工具调用示例。

---

## [1.6.0] - 2026-06-18

### 新增
- 新增 `check_mcp_update` MCP 工具，用于安全返回本地包版本、npm latest 版本、是否需要更新，以及推荐更新命令。
- 新增 `bilibili-mcp check-update` CLI 命令，用于在终端检查包版本新鲜度。

### 改进
- MCP 客户端接入示例统一优先使用 `npx -y @xzxzzx/bilibili-mcp@latest`，让新会话解析 npm latest 版本。
- 凭证配置引导和凭证相关错误的 next steps 改为使用 `@latest` 包规格。
- README 状态说明更新为 7 个 MCP 工具、145 个单元测试。

### 测试
- 新增包更新引导测试，并更新 MCP 工具列表契约测试以覆盖新的公开工具。

---

## [1.4.1] - 2026-06-04

### 🔧 改进 (Changed)
- README 重构：优化首屏快速开始、AI 客户端接入指南、工具调用示例的可读性

## [1.4.0] - 2026-06-04

### 🚀 新增 (Added)
- **两个新 MCP 工具**：
  - `get_video_transcript`：返回纯字幕文本，默认不降级到视频描述；字幕不可用时返回 `SUBTITLE_UNAVAILABLE` 错误。
  - `get_video_metadata`：返回标题、作者、时长、发布日期、描述、标签和统计信息，不获取字幕或评论。
- `get_video_comments` 扩展参数：`limit`（1-50）、`sort`（hot/time）、`include_replies`（boolean），旧调用方式仍兼容。

### 🔧 改进 (Changed)
- **安全加固**：保留 Cookie 型字幕获取能力，同时明确凭据应来自环境变量或凭据管理工具；发布包、文档、测试和示例不包含真实 Cookie 值。
- **包入口修正**：`package.json` 的 `main`/`module`/`types` 均指向 `dist` 构建产物。
- **Smithery 移除**：删除 `smithery.json`、`smithery.yaml`、`@smithery/cli` 依赖及相关脚本。
- **Bilibili 模块拆分**：将大型 `client.ts` 拆分为 `http.ts`、`wbi.ts`、`fingerprint.ts`、`video-api.ts`、`comments-api.ts` 等聚焦模块，保持公共 API 兼容。
- 字幕 fallback、WBI 签名和 buvid 指纹行为不变。

### 🧪 测试 (Tests)
- 引入 Vitest 测试基线：110 个单元测试，覆盖验证工具、BVID、输入清洗、字幕 fallback、评论 wrapper、MCP schema 和 API 行为。
- 测试不依赖真实网络、Cookie 或外部 API。

### 📝 文档 (Docs)
- README 更新：记录全部 4 个工具、新评论参数、no-cookie/Cookie-backed 行为、错误码和标准降级策略。

## [1.3.7] - 2026-03-09

### 🚀 新增 (Added)
- **Cookie 过期智能检测机制**：当字幕接口返回空列表时，工具会先调用 `/x/web-interface/nav` 核实当前登录状态，再决定是否触发 `COOKIE_EXPIRED` 错误。
  - 若**已登录**但视频无字幕 → 正常降级为简介（合法现象）
  - 若**未登录**（Cookie 过期）→ 抛出明确的错误，拒绝静默降级，方便用户和 AI 快速定位问题
- *安全提示*：错误信息仅包含状态说明，**严格脱敏，绝不泄露真实 Cookie 内容**。


---

## [1.3.5] - 2026-03-08
- 初始稳定版本，支持基础视频信息与评论抓取。
