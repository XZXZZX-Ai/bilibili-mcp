import fs from "fs";
import { afterEach, describe, expect, it, vi } from "vitest";

import { getMcpHandler } from "./helpers/mcp.js";
import { credentialManager } from "../src/utils/credentials.js";

function hideGlobalCredentialConfig() {
  vi.spyOn(fs, "existsSync").mockReturnValue(false);
}

function getCallToolHandler() {
  return getMcpHandler<
    {
      method: "tools/call";
      jsonrpc: "2.0";
      id: number;
      params: { name: string; arguments?: Record<string, unknown> };
    },
    {
      content: Array<{ type: string; text: string }>;
      isError?: boolean;
    }
  >("tools/call");
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
    vi.restoreAllMocks();
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
      "npx -y @xzxzzx/bilibili-mcp@latest config",
    );
    expect(JSON.stringify(payload)).not.toContain("SESSDATA=");
  });

  it("returns safe credential status when credentials are missing", async () => {
    hideGlobalCredentialConfig();

    const response = await callTool("check_bilibili_credentials");
    const payload = JSON.parse(response.content[0].text);

    expect(response.isError).toBeUndefined();
    expect(payload.configured).toBe(false);
    expect(payload.source).toBe("none");
    expect(payload.logged_in).toBe(false);
    expect(payload.next_steps).toContain(
      "Run: npx -y @xzxzzx/bilibili-mcp@latest config",
    );
  });
});

describe("credential next_steps in error payloads", () => {
  it("credential setup instructions include the exact next_steps used by errors", async () => {
    const response = await callTool("get_credential_setup_instructions");
    const payload = JSON.parse(response.content[0].text);

    expect(payload.recommended_commands).toEqual([
      "npx -y @xzxzzx/bilibili-mcp@latest config",
      "npx -y @xzxzzx/bilibili-mcp@latest check",
    ]);
  });
});

describe("package update MCP tool", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns safe @latest update guidance", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => ({ version: "9.9.9" }),
      })),
    );

    const response = await callTool("check_mcp_update");
    const payload = JSON.parse(response.content[0].text);

    expect(response.isError).toBeUndefined();
    expect(payload.latest_version).toBe("9.9.9");
    expect(payload.update_available).toBe(true);
    expect(payload.recommended_mcp_config.args).toEqual([
      "-y",
      "@xzxzzx/bilibili-mcp@latest",
    ]);
    expect(JSON.stringify(payload)).not.toContain("SESSDATA=");
  });
});
