import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetVideoInfo = vi.fn();

vi.mock("../src/bilibili/video-api.js", () => ({
  getVideoInfo: (...args: unknown[]) => mockGetVideoInfo(...args),
}));

import { normalizePages, resolvePartCid } from "../src/bilibili/navigation.js";
import { ValidationError } from "../src/utils/errors.js";

describe("normalizePages", () => {
  it("returns empty array for undefined input", () => {
    expect(normalizePages(undefined)).toEqual([]);
  });

  it("returns empty array for empty input", () => {
    expect(normalizePages([])).toEqual([]);
  });

  it("normalizes multiple pages", () => {
    const raw = [
      { cid: 100, page: 1, part: "Intro", duration: 120 },
      { cid: 200, page: 2, part: "Main", duration: 300 },
    ];
    const result = normalizePages(raw);
    expect(result).toEqual([
      { page: 1, cid: 100, title: "Intro", duration: 120 },
      { page: 2, cid: 200, title: "Main", duration: 300 },
    ]);
  });

  it("uses default P-n title when part is missing", () => {
    const raw = [{ cid: 100, page: 3, duration: 60 }];
    const result = normalizePages(raw);
    expect(result).toEqual([
      { page: 3, cid: 100, title: "P3", duration: 60 },
    ]);
  });
});

describe("resolvePartCid", () => {
  beforeEach(() => {
    mockGetVideoInfo.mockReset();
    mockGetVideoInfo.mockResolvedValue({
      title: "Test",
      desc: "",
      cid: 999,
      pages: [
        { cid: 100, page: 1, part: "P1", duration: 60 },
        { cid: 200, page: 2, part: "P2", duration: 60 },
      ],
    });
  });

  it("uses top-level videoData.cid when page is omitted", async () => {
    const result = await resolvePartCid("BV1T6PQzQErF");

    // Default CID is top-level cid, NOT pages[0].cid
    expect(result.cid).toBe(999);
    expect(result.pages).toHaveLength(2);
  });

  it("throws ValidationError for positive but missing page", async () => {
    await expect(
      resolvePartCid("BV1T6PQzQErF", 99),
    ).rejects.toThrow(ValidationError);

    await expect(
      resolvePartCid("BV1T6PQzQErF", 99),
    ).rejects.toThrow("Page 99 not found");
  });

  it("resolves CID for existing page", async () => {
    const result = await resolvePartCid("BV1T6PQzQErF", 2);

    expect(result.cid).toBe(200);
  });

  it("throws ValidationError for page < 1", async () => {
    await expect(
      resolvePartCid("BV1T6PQzQErF", 0),
    ).rejects.toThrow(ValidationError);
  });

  it("returns videoData alongside cid and pages", async () => {
    const result = await resolvePartCid("BV1T6PQzQErF");

    expect(result.videoData).toBeDefined();
    expect(result.videoData.title).toBe("Test");
    expect(result.videoData.cid).toBe(999);
  });

  it("accepts preFetchedVideoData and skips getVideoInfo call", async () => {
    mockGetVideoInfo.mockResolvedValue({ title: "NeverCalled" });
    const preFetched = {
      title: "PreFetched",
      desc: "",
      cid: 555,
      pages: [{ cid: 555, page: 1, part: "Only", duration: 10 }],
    };

    const result = await resolvePartCid("BV1T6PQzQErF", undefined, preFetched as Parameters<typeof resolvePartCid>[2]);

    // Should use preFetched data, not call getVideoInfo
    expect(mockGetVideoInfo).not.toHaveBeenCalled();
    expect(result.videoData.title).toBe("PreFetched");
    expect(result.cid).toBe(555);
  });
});
