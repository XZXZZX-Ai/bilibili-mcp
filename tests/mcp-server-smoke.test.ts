import { spawn } from "node:child_process";
import { execSync } from "node:child_process";
import { beforeAll, describe, expect, it } from "vitest";

import { getMcpHandler } from "./helpers/mcp.js";

type ListToolsRequest = {
  method: "tools/list";
  jsonrpc: "2.0";
  id: number;
};

type ListToolsResponse = {
  tools: Array<{ name: string }>;
};

describe("MCP stdio entrypoint", () => {
  beforeAll(() => {
    execSync("npm run build", { stdio: "pipe" });
  });

  it("starts the built stdio server and logs startup to stderr", async () => {
    const child = spawn(process.execPath, ["dist/index.js"], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    const stderrChunks: Buffer[] = [];
    const stdoutChunks: Buffer[] = [];

    child.stderr.on("data", (chunk) => {
      stderrChunks.push(Buffer.from(chunk));
    });
    child.stdout.on("data", (chunk) => {
      stdoutChunks.push(Buffer.from(chunk));
    });

    await new Promise((resolve) => setTimeout(resolve, 300));
    child.kill();

    const stderr = Buffer.concat(stderrChunks).toString("utf8");
    const stdout = Buffer.concat(stdoutChunks).toString("utf8");

    expect(stderr).toContain("Bilibili MCP server running on stdio");
    expect(stdout).toBe("");
  });

  it("lists all public tools through the registered MCP handler", async () => {
    const handler = getMcpHandler<ListToolsRequest, ListToolsResponse>(
      "tools/list",
    );

    const result = await handler({
      method: "tools/list",
      jsonrpc: "2.0",
      id: 1,
    });

    expect(result.tools.map((tool) => tool.name)).toEqual([
      "get_credential_setup_instructions",
      "check_bilibili_credentials",
      "check_mcp_update",
      "get_video_info",
      "get_video_comments",
      "get_video_transcript",
      "get_video_metadata",
    ]);
  });
});
