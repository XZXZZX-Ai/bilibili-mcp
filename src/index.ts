// MCP 服务器入口
import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { server } from "./server.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { redactSecrets } from "./utils/logger.js";

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 尝试加载.env文件
const envPath = resolve(__dirname, "../.env");
try {
  config({ path: envPath });
} catch (e) {
  // .env is optional
}

// 供 Smithery 沙盒反射使用的纯净实例导出
// 绝不能在这里执行任何副作用
export default server;

// 启动服务器的入口点
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Bilibili MCP server running on stdio");
}

// 检查是否作为主模块运行
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((error) => {
    console.error("Fatal error:", redactSecrets(error));
    process.exit(1);
  });
}
