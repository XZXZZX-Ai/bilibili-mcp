import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetVideoInfo = vi.fn();
const mockGetVideoSubtitle = vi.fn();
const mockGetSubtitleContent = vi.fn();
const mockGetPlayerData = vi.fn();
const mockCheckLoginStatus = vi.fn();

vi.mock("../src/bilibili/video-api.js", () => ({
  getVideoInfo: (...args: unknown[]) => mockGetVideoInfo(...args),
  getVideoSubtitle: (...args: unknown[]) => mockGetVideoSubtitle(...args),
  getSubtitleContent: (...args: unknown[]) => mockGetSubtitleContent(...args),
  getPlayerData: (...args: unknown[]) => mockGetPlayerData(...args),
}));

vi.mock("../src/bilibili/http.js", () => ({
  checkLoginStatus: (...args: unknown[]) => mockCheckLoginStatus(...args),
  fetchWithWBI: vi.fn(),
  fetchWithoutWBI: vi.fn(),
}));

import { getVideoMetadataData } from "../src/bilibili/metadata.js";
import {
  getVideoInfoWithSubtitle,
  getVideoTranscriptData,
} from "../src/bilibili/subtitle.js";
import { getVideoChaptersData } from "../src/bilibili/chapters.js";
import { cacheManager } from "../src/utils/cache.js";

function makeVideoData(overrides: Record<string, unknown> = {}) {
  return {
    title: "Test Video",
    desc: "Description",
    cid: 999,
    owner: { name: "Author", face: "" },
    stat: { view: 1, danmaku: 0, reply: 0, favorite: 0, coin: 0, share: 0, like: 0 },
    duration: 100,
    pubdate: 1716912000,
    tag: [],
    ...overrides,
  };
}

beforeEach(() => {
  cacheManager.clear();
  mockGetVideoInfo.mockReset();
  mockGetVideoSubtitle.mockReset();
  mockGetSubtitleContent.mockReset();
  mockGetPlayerData.mockReset();
  mockCheckLoginStatus.mockReset();

  mockGetVideoInfo.mockResolvedValue(makeVideoData());
  mockGetVideoSubtitle.mockResolvedValue({
    subtitle: { subtitles: [{ id: 1, lan: "zh-Hans", lan_doc: "Chinese", subtitle_url: "//a.test/zh.json" }] },
  });
  mockGetSubtitleContent.mockResolvedValue({ body: [{ from: 0, to: 1, content: "Hi" }] });
  mockCheckLoginStatus.mockResolvedValue({ isLogin: true });
});

describe("request counts", () => {
  it("metadata makes exactly 1 getVideoInfo request with no extra view call", async () => {
    await getVideoMetadataData("BV1T6PQzQErF");

    // One getVideoInfo for metadata, one inside resolvePartCid — but resolvePartCid
    // receives preFetchedVideoData so only the top-level call fires.
    expect(mockGetVideoInfo).toHaveBeenCalledTimes(1);
  });

  it("transcript makes exactly 1 getVideoInfo request with no extra view call", async () => {
    await getVideoTranscriptData("BV1T6PQzQErF");

    // resolvePartCid calls getVideoInfo exactly once; subtitle uses the returned videoData
    expect(mockGetVideoInfo).toHaveBeenCalledTimes(1);
  });

  it("video-info makes exactly 1 getVideoInfo request with no extra view call", async () => {
    await getVideoInfoWithSubtitle("BV1T6PQzQErF");

    expect(mockGetVideoInfo).toHaveBeenCalledTimes(1);
  });

  it("video-info cache hit makes zero network requests on second call", async () => {
    await getVideoInfoWithSubtitle("BV1T6PQzQErF");

    // Clear ALL mocks after first call — cache hit must prevent every request
    mockGetVideoInfo.mockClear();
    mockGetVideoSubtitle.mockClear();
    mockGetSubtitleContent.mockClear();

    await getVideoInfoWithSubtitle("BV1T6PQzQErF");

    expect(mockGetVideoInfo).not.toHaveBeenCalled();
    expect(mockGetVideoSubtitle).not.toHaveBeenCalled();
    expect(mockGetSubtitleContent).not.toHaveBeenCalled();
  });

  it("chapters makes 1 view + 1 player request (no extra view)", async () => {
    mockGetPlayerData.mockResolvedValue({});

    await getVideoChaptersData("BV1T6PQzQErF");

    expect(mockGetVideoInfo).toHaveBeenCalledTimes(1);
    expect(mockGetPlayerData).toHaveBeenCalledTimes(1);
  });

  it("transcript search mode adds zero extra requests", async () => {
    mockGetSubtitleContent.mockResolvedValue({
      body: [
        { from: 0, to: 1, content: "hello" },
        { from: 1, to: 2, content: "world" },
      ],
    });

    await getVideoTranscriptData(
      "BV1T6PQzQErF",
      undefined,
      false,
      undefined,
      false,
      undefined,
      undefined,
      { query: "hello", max_matches: 10, context_segments: 1 },
    );

    // resolvePartCid calls getVideoInfo exactly once
    expect(mockGetVideoInfo).toHaveBeenCalledTimes(1);
    // No extra subtitle/content fetch beyond the single call
    expect(mockGetVideoSubtitle).toHaveBeenCalledTimes(1);
    expect(mockGetSubtitleContent).toHaveBeenCalledTimes(1);
  });

  it("transcript with page makes exactly 1 getVideoInfo request", async () => {
    mockGetVideoInfo.mockResolvedValue(
      makeVideoData({
        pages: [
          { cid: 100, page: 1, part: "P1", duration: 60 },
          { cid: 200, page: 2, part: "P2", duration: 60 },
        ],
      }),
    );

    await getVideoTranscriptData("BV1T6PQzQErF", undefined, false, 2);

    expect(mockGetVideoInfo).toHaveBeenCalledTimes(1);
  });
});
