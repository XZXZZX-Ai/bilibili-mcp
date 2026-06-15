import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetVideoInfo = vi.fn();
const mockGetVideoSubtitle = vi.fn();
const mockGetSubtitleContent = vi.fn();
const mockCheckLoginStatus = vi.fn();

vi.mock("../src/bilibili/client.js", () => ({
  getVideoInfo: (...args: unknown[]) => mockGetVideoInfo(...args),
  getVideoSubtitle: (...args: unknown[]) => mockGetVideoSubtitle(...args),
  getSubtitleContent: (...args: unknown[]) => mockGetSubtitleContent(...args),
  checkLoginStatus: (...args: unknown[]) => mockCheckLoginStatus(...args),
}));

import { getVideoTranscriptData } from "../src/bilibili/subtitle.js";
import { BilibiliAPIError, NoSubtitleError } from "../src/utils/errors.js";

function makeFakeSubtitles(subs: Array<Record<string, unknown>>) {
  return {
    subtitle: { subtitles: subs },
  };
}

function makeFakeSubtitleContent(body: Array<{ from: number; to: number; content: string }>) {
  return { body };
}

beforeEach(() => {
  mockGetVideoInfo.mockReset();
  mockGetVideoSubtitle.mockReset();
  mockGetSubtitleContent.mockReset();
  mockCheckLoginStatus.mockReset();

  mockGetVideoInfo.mockResolvedValue({
    title: "Test Video",
    desc: "Video description text",
    cid: 12345,
  });

  mockGetVideoSubtitle.mockResolvedValue(
    makeFakeSubtitles([
      { id: 1, lan: "zh-Hans", lan_doc: "Chinese", subtitle_url: "//example.test/zh.json" },
      { id: 2, lan: "en", lan_doc: "English", subtitle_url: "//example.test/en.json" },
    ]),
  );

  mockGetSubtitleContent.mockResolvedValue(
    makeFakeSubtitleContent([
      { from: 0, to: 1, content: "Hello" },
      { from: 1, to: 2, content: "World" },
    ]),
  );
});

describe("getVideoTranscriptData - subtitle success", () => {
  it('returns data_source "subtitle"', async () => {
    const result = await getVideoTranscriptData("BV1T6PQzQErF");

    expect(result.data_source).toBe("subtitle");
  });

  it("returns merged transcript with newlines", async () => {
    const result = await getVideoTranscriptData("BV1T6PQzQErF");

    expect(result.transcript).toBe("Hello\nWorld");
  });

  it("returns title and bvid", async () => {
    const result = await getVideoTranscriptData("BV1T6PQzQErF");

    expect(result.title).toBe("Test Video");
    expect(result.bvid).toBe("BV1T6PQzQErF");
    expect(result.language).toBe("zh-Hans");
  });
});

describe("getVideoTranscriptData - language selection", () => {
  it("prefers explicit preferredLang match", async () => {
    await getVideoTranscriptData("BV1T6PQzQErF", "en");

    expect(mockGetSubtitleContent).toHaveBeenCalledWith("//example.test/en.json");
  });

  it("uses default priority: zh-Hans before en", async () => {
    // Remove zh-Hans from fake data to test priority
    mockGetVideoSubtitle.mockResolvedValue(
      makeFakeSubtitles([
        { id: 2, lan: "en", lan_doc: "English", subtitle_url: "//example.test/en.json" },
        { id: 3, lan: "ai-zh", lan_doc: "AI Chinese", subtitle_url: "//example.test/ai-zh.json" },
      ]),
    );

    await getVideoTranscriptData("BV1T6PQzQErF");

    // ai-zh has higher priority than en
    expect(mockGetSubtitleContent).toHaveBeenCalledWith("//example.test/ai-zh.json");
  });
});

describe("getVideoTranscriptData - fallback disabled (default)", () => {
  it("throws NoSubtitleError when subtitle list is empty", async () => {
    mockGetVideoSubtitle.mockResolvedValue(
      makeFakeSubtitles([]),
    );

    await expect(
      getVideoTranscriptData("BV1T6PQzQErF"),
    ).rejects.toThrow(NoSubtitleError);
  });

  it("throws NoSubtitleError when subtitle body is empty", async () => {
    mockGetSubtitleContent.mockResolvedValue(
      makeFakeSubtitleContent([]),
    );

    await expect(
      getVideoTranscriptData("BV1T6PQzQErF"),
    ).rejects.toThrow(NoSubtitleError);
  });

  it("rejects oversized merged subtitle text", async () => {
    mockGetSubtitleContent.mockResolvedValue(
      makeFakeSubtitleContent([
        { from: 0, to: 1, content: "x".repeat(500_001) },
      ]),
    );

    await expect(
      getVideoTranscriptData("BV1T6PQzQErF"),
    ).rejects.toThrow("Subtitle text exceeds maximum length");
  });

  it("rejects excessive subtitle body item counts", async () => {
    mockGetSubtitleContent.mockResolvedValue(
      makeFakeSubtitleContent(
        Array.from({ length: 5_001 }, (_, index) => ({
          from: index,
          to: index + 1,
          content: "x",
        })),
      ),
    );

    await expect(
      getVideoTranscriptData("BV1T6PQzQErF"),
    ).rejects.toThrow("Subtitle body item count exceeds maximum limit");
  });
});

describe("getVideoTranscriptData - fallback enabled", () => {
  it("returns description when subtitle list is empty", async () => {
    mockGetVideoSubtitle.mockResolvedValue(
      makeFakeSubtitles([]),
    );

    const result = await getVideoTranscriptData("BV1T6PQzQErF", undefined, true);

    expect(result.data_source).toBe("description");
    expect(result.transcript).toBe("Video description text");
    expect(result.title).toBe("Test Video");
  });

  it("returns description when subtitle body is empty", async () => {
    mockGetSubtitleContent.mockResolvedValue(
      makeFakeSubtitleContent([]),
    );

    const result = await getVideoTranscriptData("BV1T6PQzQErF", undefined, true);

    expect(result.data_source).toBe("description");
  });

  it("returns description on general fetch error", async () => {
    mockGetVideoSubtitle.mockRejectedValue(new Error("Network down"));

    const result = await getVideoTranscriptData("BV1T6PQzQErF", undefined, true);

    expect(result.data_source).toBe("description");
    expect(result.transcript).toBe("Video description text");
  });
});

describe("getVideoTranscriptData - COOKIE_EXPIRED propagation", () => {
  it("rethrows COOKIE_EXPIRED even when fallback is enabled", async () => {
    mockGetVideoSubtitle.mockRejectedValue(
      new BilibiliAPIError("Cookie expired", "COOKIE_EXPIRED"),
    );

    await expect(
      getVideoTranscriptData("BV1T6PQzQErF", undefined, true),
    ).rejects.toThrow(BilibiliAPIError);

    await expect(
      getVideoTranscriptData("BV1T6PQzQErF", undefined, true),
    ).rejects.toThrow("Cookie expired");
  });

  it("rethrows COOKIE_EXPIRED when fallback is disabled", async () => {
    mockGetVideoSubtitle.mockRejectedValue(
      new BilibiliAPIError("Cookie expired", "COOKIE_EXPIRED"),
    );

    await expect(
      getVideoTranscriptData("BV1T6PQzQErF"),
    ).rejects.toThrow(BilibiliAPIError);
  });
});
