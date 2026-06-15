import { describe, expect, it, vi } from "vitest";

import { getMcpHandler } from "./helpers/mcp.js";

const mockGetVideoInfoWithSubtitle = vi.fn();

vi.mock("../src/bilibili/subtitle.js", () => ({
  getVideoInfoWithSubtitle: (...args: unknown[]) =>
    mockGetVideoInfoWithSubtitle(...args),
  getVideoTranscriptData: vi.fn(),
}));

vi.mock("../src/bilibili/metadata.js", () => ({
  getVideoMetadataData: vi.fn(),
}));

vi.mock("../src/bilibili/comments.js", () => ({
  getVideoCommentsData: vi.fn(),
}));

vi.mock("../src/bilibili/http.js", () => ({
  checkLoginStatus: vi.fn(async () => ({ isLogin: false })),
}));

const { BilibiliAPIError } = await import("../src/utils/errors.js");

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

describe("generic MCP error credential next_steps", () => {
  it("adds code and next_steps when a content tool throws COOKIE_EXPIRED", async () => {
    mockGetVideoInfoWithSubtitle.mockRejectedValueOnce(
      new BilibiliAPIError("Cookie expired", "COOKIE_EXPIRED"),
    );

    const handler = getCallToolHandler();
    const response = await handler({
      method: "tools/call",
      jsonrpc: "2.0",
      id: 1,
      params: {
        name: "get_video_info",
        arguments: { bvid_or_url: "BV1T6PQzQErF" },
      },
    });
    const payload = JSON.parse(response.content[0].text);

    expect(response.isError).toBe(true);
    expect(payload.code).toBe("COOKIE_EXPIRED");
    expect(payload.next_steps).toContain(
      "Run: npx -y @xzxzzx/bilibili-mcp config",
    );
  });
});
