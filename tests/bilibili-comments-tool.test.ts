import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock the client module before it's imported
const mockGetVideoComments = vi.fn();
const mockGetVideoInfo = vi.fn();

vi.mock("../src/bilibili/client.js", () => ({
  getVideoInfo: (...args: unknown[]) => mockGetVideoInfo(...args),
  getVideoComments: (...args: unknown[]) => mockGetVideoComments(...args),
}));

import { getVideoCommentsData } from "../src/bilibili/comments.js";
import { cacheManager } from "../src/utils/cache.js";

function makeFakeReplies(overrides: Record<string, unknown> = {}) {
  return [
    {
      rpid: 1,
      member: { uname: "UserA", avatar: "" },
      content: { message: "First comment 05:20 nice" },
      like: 10,
      replies: [
        {
          rpid: 100,
          member: { uname: "Replier", avatar: "" },
          content: { message: "reply one" },
          like: 5,
        },
        {
          rpid: 101,
          member: { uname: "Replier2", avatar: "" },
          content: { message: "reply two" },
          like: 3,
        },
        {
          rpid: 102,
          member: { uname: "Replier3", avatar: "" },
          content: { message: "reply three" },
          like: 1,
        },
        {
          rpid: 103,
          member: { uname: "Replier4", avatar: "" },
          content: { message: "reply four" },
          like: 0,
        },
      ],
      ...overrides,
    },
  ];
}

beforeEach(() => {
  cacheManager.clear();

  mockGetVideoInfo.mockResolvedValue({
    cid: 12345,
    title: "Test Video",
    desc: "",
    owner: { name: "Author", face: "" },
    stat: { view: 0, danmaku: 0, reply: 0, favorite: 0, coin: 0, share: 0, like: 0 },
    aid: 678,
    duration: 0,
    pubdate: 0,
  });

  mockGetVideoComments.mockResolvedValue({
    replies: makeFakeReplies(),
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("getVideoCommentsData - old positional API", () => {
  it("brief default: passes pageSize 10, sort 1, includeReplies true", async () => {
    await getVideoCommentsData("BV1T6PQzQErF");

    expect(mockGetVideoComments).toHaveBeenCalledWith(
      "BV1T6PQzQErF",
      1,    // page
      10,   // pageSize
      1,    // sort (hot)
      true, // includeReplies
    );
  });

  it('brief default: summary reflects processed count', async () => {
    const result = await getVideoCommentsData("BV1T6PQzQErF");

    expect(result.summary.total_comments).toBeGreaterThanOrEqual(1);
    expect(result.comments.length).toBe(result.summary.total_comments);
  });

  it('detailed default: passes pageSize 20, includes replies', async () => {
    await getVideoCommentsData("BV1T6PQzQErF", "detailed");

    expect(mockGetVideoComments).toHaveBeenCalledWith(
      "BV1T6PQzQErF",
      1,
      20,
      1,
      true,
    );
  });

  it("detailed default: includes top replies in processed result", async () => {
    const result = await getVideoCommentsData("BV1T6PQzQErF", "detailed");

    // 1 main comment + up to 3 replies = at least 4
    expect(result.comments.length).toBeGreaterThanOrEqual(4);
  });
});

describe("getVideoCommentsData - new options API", () => {
  it("explicit limit overrides detail-level-derived count", async () => {
    await getVideoCommentsData("BV1T6PQzQErF", { limit: 5 });

    expect(mockGetVideoComments).toHaveBeenCalledWith(
      "BV1T6PQzQErF",
      1,
      5,    // explicit limit
      1,    // default hot sort
      true, // default includeReplies
    );
  });

  it('explicit sort "time" passes sort 0', async () => {
    await getVideoCommentsData("BV1T6PQzQErF", { sort: "time" });

    expect(mockGetVideoComments).toHaveBeenCalledWith(
      "BV1T6PQzQErF",
      1,
      10,   // default brief pageSize
      0,    // time sort
      true,
    );
  });

  it('explicit sort "hot" passes sort 1', async () => {
    await getVideoCommentsData("BV1T6PQzQErF", { sort: "hot" });

    expect(mockGetVideoComments).toHaveBeenCalledWith(
      "BV1T6PQzQErF",
      1,
      10,
      1,    // hot sort
      true,
    );
  });

  it("explicit includeReplies false is passed through", async () => {
    mockGetVideoComments.mockResolvedValue({
      replies: makeFakeReplies(),
    });

    await getVideoCommentsData("BV1T6PQzQErF", { includeReplies: false });

    expect(mockGetVideoComments).toHaveBeenCalledWith(
      "BV1T6PQzQErF",
      1,
      10,
      1,
      false, // includeReplies false
    );
  });

  it("explicit includeReplies false: does not append child replies", async () => {
    mockGetVideoComments.mockResolvedValue({
      replies: makeFakeReplies(),
    });

    const result = await getVideoCommentsData("BV1T6PQzQErF", {
      detailLevel: "detailed",
      includeReplies: false,
    });

    // Only main comments, no extra replies
    expect(result.comments.length).toBe(1);
  });

  it("combined options: limit + sort + includeReplies all honored", async () => {
    await getVideoCommentsData("BV1T6PQzQErF", {
      detailLevel: "detailed",
      limit: 8,
      sort: "time",
      includeReplies: false,
    });

    expect(mockGetVideoComments).toHaveBeenCalledWith(
      "BV1T6PQzQErF",
      1,
      8,
      0,     // time
      false, // no replies
    );
  });
});

describe("getVideoCommentsData - cache key behavior", () => {
  it("different options produce different cache keys", async () => {
    // First call
    await getVideoCommentsData("BV1T6PQzQErF", { limit: 5, sort: "hot" });
    const callsBefore = mockGetVideoComments.mock.calls.length;

    // Different limit -> different cache key -> should call API again
    await getVideoCommentsData("BV1T6PQzQErF", { limit: 10, sort: "hot" });
    expect(mockGetVideoComments.mock.calls.length).toBe(callsBefore + 1);
  });

  it("same options reuse cache", async () => {
    await getVideoCommentsData("BV1T6PQzQErF", { limit: 3, sort: "time" });
    const callsBefore = mockGetVideoComments.mock.calls.length;

    // Same params -> same cache key -> should NOT call API again
    await getVideoCommentsData("BV1T6PQzQErF", { limit: 3, sort: "time" });
    expect(mockGetVideoComments.mock.calls.length).toBe(callsBefore);
  });
});
