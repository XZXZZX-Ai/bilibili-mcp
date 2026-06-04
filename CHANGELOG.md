# 更新日志 (Changelog)

所有关于 **Bilibili MCP Server** 的显著更改都将记录在此文件中。

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
