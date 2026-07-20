# Research Note: Bilibili MCP Feature Opportunities

## Research Topic

- Topic: Next user-facing capabilities for `@xzxzzx/bilibili-mcp`
- Date: 2026-07-20
- Owner: Codex
- Related task, PRD, ticket, or plan: feature inspiration only; no implementation approved
- Refresh before: selecting or specifying the next MCP tool

## Question

Which recurring Bilibili tasks are not covered by the current eight-tool read-only server, and which candidates fit its safety, maintenance, and token-efficiency boundaries?

## Context

The current project already covers credentials, package updates, video info, transcript, metadata, Chapters, and comments. The useful next feature should extend the user journey instead of duplicating summarization that the MCP client can already perform.

## Sources

| Source | Type | Date checked | Notes |
|---|---|---|---|
| [34892002/bilibili-mcp-js `index.ts`](https://github.com/34892002/bilibili-mcp-js/blob/main/index.ts) and [`src/index.ts`](https://github.com/34892002/bilibili-mcp-js/blob/main/src/index.ts) | live source | 2026-07-20 | Implements search, hot content, video detail, user videos, and bangumi timeline. Search is the repository's primary product focus. |
| [adoresever/bilibili-mcp `mcp_server.py`](https://github.com/adoresever/bilibili-mcp/blob/main/mcp_server.py) | live source | 2026-07-20 | Implements search, comments, subtitles, danmaku, creator videos, favorites, rankings, and multiple write operations. |
| [huccihuang/bilibili-mcp-server `bilibili.py`](https://github.com/huccihuang/bilibili-mcp-server/blob/main/bilibili.py) | live source | 2026-07-20 | Implements general/user search and video danmaku. |
| [222wcnm/BiliStalkerMCP `server.py`](https://github.com/222wcnm/BiliStalkerMCP/blob/main/bili_stalker_mcp/server.py) | live source | 2026-07-20 | Implements creator videos, dynamics, articles, comments, replies, and followings. |
| [`src/server/tool-schemas.ts`](../../src/server/tool-schemas.ts) | local source | 2026-07-20 | Authoritative current eight-tool surface and parameter overlap. |

## Findings

### Repeated external patterns

- Search/discovery appears in three inspected servers and is the main purpose of one of them. This is evidence that agents often need to find a video before extracting it; it is not proof that any particular undocumented web endpoint is stable.
- Danmaku retrieval appears in two inspected servers. It fills a Bilibili-specific audience-reaction gap that ordinary comments do not cover because danmaku is aligned to playback time.
- Creator video lists appear in three inspected servers. This enables channel/course exploration but overlaps with the broader search/discovery domain.
- Articles, dynamics, favorites, rankings, and bangumi schedules are viable expansions, but they broaden the product from video understanding into general Bilibili account/content access.
- Commenting, uploading, posting dynamics, and private messaging exist in one inspected server. These are poor fits for this project's current read-only, credential-minimizing safety boundary.

### Local-fit inference

- **Inference:** transcript keyword search with bounded context is the lowest-risk improvement. It can reuse the existing subtitle fetch, timestamp model, cache, and validation without depending on a new Bilibili endpoint.
- **Inference:** video search is the largest user-journey improvement, but it should be isolated behind bounded pagination and defensive parsing because the inspected implementations use Bilibili web-facing APIs rather than a project-controlled contract.
- **Inference:** danmaku should require `limit`, optional time range, and compact output. Returning an entire danmaku stream would create token and rate-limit problems.

## Ranked Opportunities

| Rank | Candidate | User value | Effort | External API risk | Judgment |
|---:|---|---|---|---|---|
| 1 | Transcript keyword search with timestamped context | High | Low | Low | Best next bounded feature; extend the existing transcript path rather than add a parallel fetcher. |
| 2 | `search_bilibili_videos` with bounded results | Very high | Medium | Medium/High | Best discovery feature; prototype and verify endpoint behavior before committing to a public contract. |
| 3 | `get_video_danmaku` with limit/time/query filters | High | Medium | Medium | Strong Bilibili-specific differentiator; compactness is mandatory. |
| 4 | Creator/series video navigation | Medium/High | Medium | Medium/High | Useful for courses and channels; add after search so concepts and pagination are not duplicated. |
| 5 | Explicit comment-thread retrieval | Medium | Medium | Medium | Useful for deep audience analysis, but current detailed comments already cover top replies. |
| 6 | Article/dynamic reading | Medium | High | High | A legitimate later product expansion, not a small extension of video understanding. |

## Do Not Prioritize

- In-server AI summaries, sentiment models, or embeddings: the MCP client already owns reasoning; adding model/API configuration would duplicate it.
- Video/audio download or automatic ASR: binary transfer, copyright, compute, and dependency costs are disproportionate for the core package.
- Automatic Cookie refresh, QR login, posting comments, uploads, dynamics, private messages, favorites, or follow actions: higher credential and irreversible-side-effect risk.
- One large `bilibili_everything` tool: weak routing, unpredictable response size, and an unstable public contract.

## Recommendation

Start with transcript keyword search as a small extension of `get_video_transcript`. Treat search and danmaku as separate product candidates requiring a short requirements pass and live endpoint probes. Preserve the server's read-only boundary.

## Limitations

- GitHub repositories show implemented behavior, not guaranteed endpoint stability or representative user demand.
- Bilibili web-facing APIs may change or trigger risk controls; each external-endpoint feature needs current live verification before specification.
- No real Cookie, write operation, or high-volume endpoint test was run for this inspiration pass.
