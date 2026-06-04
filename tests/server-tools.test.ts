import { beforeAll, describe, expect, it } from "vitest";

import { server } from "../src/server.js";

// server.ts registers the ListTools handler on import.
// Access the private handler store to invoke it directly.
function getListToolsResult() {
  const handlers = (server as any)._requestHandlers as Map<string, unknown>;
  const handlerEntry = handlers.get("tools/list");
  if (!handlerEntry) {
    throw new Error("tools/list handler not registered");
  }
  // The handler expects an MCP JSON-RPC request.
  // Pass a minimal valid request matching the schema.
  const fakeRequest = {
    method: "tools/list",
    jsonrpc: "2.0" as const,
    id: 1,
  };
  const handler = handlerEntry as (
    req: typeof fakeRequest,
  ) => Promise<{
    tools: Array<{ name: string; inputSchema: Record<string, unknown> }>;
  }>;
  return handler(fakeRequest);
}

let toolsResult: Awaited<ReturnType<typeof getListToolsResult>>;

describe("MCP tool list baseline", () => {
  beforeAll(async () => {
    toolsResult = await getListToolsResult();
  });
  it("exposes all 4 tools", () => {
    const names = toolsResult.tools.map((t) => t.name);
    expect(names).toContain("get_video_info");
    expect(names).toContain("get_video_comments");
    expect(names).toContain("get_video_transcript");
    expect(names).toContain("get_video_metadata");
  });

  describe("get_video_info schema", () => {
    let schema: { name: string; inputSchema: Record<string, unknown> };

    it("is registered", () => {
      schema = toolsResult.tools.find((t) => t.name === "get_video_info")!;
      expect(schema).toBeDefined();
    });

    it("requires bvid_or_url", () => {
      schema = toolsResult.tools.find((t) => t.name === "get_video_info")!;
      expect(schema.inputSchema.required).toContain("bvid_or_url");
    });

    it("accepts optional preferred_lang", () => {
      schema = toolsResult.tools.find((t) => t.name === "get_video_info")!;
      expect(schema.inputSchema.properties).toHaveProperty("preferred_lang");
    });
  });

  describe("get_video_comments schema", () => {
    let schema: { name: string; inputSchema: Record<string, unknown> };

    it("is registered", () => {
      schema = toolsResult.tools.find(
        (t) => t.name === "get_video_comments",
      )!;
      expect(schema).toBeDefined();
    });

    it("requires bvid_or_url", () => {
      schema = toolsResult.tools.find(
        (t) => t.name === "get_video_comments",
      )!;
      expect(schema.inputSchema.required).toContain("bvid_or_url");
    });

    it("accepts optional detail_level", () => {
      schema = toolsResult.tools.find(
        (t) => t.name === "get_video_comments",
      )!;
      expect(schema.inputSchema.properties).toHaveProperty("detail_level");
    });

    it("restricts detail_level to brief and detailed", () => {
      schema = toolsResult.tools.find(
        (t) => t.name === "get_video_comments",
      )!;
      const prop = schema.inputSchema.properties
        .detail_level as { enum?: string[] };
      expect(prop.enum).toEqual(["brief", "detailed"]);
    });

    it("accepts optional limit", () => {
      schema = toolsResult.tools.find(
        (t) => t.name === "get_video_comments",
      )!;
      expect(schema.inputSchema.properties).toHaveProperty("limit");
    });

    it("accepts optional sort with enum hot/time", () => {
      schema = toolsResult.tools.find(
        (t) => t.name === "get_video_comments",
      )!;
      const prop = schema.inputSchema.properties.sort as { enum?: string[] };
      expect(prop).toBeDefined();
      expect(prop.enum).toEqual(["hot", "time"]);
    });

    it("accepts optional include_replies (boolean)", () => {
      schema = toolsResult.tools.find(
        (t) => t.name === "get_video_comments",
      )!;
      const prop = schema.inputSchema.properties
        .include_replies as { type?: string };
      expect(prop).toBeDefined();
      expect(prop.type).toBe("boolean");
    });
  });

  describe("get_video_transcript schema", () => {
    let schema: { name: string; inputSchema: Record<string, unknown> };

    it("is registered", () => {
      schema = toolsResult.tools.find(
        (t) => t.name === "get_video_transcript",
      )!;
      expect(schema).toBeDefined();
    });

    it("requires bvid_or_url", () => {
      schema = toolsResult.tools.find(
        (t) => t.name === "get_video_transcript",
      )!;
      expect(schema.inputSchema.required).toContain("bvid_or_url");
    });

    it("accepts optional preferred_lang", () => {
      schema = toolsResult.tools.find(
        (t) => t.name === "get_video_transcript",
      )!;
      expect(schema.inputSchema.properties).toHaveProperty("preferred_lang");
    });

    it("accepts optional fallback_to_description (boolean)", () => {
      schema = toolsResult.tools.find(
        (t) => t.name === "get_video_transcript",
      )!;
      const prop = schema.inputSchema.properties
        .fallback_to_description as { type?: string };
      expect(prop).toBeDefined();
      expect(prop.type).toBe("boolean");
    });
  });

  describe("get_video_metadata schema", () => {
    let schema: { name: string; inputSchema: Record<string, unknown> };

    it("is registered", () => {
      schema = toolsResult.tools.find(
        (t) => t.name === "get_video_metadata",
      )!;
      expect(schema).toBeDefined();
    });

    it("requires bvid_or_url", () => {
      schema = toolsResult.tools.find(
        (t) => t.name === "get_video_metadata",
      )!;
      expect(schema.inputSchema.required).toContain("bvid_or_url");
    });
  });
});
