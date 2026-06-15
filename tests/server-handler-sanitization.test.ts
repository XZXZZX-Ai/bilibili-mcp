import { describe, expect, it, vi } from "vitest";

import { getMcpHandler } from "./helpers/mcp.js";

const mockGetVideoMetadataData = vi.fn();

vi.mock("../src/bilibili/subtitle.js", () => ({
  getVideoInfoWithSubtitle: vi.fn(),
  getVideoTranscriptData: vi.fn(),
}));

vi.mock("../src/bilibili/metadata.js", () => ({
  getVideoMetadataData: (...args: unknown[]) => mockGetVideoMetadataData(...args),
}));

vi.mock("../src/bilibili/comments.js", () => ({
  getVideoCommentsData: vi.fn(),
}));

vi.mock("../src/bilibili/http.js", () => ({
  checkLoginStatus: vi.fn(async () => ({ isLogin: false })),
}));

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

describe("server handler input sanitization", () => {
  it("passes sanitized input to metadata handler", async () => {
    mockGetVideoMetadataData.mockResolvedValueOnce({ bvid: "BV1T6PQzQErF" });

    const handler = getCallToolHandler();
    await handler({
      method: "tools/call",
      jsonrpc: "2.0",
      id: 1,
      params: {
        name: "get_video_metadata",
        arguments: {
          bvid_or_url: "  https://www.bilibili.com/video/BV1T6PQzQErF/?spm_id_from=333.999.0.0  ",
        },
      },
    });

    expect(mockGetVideoMetadataData).toHaveBeenCalledWith(
      "https://www.bilibili.com/video/BV1T6PQzQErF/?spm_id_from=333.999.0.0",
    );
  });
});
