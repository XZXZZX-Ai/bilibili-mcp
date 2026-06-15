// MCP 服务器定义
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { redactSecrets } from "./utils/logger.js";
import { toolSchemas } from "./server/tool-schemas.js";
import { handleToolCall } from "./server/tool-handlers.js";
import {
  buildGenericErrorPayload,
  toErrorTextContent,
} from "./server/error-response.js";

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
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: toolSchemas,
}));

// 注册工具调用处理器
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    return await handleToolCall(
      name,
      args as Record<string, unknown> | undefined,
    );
  } catch (error) {
    console.error(`Error processing tool ${name}:`, redactSecrets(error));
    return toErrorTextContent(buildGenericErrorPayload(error));
  }
});
