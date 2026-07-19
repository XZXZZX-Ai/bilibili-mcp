# Bilibili MCP 功能机会研究

## Research Topic

- Topic: 现有 7 个 MCP tools 之后，下一批高价值功能机会
- Date: 2026-07-20
- Owner: Codex
- Related task, PRD, ticket, or plan: 用户功能灵感探索；尚无 PRD 或 Issue
- Refresh before: 立项前，或 Bilibili 网页接口 / MCP SDK 版本变化后

## Question

在不改变项目“读取 Bilibili 视频内容”的核心定位下，哪些新功能最值得做？重点比较用户价值、当前 7 个 tools 的空白、最小 MVP，以及 Bilibili API、凭据、限流和隐私风险。

## Evidence Boundary

本笔记只使用以下一手来源：MCP 官方规范与官方 TypeScript SDK、Bilibili 官方网页与 Bilibili 域名上的实时 API 响应、本项目 live GitHub README / Issues / 源码。

重要限制：Bilibili 确有[开放平台](https://openhome.bilibili.com/doc)，但其公开入口描述的是需完成身份/应用审核、账号授权后使用的视频管理和数据开放能力；没有找到本项目正在使用的 `/x/web-interface/*`、`/x/player/*`、`/x/v2/reply/*` 等消费者网页接口的公开、稳定官方契约。因此，下文对这些接口的判断来自 2026-07-20 的 Bilibili 一手实时响应，而不是官方保证；字段、鉴权和风控都可能变化。[开发者服务协议](https://openhome.bilibili.com/agreement/developer-service)也说明 API 权限和技术材料属于开放平台服务范围。

## Current Baseline

项目目前暴露 7 个 tools：3 个辅助工具（凭据配置说明、凭据状态、版本检查）和 4 个内容工具（单视频信息/字幕、评论、纯转录、元数据）。权威清单见项目 [`tool-schemas.ts`](https://github.com/XZXZZX-Ai/bilibili-mcp/blob/master/src/server/tool-schemas.ts) 与 [README 功能表](https://github.com/XZXZZX-Ai/bilibili-mcp#-mcp-tools-reference)。截至检查时，[GitHub open issues](https://github.com/XZXZZX-Ai/bilibili-mcp/issues?q=is%3Aissue%20is%3Aopen) 为 0；现有 Issues 主要记录已完成的稳定性修复。

当前主要空白：

- 转录被合并成纯文本，字幕原有的 `from` / `to` 时间信息没有对外返回；见 [`subtitle.ts`](https://github.com/XZXZZX-Ai/bilibili-mcp/blob/master/src/bilibili/subtitle.ts)。
- 视频信息路径只使用顶层 `cid`，没有让用户选择或遍历多 P 的 `pages[].cid`；见 [`video-api.ts`](https://github.com/XZXZZX-Ai/bilibili-mcp/blob/master/src/bilibili/video-api.ts)。
- 已调用的 player 响应只被当作字幕列表使用，没有暴露章节 `view_points`。
- 没有弹幕、相关推荐或 MCP resources；server 只声明 `tools` capability，见 [`server.ts`](https://github.com/XZXZZX-Ai/bilibili-mcp/blob/master/src/server.ts)。

## Sources

| Source | Type | Date checked | Notes |
|---|---|---:|---|
| [MCP Tools specification](https://modelcontextprotocol.io/specification/2025-06-18/server/tools) | official specification | 2026-07-20 | tools、structured content、output schema、resource links |
| [MCP Resources specification](https://modelcontextprotocol.io/specification/2025-06-18/server/resources) | official specification | 2026-07-20 | resources 是 application-driven 的只读上下文 |
| [MCP Prompts specification](https://modelcontextprotocol.io/specification/2025-06-18/server/prompts) | official specification | 2026-07-20 | prompts 是用户显式选择的模板 |
| [Official TypeScript SDK v1 server guide](https://github.com/modelcontextprotocol/typescript-sdk/blob/v1.x/docs/server.md) | official SDK source | 2026-07-20 | 当前项目使用 SDK v1；官方仓库说明 v1.x 仍是生产推荐线，并支持 tools/resources/prompts |
| [Bilibili 开放平台](https://openhome.bilibili.com/doc) | official docs | 2026-07-20 | 官方 API 体系需要身份、应用与授权；不是当前网页接口的公开契约 |
| [多 P 官方视频页](https://www.bilibili.com/video/BV1Fq4y1A7BN/) / [实时 view 响应](https://api.bilibili.com/x/web-interface/view?bvid=BV1Fq4y1A7BN) | official page / first-party response | 2026-07-20 | `code: 0`；`pages` 有 19 项，每项含 `cid,page,part,duration` |
| [章节示例官方视频页](https://www.bilibili.com/video/BV1vL411G7N7/) / [实时 player 响应](https://api.bilibili.com/x/player/v2?bvid=BV1vL411G7N7&cid=427178148) | official page / first-party response | 2026-07-20 | `code: 0`；`view_points` 有 6 项；同一响应也包含 subtitle |
| [实时相关推荐响应](https://api.bilibili.com/x/web-interface/archive/related?bvid=BV1vL411G7N7) | first-party response | 2026-07-20 | `code: 0`；返回 40 项，含 bvid/title/owner/stat/rcmd_reason 等字段 |
| [实时弹幕 XML](https://comment.bilibili.com/427178148.xml) | first-party response | 2026-07-20 | HTTP 200、`text/xml`、含带时间参数的 `<d>` 元素 |

## Ranked Opportunities

### 1. 带时间戳的转录、区间读取与命中搜索

- **用户价值：很高。** 用户可以问“12:30 到 15:00 讲了什么”“找到提到某概念的位置”，并生成可回看的视频定位，而不是把最长 50 万字符整段塞给模型。
- **与现有 tools 的差距：** `get_video_transcript` 丢弃已有字幕段的 `from` / `to`，只返回合并文本。
- **最小 MVP：** 不新增上游请求；给现有转录 tool 增加可选 `format: text | segments`、`start_seconds`、`end_seconds`、`query`，返回命中的有限段数及 `from/to/content`。默认仍为 `text`，保持兼容。
- **复用点：** 直接复用当前 `getSubtitleContent()` 返回的 body、语言选择、验证、缓存与凭据错误。
- **风险：** API/限流风险几乎不增加；字幕仍可能需要 Cookie。需限制 query 长度、结果段数和输出总量。字幕文本属于视频内容，避免落盘或日志记录全文。
- **判断：** 最优先；它是“已有数据没有被用完”，不是新爬虫面。

### 2. 多 P 视频的分集列表与指定分集转录

- **用户价值：很高。** 教程、课程、录播合集常以一个 BV 号承载多个分集；当前只取顶层 `cid`，用户无法明确选择 P2/P19，也无法安全概览整套课程。
- **与现有 tools 的差距：** 现有 4 个内容 tools 都围绕单个顶层视频/cid。实时一手响应显示 `pages` 可提供每 P 的 `cid,page,part,duration`。
- **最小 MVP：** 先给 `get_video_metadata` 返回 `pages`；给 `get_video_transcript` 增加可选 `page`（正整数），只处理一个分集。暂不做“自动抓完 19 P”。
- **复用点：** 仍使用同一个 `/x/web-interface/view` 响应与现有字幕管线，只改 cid 选择。
- **风险：** 指定单 P 不增加元数据请求，字幕请求量与现在相同；批量全抓会线性增加请求和输出，故不应进入 MVP。不同 P 可能各自无字幕；Cookie、区域/付费限制继续适用。不要把私人/付费合集批量持久化。
- **判断：** 第二优先；真实缺口明确，改动边界也清楚。

### 3. 视频章节（进度条分段）

- **用户价值：高。** 可直接得到创作者/平台提供的章节标题和时间范围，用于摘要目录、跳转和按章节提问；比模型猜章节可靠。
- **与现有 tools 的差距：** 项目已经调用 player v2 获取字幕，但没有返回同一响应里的 `view_points`。实时示例得到 6 个章节。
- **最小 MVP：** 在 `get_video_metadata` 增加可选 `chapters` 字段，或增加 `include_chapters` 开关；只映射标题、起止秒数等稳定必要字段。没有章节时返回空数组，不推断章节。
- **复用点：** 在字幕场景可复用现有 player 响应；纯 metadata 场景若要章节则需额外一次 player 请求。
- **风险：** 不是所有视频都有章节；字段属于未公开网页接口，可能漂移。若 metadata 默认获取，会无条件增加一次请求，因此 MVP 应显式 opt-in，遵守已有 500ms admission interval。没有明显新增隐私风险。
- **判断：** 第三优先；低复杂度、结构化价值高，但覆盖率有限。

### 4. 时间轴弹幕读取与聚合

- **用户价值：中高。** 弹幕比评论更贴近具体播放时刻，可找“高能点”、即时纠错和群体反应，是 Bilibili 特有信号。
- **与现有 tools 的差距：** 当前只支持评论；实时 Bilibili XML 响应包含时间参数和弹幕文本。
- **最小 MVP：** 新增只读 `get_video_danmaku`，要求一个 BVID/页码，限制最多 100 条；支持时间区间和 `hotspots`（按固定时间桶计数），默认只返回匿名文本、秒数和模式，不返回用户哈希或内部标识。
- **复用点：** 复用 BVID/cid 解析、HTTP 限流、超时、重试和输出上限。
- **风险：高于前三项。** XML 接口无公开契约且大视频响应可能很大；必须流量/字节/条数上限。弹幕是用户生成内容，含骚扰、个人信息和提示注入；不得把发送者标识、哈希或完整原始 XML写入日志/缓存。若实现可靠 XML 解析，可能需要审慎评估依赖；不要用脆弱正则解析任意 XML。
- **判断：** 值得做，但应在前三项稳定后再立项。

### 5. 相关推荐发现

- **用户价值：中。** 支持围绕一个视频继续找同主题内容、对比多个 UP 主观点；当前项目只能读取用户已经知道的 BV 号。
- **与现有 tools 的差距：** 没有 search/discovery。实时相关推荐接口返回 40 项及推荐理由等字段。
- **最小 MVP：** `get_related_videos(bvid, limit<=10)`，只返回 BVID、标题、作者、时长、基础统计和推荐理由；不自动获取每个视频的字幕/评论。
- **复用点：** BVID 验证、HTTP wrapper、缓存和结构化错误。
- **风险：** 推荐结果会变化，可能个性化或含不适内容；接口无公开契约。一次列表请求风险可控，但自动深挖每项会形成爬取放大器，应明确禁止。无需额外返回用户凭据；不要声称结果是稳定、完整或中立的搜索结果。
- **判断：** 可作为轻量探索功能，但与项目“提取已知视频内容”的核心定位相比优先级稍低。

### 6. MCP 原生 transcript resource + 结构化输出

- **用户价值：中（集成价值高）。** MCP 官方区分 model-controlled tools 与 application-controlled resources；把 `bilibili://video/{bvid}/transcript` 暴露为只读 resource，可让支持 resources 的 host 主动附加上下文。现有 tools 还可加 `outputSchema` / `structuredContent`，减少客户端解析 JSON 文本的不确定性；官方 tools 规范要求 structured result 与 output schema 一致，并建议为兼容同时保留序列化文本。
- **与现有 tools 的差距：** 当前 server 只声明 tools，所有结果走文本 content。
- **最小 MVP：** 先只做一个动态 transcript resource，内部调用现有转录函数；不加远程 HTTP transport、不加数据库、不加订阅。随后逐个为高价值 tool 补 output schema，而不是一次重写全 server。
- **复用点：** 官方 SDK v1 已支持 resources/prompts；业务逻辑完全复用现有函数。
- **风险：** 客户端 resources 支持和 UI 可见性不一致，收益需用目标客户端实测；resource URI 参数仍是不可信输入，必须走现有 BVID/语言验证。resource 读取同样可能携带 Cookie 发起 Bilibili 请求，不能把 Cookie 放进 URI 或结果。迁移 server API 的兼容成本可能高于功能代码本身。
- **判断：** 适合做兼容性增强，不应抢在用户可感知的前三项之前。

## Recommended Order

1. **带时间戳的转录、区间读取与搜索**：零新增上游面，立即解决长视频上下文浪费。
2. **多 P 选择**：修复真实内容模型缺口，MVP 只取单 P，避免批量抓取。
3. **章节**：复用已有 player 数据，给摘要和定位提供创作者定义的结构。
4. 弹幕（需单独隐私/提示注入/响应体上限设计）。
5. 相关推荐（保持单次列表，禁止自动递归抓取）。
6. MCP resource / structured output（先验证目标客户端支持）。

前三项可组合成一个克制的“可导航转录”主题：先列出多 P 和章节，再按分集、章节、时间区间读取字幕。它们共享现有数据路径，但应拆成独立小票，分别验证，避免一次改动所有 tool schema。

## Explicit Non-Recommendations

- **暂不做整套合集一键总结。** 客户端已经可以按页调用；服务端自动遍历会放大请求、限流、上下文和付费内容风险。
- **暂不做点赞、投币、收藏、关注等写操作。** 当前定位是只读提取；写操作需要 CSRF、明确用户确认、更强凭据和审计，价值不足以抵消风险。
- **暂不做 server 内置 LLM 总结。** MCP host 已有模型；引入模型供应商配置会重复能力并增加成本、隐私和密钥管理。
- **暂不做创作者私有数据/收藏夹同步。** 官方开放平台存在授权体系，但需要应用审核与用户授权，显著扩张产品和隐私边界。

## Risks And Unknowns

- Bilibili 消费者网页接口没有找到公开稳定契约；任何新 endpoint 都要有 schema 防御、响应大小限制、结构化错误和降级策略。
- Cookie 只应继续来自现有环境变量/本地凭据文件；不得进入 tool/resource 参数、日志、测试或缓存键。
- 用户生成内容（字幕、评论、弹幕）既可能含个人信息，也可能含针对模型的提示注入；结果应标记为不可信内容，不得解释为 server 指令。
- 现有全局 500ms 请求起始间隔可作为最低保护，但批量能力仍需显式数量上限与顺序执行。
- MCP resources 和 structured output 的实际用户体验取决于客户端实现；立项前至少用项目文档覆盖的 2 个主流客户端做 live smoke test。

## Follow-Up

- [ ] 用户从前三项中选一个方向。
- [ ] 对选中方向运行 `product-requirements` / Matt `grill-with-docs`，明确兼容行为和验收标准。
- [ ] 创建一个 GitHub Issue 作为任务票；未经用户确认不创建。
