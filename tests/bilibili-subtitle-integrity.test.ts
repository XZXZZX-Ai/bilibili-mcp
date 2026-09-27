import { beforeEach, describe, expect, it, vi } from "vitest";
import { assessAiSubtitleIntegrity, trustedPartDurationSeconds } from "../src/bilibili/subtitle-integrity.js";
import type { SubtitleBodyItem } from "../src/bilibili/types.js";

const mockGetVideoSubtitle = vi.fn();
const mockGetSubtitleContent = vi.fn();
const mockCheckLoginStatus = vi.fn();
const mockResolvePartCid = vi.fn();

vi.mock("../src/bilibili/client.js", () => ({
  getVideoInfo: vi.fn(),
  getVideoSubtitle: (...args: unknown[]) => mockGetVideoSubtitle(...args),
  getSubtitleContent: (...args: unknown[]) => mockGetSubtitleContent(...args),
  checkLoginStatus: (...args: unknown[]) => mockCheckLoginStatus(...args),
  matchPartIdentity: (cid: number, pages: Array<{ cid: number; page: number; title: string }>, fallback: string) => {
    const match = pages.find((p) => p.cid === cid);
    return match ? { page: match.page, title: match.title } : { page: 1, title: fallback };
  },
  resolvePartCid: (...args: unknown[]) => mockResolvePartCid(...args),
}));

import { getVideoInfoWithSubtitle } from "../src/bilibili/subtitle.js";
import { cacheManager } from "../src/utils/cache.js";

function body(pairs: Array<[number, number, string]>): SubtitleBodyItem[] {
  return pairs.map(([from, to, content]) => ({ from, to, content }));
}

describe("assessAiSubtitleIntegrity duration sentinel (issue #80)", () => {
  const twoReads = (b: SubtitleBodyItem[]) => [b, b] as const;

  it("rejects AI subtitle whose last segment extends beyond video duration + slack", () => {
    // 串台案例：156s 视频配 12min+ 的字幕（圣杯战争拿到的炸鸡字幕）
    const b = body([
      [0, 5, "第一句"],
      [750, 762, "串台视频末句"],
    ]);
    const [first, second] = twoReads(b);
    expect(
      assessAiSubtitleIntegrity(first, second, "ai-zh", 156).usable,
    ).toBe(false);
  });

  it("rejects when only marginally over duration (2672s video, 2940s subtitle)", () => {
    const b = body([[0, 2940, "串台内容"]]);
    const [first, second] = twoReads(b);
    expect(
      assessAiSubtitleIntegrity(first, second, "ai-zh", 2672).usable,
    ).toBe(false);
  });

  it("accepts subtitle ending within video duration", () => {
    const b = body([
      [0, 5, "第一句"],
      [140, 155.5, "最后一句"],
    ]);
    const [first, second] = twoReads(b);
    expect(
      assessAiSubtitleIntegrity(first, second, "ai-zh", 156).usable,
    ).toBe(true);
  });

  it("accepts subtitle ending within duration + slack (float rounding jitter)", () => {
    const b = body([[0, 158.9, "最后一句"]]);
    const [first, second] = twoReads(b);
    expect(
      assessAiSubtitleIntegrity(first, second, "ai-zh", 156).usable,
    ).toBe(true);
  });

  it.each([
    ["undefined duration", undefined],
    ["non-finite duration", Number.NaN],
    ["zero duration", 0],
    ["negative duration", -3],
  ])("is inconclusive (accepted) when duration is untrustworthy: %s", (_label, duration) => {
    const b = body([[900, 1200, "超出任何正常时长的内容"]]);
    const [first, second] = twoReads(b);
    expect(
      assessAiSubtitleIntegrity(first, second, "ai-zh", duration).usable,
    ).toBe(true);
  });

  it("keeps rejecting unstable content when duration would pass", () => {
    const first = body([[0, 5, "版本一"]]);
    const second = body([[0, 5, "版本二"]]);
    expect(
      assessAiSubtitleIntegrity(first, second, "ai-zh", 156).usable,
    ).toBe(false);
  });

  it("keeps rejecting language mismatch independent of duration", () => {
    const latin = body([[0, 10, "a".repeat(100)]]);
    expect(
      assessAiSubtitleIntegrity(latin, latin, "ai-zh", 156).usable,
    ).toBe(false);
  });
});

describe("trustedPartDurationSeconds", () => {
  const videoData = { cid: 111, duration: 2672 };

  it("prefers the exact matching Part entry", () => {
    const pages = [
      { page: 1, cid: 111, title: "P1", duration: 100 },
      { page: 2, cid: 222, title: "P2", duration: 200 },
    ];
    expect(trustedPartDurationSeconds(222, pages, videoData)).toBe(200);
  });

  it("falls back to top-level duration only for a single-Part video", () => {
    expect(
      trustedPartDurationSeconds(111, [{ page: 1, cid: 111, title: "P1", duration: 100 }], videoData),
    ).toBe(100);
    const multiPart = [
      { page: 1, cid: 111, title: "P1", duration: 100 },
      { page: 2, cid: 222, title: "P2", duration: 200 },
    ];
    expect(trustedPartDurationSeconds(999, multiPart, videoData)).toBeUndefined();
  });

  it.each([
    ["zero duration", 0],
    ["negative duration", -5],
  ])("treats %s as untrustworthy", (_label, duration) => {
    expect(
      trustedPartDurationSeconds(
        111,
        [{ page: 1, cid: 111, title: "P1", duration }],
        { cid: 111, duration },
      ),
    ).toBeUndefined();
  });
});

describe("getVideoInfoWithSubtitle duration sentinel end-to-end (issue #80)", () => {
  const fakeTrack = {
    id: 3,
    lan: "ai-zh",
    lan_doc: "AI Chinese",
    subtitle_url: "//example.test/ai-zh.json",
  };

  beforeEach(() => {
    cacheManager.clear();
    mockGetVideoSubtitle.mockReset();
    mockGetSubtitleContent.mockReset();
    mockCheckLoginStatus.mockReset();
    mockResolvePartCid.mockReset();
    mockGetVideoSubtitle.mockResolvedValue({
      subtitle: { subtitles: [fakeTrack] },
    });
    mockResolvePartCid.mockResolvedValue({
      cid: 12345,
      pages: [{ page: 1, cid: 12345, title: "Part 1", duration: 156 }],
      videoData: { title: "混剪视频", desc: "简介文本", cid: 12345, duration: 156 },
    });
  });

  it("falls back to description when the ai-zh body extends far beyond video duration", async () => {
    // 串台形态：2.6 分钟视频挂着 12 分钟+ 的字幕文件
    const crossVideoBody = { body: [{ from: 0, to: 5, content: "串台开头" }, { from: 750, to: 762, content: "串台末句" }] };
    mockGetSubtitleContent.mockResolvedValue(crossVideoBody);

    const result = await getVideoInfoWithSubtitle("BV1FAKE00000");

    expect(result.data_source).toBe("description");
    expect(result.video_info?.subtitle_text).toBeUndefined();
    // 不可用结果不缓存，便于 B站侧修复后重试
    expect(cacheManager.getVideoInfo(cacheManager.generateKey("video", "BV1FAKE00000", undefined, undefined, false))).toBeUndefined();
  });

  it("still returns ai_subtitle when the body fits within video duration", async () => {
    const inRangeBody = { body: [{ from: 0, to: 5, content: "第一句" }, { from: 140, to: 155, content: "最后一句" }] };
    mockGetSubtitleContent.mockResolvedValue(inRangeBody);

    const result = await getVideoInfoWithSubtitle("BV1FAKE00001");

    expect(result.data_source).toBe("ai_subtitle");
    expect(result.video_info?.subtitle_text).toBe("第一句\n最后一句");
  });
});
