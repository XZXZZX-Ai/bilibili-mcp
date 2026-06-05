import { afterEach, describe, expect, it } from "vitest";

import { server } from "../src/server.js";
import { credentialManager } from "../src/utils/credentials.js";

function getCallToolHandler() {
  const handlers = (server as any)._requestHandlers as Map<string, unknown>;
  const handlerEntry = handlers.get("tools/call");
  if (!handlerEntry) {
    throw new Error("tools/call handler not registered");
  }
  return handlerEntry as (request: {
    method: "tools/call";
    jsonrpc: "2.0";
    id: number;
    params: { name: string; arguments?: Record<string, unknown> };
  }) => Promise<{
    content: Array<{ type: string; text: string }>;
    isError?: boolean;
  }>;
}

async function callTool(name: string) {
  const handler = getCallToolHandler();
  return handler({
    method: "tools/call",
    jsonrpc: "2.0",
    id: 1,
    params: { name, arguments: {} },
  });
}

describe("credential MCP tools", () => {
  afterEach(() => {
    credentialManager.clearCredentials();
    delete process.env.BILIBILI_SESSDATA;
    delete process.env.BILIBILI_BILI_JCT;
    delete process.env.BILIBILI_DEDEUSERID;
  });

  it("returns setup instructions as JSON text", async () => {
    const response = await callTool("get_credential_setup_instructions");
    const payload = JSON.parse(response.content[0].text);

    expect(response.isError).toBeUndefined();
    expect(payload.recommended_commands).toContain(
      "npx -y @xzxzzx/bilibili-mcp config",
    );
    expect(JSON.stringify(payload)).not.toContain("SESSDATA=");
  });

  it("returns safe credential status when credentials are missing", async () => {
    const response = await callTool("check_bilibili_credentials");
    const payload = JSON.parse(response.content[0].text);

    expect(response.isError).toBeUndefined();
    expect(payload.configured).toBe(false);
    expect(payload.source).toBe("none");
    expect(payload.logged_in).toBe(false);
    expect(payload.next_steps).toContain(
      "Run: npx -y @xzxzzx/bilibili-mcp config",
    );
  });
});

describe("credential next_steps in error payloads", () => {
  it("credential setup instructions include the exact next_steps used by errors", async () => {
    const response = await callTool("get_credential_setup_instructions");
    const payload = JSON.parse(response.content[0].text);

    expect(payload.recommended_commands).toEqual([
      "npx -y @xzxzzx/bilibili-mcp config",
      "npx -y @xzxzzx/bilibili-mcp check",
    ]);
  });
});
