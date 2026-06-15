import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const toolSchemas: Tool[] = [
  {
    name: "get_credential_setup_instructions",
    description:
      "Return safe Bilibili Cookie setup instructions for users or installing agents. Call this after installing the MCP server if credentials are not configured. Never returns Cookie values.",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "check_bilibili_credentials",
    description:
      "Check whether Bilibili credentials are configured and logged in without exposing Cookie values. If missing or invalid, returns next_steps for setup.",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "get_video_info",
    description:
      "获取 Bilibili 视频信息，优先返回字幕内容，如无字幕则返回视频简介和标签。支持指定偏好语言。For credential help, call get_credential_setup_instructions.",
    inputSchema: {
      type: "object",
      properties: {
        bvid_or_url: {
          type: "string",
          description: "Bilibili 视频 BV 号或完整 URL",
        },
        preferred_lang: {
          type: "string",
          description:
            "可选参数，指定偏好字幕语言代码，如 'zh-Hans', 'zh-Hant', 'en' 等。默认按 zh-Hans -> zh-Hant -> en 顺序选择。",
        },
      },
      required: ["bvid_or_url"],
    },
  },
  {
    name: "get_video_comments",
    description:
      "获取 Bilibili 视频热门评论。过滤表情占位符，优先保留包含时间戳的评论（如 '05:20'）。支持 brief（10条）和 detailed（20条+回复）两种模式。For credential help, call get_credential_setup_instructions.",
    inputSchema: {
      type: "object",
      properties: {
        bvid_or_url: {
          type: "string",
          description: "Bilibili 视频 BV 号或完整 URL",
        },
        detail_level: {
          type: "string",
          description:
            "评论详细程度：'brief' 获取前10条热门评论；'detailed' 获取前20条热门评论及其高赞回复",
          enum: ["brief", "detailed"],
        },
        limit: {
          type: "number",
          description:
            "可选评论数量限制，整数 1-50。覆盖 detail_level 的默认数量。",
        },
        sort: {
          type: "string",
          enum: ["hot", "time"],
          description:
            "评论排序方式：'hot' 按热度，'time' 按时间。默认 'hot'。",
        },
        include_replies: {
          type: "boolean",
          description:
            "是否在 detailed 模式下包含高赞回复。默认 true。",
        },
      },
      required: ["bvid_or_url"],
    },
  },
  {
    name: "get_video_transcript",
    description:
      "获取 Bilibili 视频纯字幕文本（按行合并）。不自动降级到描述；仅在 fallback_to_description 为 true 且字幕不可用时返回视频描述。Requires Bilibili Cookie for reliable subtitle access. If unavailable, call get_credential_setup_instructions.",
    inputSchema: {
      type: "object",
      properties: {
        bvid_or_url: {
          type: "string",
          description: "Bilibili 视频 BV 号或完整 URL",
        },
        preferred_lang: {
          type: "string",
          description:
            "可选，指定偏好字幕语言代码，如 'zh-Hans', 'en' 等。",
        },
        fallback_to_description: {
          type: "boolean",
          description:
            "字幕不可用时是否降级为视频描述文本。默认 false。",
        },
      },
      required: ["bvid_or_url"],
    },
  },
  {
    name: "get_video_metadata",
    description:
      "获取 Bilibili 视频元数据（标题、作者、时长、发布日期、标签、统计信息等）。不获取字幕或评论。",
    inputSchema: {
      type: "object",
      properties: {
        bvid_or_url: {
          type: "string",
          description: "Bilibili 视频 BV 号或完整 URL",
        },
      },
      required: ["bvid_or_url"],
    },
  },
];
