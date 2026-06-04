// MCP 服务器定义
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { getVideoInfoWithSubtitle, getVideoTranscriptData } from "./bilibili/subtitle.js";
import { getVideoMetadataData } from "./bilibili/metadata.js";
import { getVideoCommentsData } from "./bilibili/comments.js";
import { getPreferredLanguage, isValidLanguage } from "./config.js";
import {
  validateBVInput,
  validateLanguage,
  validateDetailLevel,
  validateCommentLimit,
  validateCommentSort,
} from "./utils/validation.js";
import { sanitizeBVInput } from "./utils/sanitization.js";
import { BilibiliAPIError, NoSubtitleError } from "./utils/errors.js";

// 创建 MCP 服务器实例
export const server = new Server(
  {
    name: "bilibili-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// 注册工具列表处理器
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_video_info",
        description:
          "获取 Bilibili 视频信息，优先返回字幕内容，如无字幕则返回视频简介和标签。支持指定偏好语言。",
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
          "获取 Bilibili 视频热门评论。过滤表情占位符，优先保留包含时间戳的评论（如 '05:20'）。支持 brief（10条）和 detailed（20条+回复）两种模式。",
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
          "获取 Bilibili 视频纯字幕文本（按行合并）。不自动降级到描述；仅在 fallback_to_description 为 true 且字幕不可用时返回视频描述。",
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
    ],
  };
});

// 注册工具调用处理器
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "get_video_info": {
        const bvidOrUrl = args?.bvid_or_url as string;
        const preferredLang = args?.preferred_lang as string | undefined;

        // 输入验证
        try {
          validateBVInput(bvidOrUrl);
          validateLanguage(preferredLang);
          // 清理输入
          const sanitizedInput = sanitizeBVInput(bvidOrUrl);
        } catch (error) {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                error: true,
                message: error instanceof Error ? error.message : "Invalid input",
                code: "VALIDATION_ERROR"
              }, null, 2)
            }],
            isError: true
          };
        }

        // 验证并规范化语言参数
        const normalizedLang = getPreferredLanguage(preferredLang);

        const result = await getVideoInfoWithSubtitle(bvidOrUrl, normalizedLang);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "get_video_comments": {
        const bvidOrUrl = args?.bvid_or_url as string;
        const detailLevel = (args?.detail_level as "brief" | "detailed") || "brief";
        const limit = args?.limit as number | undefined;
        const sort = args?.sort as "hot" | "time" | undefined;
        const includeReplies = args?.include_replies as boolean | undefined;

        // 输入验证
        try {
          validateBVInput(bvidOrUrl);
          validateDetailLevel(detailLevel);
          if (limit !== undefined) validateCommentLimit(limit);
          if (sort !== undefined) validateCommentSort(sort);
          if (includeReplies !== undefined && typeof includeReplies !== "boolean") {
            throw new Error("include_replies must be a boolean");
          }
          // 清理输入
          const sanitizedInput = sanitizeBVInput(bvidOrUrl);
        } catch (error) {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                error: true,
                message: error instanceof Error ? error.message : "Invalid input",
                code: "VALIDATION_ERROR"
              }, null, 2)
            }],
            isError: true
          };
        }

        const result = await getVideoCommentsData(bvidOrUrl, {
          detailLevel,
          limit,
          sort,
          includeReplies,
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "get_video_transcript": {
        const bvidOrUrl = args?.bvid_or_url as string;
        const preferredLang = args?.preferred_lang as string | undefined;
        const fallbackToDescription = (args?.fallback_to_description as boolean) || false;

        // 输入验证
        try {
          validateBVInput(bvidOrUrl);
          validateLanguage(preferredLang);
          if (args?.fallback_to_description !== undefined && typeof args.fallback_to_description !== "boolean") {
            throw new Error("fallback_to_description must be a boolean");
          }
          const sanitizedInput = sanitizeBVInput(bvidOrUrl);
        } catch (error) {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                error: true,
                message: error instanceof Error ? error.message : "Invalid input",
                code: "VALIDATION_ERROR"
              }, null, 2)
            }],
            isError: true
          };
        }

        const normalizedLang = getPreferredLanguage(preferredLang);

        try {
          const result = await getVideoTranscriptData(bvidOrUrl, normalizedLang, fallbackToDescription);
          return {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
          };
        } catch (error) {
          if (error instanceof NoSubtitleError) {
            return {
              content: [{
                type: "text",
                text: JSON.stringify({
                  error: true,
                  message: error.message,
                  code: "SUBTITLE_UNAVAILABLE"
                }, null, 2)
              }],
              isError: true
            };
          }
          if (error instanceof BilibiliAPIError && error.code === "COOKIE_EXPIRED") {
            return {
              content: [{
                type: "text",
                text: JSON.stringify({
                  error: true,
                  message: error.message,
                  code: "COOKIE_EXPIRED"
                }, null, 2)
              }],
              isError: true
            };
          }
          throw error;
        }
      }

      case "get_video_metadata": {
        const bvidOrUrl = args?.bvid_or_url as string;

        // 输入验证
        try {
          validateBVInput(bvidOrUrl);
          const sanitizedInput = sanitizeBVInput(bvidOrUrl);
        } catch (error) {
          return {
            content: [{
              type: "text",
              text: JSON.stringify({
                error: true,
                message: error instanceof Error ? error.message : "Invalid input",
                code: "VALIDATION_ERROR"
              }, null, 2)
            }],
            isError: true
          };
        }

        const result = await getVideoMetadataData(bvidOrUrl);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    console.error(`Error processing tool ${name}:`, error);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              error: true,
              message: error instanceof Error ? error.message : "Unknown error",
            },
            null,
            2
          ),
        },
      ],
      isError: true,
    };
  }
});
