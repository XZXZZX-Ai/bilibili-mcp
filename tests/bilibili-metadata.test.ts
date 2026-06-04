import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetVideoInfo = vi.fn();

vi.mock("../src/bilibili/video-api.js", () => ({
  getVideoInfo: (...args: unknown[]) => mockGetVideoInfo(...args),
}));

import { getVideoMetadataData } from "../src/bilibili/metadata.js";

function makeVideoData(overrides: Record<string, unknown> = {}) {
  return {
    title: "Test Video",
    desc: "Video description text",
    owner: { name: "AuthorName", face: "https://example.com/face.jpg" },
    stat: {
      view: 1000,
      danmaku: 50,
      reply: 20,
      favorite: 30,
      coin: 10,
      share: 5,
      like: 200,
    },
    cid: 12345,
    aid: 678,
    duration: 120,
    pubdate: 1716912000,
    tag: [{ tag_name: "AI" }, { tag_name: "Tech" }],
    ...overrides,
  };
}

beforeEach(() => {
  mockGetVideoInfo.mockReset();
  mockGetVideoInfo.mockResolvedValue(makeVideoData());
});

describe("getVideoMetadataData", () => {
  it("maps basic metadata: bvid, title, author, duration, description", async () => {
    const result = await getVideoMetadataData("BV1T6PQzQErF");

    expect(result.bvid).toBe("BV1T6PQzQErF");
    expect(result.title).toBe("Test Video");
    expect(result.author).toBe("AuthorName");
    expect(result.duration).toBe(120);
    expect(result.description).toBe("Video description text");
  });

  it("maps pubdate_timestamp and ISO pubdate", async () => {
    const result = await getVideoMetadataData("BV1T6PQzQErF");

    expect(result.pubdate_timestamp).toBe(1716912000);
    expect(result.pubdate).toBe("2024-05-28T16:00:00.000Z");
  });

  it("maps tags from tag array", async () => {
    const result = await getVideoMetadataData("BV1T6PQzQErF");

    expect(result.tags).toEqual(["AI", "Tech"]);
  });

  it("returns empty tags array when tag is missing", async () => {
    mockGetVideoInfo.mockResolvedValue(makeVideoData({ tag: undefined }));

    const result = await getVideoMetadataData("BV1T6PQzQErF");

    expect(result.tags).toEqual([]);
  });

  it("maps all stats fields", async () => {
    const result = await getVideoMetadataData("BV1T6PQzQErF");

    expect(result.stats.view).toBe(1000);
    expect(result.stats.like).toBe(200);
    expect(result.stats.coin).toBe(10);
    expect(result.stats.favorite).toBe(30);
    expect(result.stats.share).toBe(5);
    expect(result.stats.reply).toBe(20);
    expect(result.stats.danmaku).toBe(50);
  });

  it("accepts full Bilibili URL input", async () => {
    await getVideoMetadataData("https://www.bilibili.com/video/BV1T6PQzQErF/");

    expect(mockGetVideoInfo).toHaveBeenCalledWith("BV1T6PQzQErF");
  });

  it("returns empty description when desc is missing", async () => {
    mockGetVideoInfo.mockResolvedValue(makeVideoData({ desc: undefined }));

    const result = await getVideoMetadataData("BV1T6PQzQErF");

    expect(result.description).toBe("");
  });

  it("does not call subtitle or comment APIs", async () => {
    await getVideoMetadataData("BV1T6PQzQErF");

    // Only getVideoInfo should be called - no other imports from video-api
    expect(mockGetVideoInfo).toHaveBeenCalledTimes(1);
  });
});
