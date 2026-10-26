import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  getSubtitleContent,
  getVideoInfo,
  getVideoSubtitle,
} from "../src/bilibili/client.js";
import { credentialManager } from "../src/utils/credentials.js";

type FetchCall = {
  url: string;
  init?: RequestInit;
};

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function textResponse(text: string, status = 200): Response {
  return new Response(text, {
    status,
    headers: { "content-type": "application/json" },
  });
}

function getFetchCalls(fetchMock: ReturnType<typeof vi.fn>): FetchCall[] {
  return fetchMock.mock.calls.map(([url, init]) => ({
    url: String(url),
    init: init as RequestInit | undefined,
  }));
}

beforeEach(() => {
  credentialManager.setCredentials({
    sessdata: "test-sessdata",
    bili_jct: "test-bili-jct",
    dedeuserid: "123456",
    expiresAt: Date.now() + 60_000,
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  credentialManager.clearCredentials();
});

describe("getVideoSubtitle", () => {
  it("accepts WBI subtitle IDs beyond the safe integer range without calling the non-WBI fallback", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes("/x/frontend/finger/spi")) {
        return jsonResponse({
          code: 0,
          data: { b_3: "buvid3-test", b_4: "buvid4-test" },
        });
      }

      if (url.includes("/x/web-interface/nav")) {
        return jsonResponse({
          code: 0,
          data: {
            wbi_img: {
              img_url:
                "https://i0.hdslb.com/bfs/wbi/abcdefghijklmnopqrstuvwxyz123456.png",
              sub_url:
                "https://i0.hdslb.com/bfs/wbi/123456abcdefghijklmnopqrstuvwxyz.png",
            },
          },
        });
      }

      if (url.includes("/x/player/wbi/v2")) {
        return jsonResponse({
          code: 0,
          data: {
            subtitle: {
              subtitles: [
                {
                  id: 9_007_199_254_740_992,
                  lan: "ai-zh",
                  lan_doc: "AI中文",
                  subtitle_url: "//example.test/wbi.json",
                },
              ],
            },
          },
        });
      }

      throw new Error(`Unexpected fetch URL: ${url}`);
    });

    vi.stubGlobal("fetch", fetchMock);

    const result = await getVideoSubtitle("BV1T6PQzQErF", 123);

    expect(result.subtitle.subtitles).toHaveLength(1);
    expect(result.subtitle.subtitles[0].subtitle_url).toBe(
      "//example.test/wbi.json",
    );

    const calls = getFetchCalls(fetchMock);
    expect(calls.some((call) => call.url.includes("/x/player/wbi/v2"))).toBe(
      true,
    );
    expect(calls.some((call) => call.url.includes("/x/player/v2"))).toBe(false);
  });

  it("falls back to /x/player/v2 when WBI subtitles are empty", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes("/x/frontend/finger/spi")) {
        return jsonResponse({
          code: 0,
          data: { b_3: "buvid3-test", b_4: "buvid4-test" },
        });
      }

      if (url.includes("/x/web-interface/nav")) {
        return jsonResponse({
          code: 0,
          data: {
            wbi_img: {
              img_url:
                "https://i0.hdslb.com/bfs/wbi/abcdefghijklmnopqrstuvwxyz123456.png",
              sub_url:
                "https://i0.hdslb.com/bfs/wbi/123456abcdefghijklmnopqrstuvwxyz.png",
            },
          },
        });
      }

      if (url.includes("/x/player/wbi/v2")) {
        return jsonResponse({
          code: 0,
          data: { subtitle: { subtitles: [] } },
        });
      }

      if (url.includes("/x/player/v2")) {
        return jsonResponse({
          code: 0,
          data: {
            subtitle: {
              subtitles: [
                {
                  id: 2,
                  lan: "ai-zh",
                  lan_doc: "AI中文",
                  subtitle_url: "//example.test/fallback.json",
                },
              ],
            },
          },
        });
      }

      throw new Error(`Unexpected fetch URL: ${url}`);
    });

    vi.stubGlobal("fetch", fetchMock);

    const result = await getVideoSubtitle("BV1T6PQzQErF", 123);

    expect(result.subtitle.subtitles).toHaveLength(1);
    expect(result.subtitle.subtitles[0].subtitle_url).toBe(
      "//example.test/fallback.json",
    );

    const calls = getFetchCalls(fetchMock);
    expect(
      calls.filter((call) => call.url.includes("/x/player/wbi/v2")),
    ).toHaveLength(1);
    expect(
      calls.filter((call) => call.url.includes("/x/player/v2")),
    ).toHaveLength(1);
  });

  it("falls back to /x/player/v2 when the WBI endpoint returns HTTP 412", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes("/x/frontend/finger/spi")) {
        return jsonResponse({
          code: 0,
          data: { b_3: "buvid3-test", b_4: "buvid4-test" },
        });
      }

      if (url.includes("/x/web-interface/nav")) {
        return jsonResponse({
          code: 0,
          data: {
            wbi_img: {
              img_url:
                "https://i0.hdslb.com/bfs/wbi/abcdefghijklmnopqrstuvwxyz123456.png",
              sub_url:
                "https://i0.hdslb.com/bfs/wbi/123456abcdefghijklmnopqrstuvwxyz.png",
            },
          },
        });
      }

      if (url.includes("/x/player/wbi/v2")) {
        return textResponse("risk control", 412);
      }

      if (url.includes("/x/player/v2")) {
        return jsonResponse({
          code: 0,
          data: {
            subtitle: {
              subtitles: [
                {
                  id: 2,
                  lan: "ai-zh",
                  lan_doc: "AI中文",
                  subtitle_url: "//example.test/fallback.json",
                },
              ],
            },
          },
        });
      }

      throw new Error(`Unexpected fetch URL: ${url}`);
    });

    vi.stubGlobal("fetch", fetchMock);

    const result = await getVideoSubtitle("BV1T6PQzQErF", 123);

    expect(result.subtitle.subtitles[0].subtitle_url).toBe(
      "//example.test/fallback.json",
    );

    const calls = getFetchCalls(fetchMock);
    expect(
      calls.filter((call) => call.url.includes("/x/player/wbi/v2")),
    ).toHaveLength(1);
    expect(
      calls.filter((call) => call.url.includes("/x/player/v2")),
    ).toHaveLength(1);
  });

  it("does not fall back to /x/player/v2 for other WBI HTTP errors", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes("/x/frontend/finger/spi")) {
        return jsonResponse({
          code: 0,
          data: { b_3: "buvid3-test", b_4: "buvid4-test" },
        });
      }

      if (url.includes("/x/web-interface/nav")) {
        return jsonResponse({
          code: 0,
          data: {
            wbi_img: {
              img_url:
                "https://i0.hdslb.com/bfs/wbi/abcdefghijklmnopqrstuvwxyz123456.png",
              sub_url:
                "https://i0.hdslb.com/bfs/wbi/123456abcdefghijklmnopqrstuvwxyz.png",
            },
          },
        });
      }

      if (url.includes("/x/player/wbi/v2")) {
        return textResponse("forbidden", 403);
      }

      throw new Error(`Unexpected fetch URL: ${url}`);
    });

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      getVideoSubtitle("BV1T6PQzQErF", 123),
    ).rejects.toMatchObject({ name: "NetworkError", statusCode: 403 });

    const calls = getFetchCalls(fetchMock);
    expect(
      calls.filter((call) => call.url.includes("/x/player/wbi/v2")),
    ).toHaveLength(1);
    expect(
      calls.filter((call) => call.url.includes("/x/player/v2")),
    ).toHaveLength(0);
  });
});

describe("getVideoInfo", () => {
  function makeVideoInfoData() {
    return {
      bvid: "BV1tQH96XEgH",
      aid: 123,
      cid: 999,
      title: "Test Video",
      desc: "Description",
      pic: "",
      owner: { name: "Author", face: "" },
      stat: {
        view: 1,
        danmaku: 0,
        reply: 0,
        favorite: 0,
        coin: 0,
        share: 0,
        like: 0,
      },
      duration: 100,
      pubdate: 1716912000,
    };
  }

  function stubInfoEndpoints(options: {
    wbiStatus?: number;
    legacyStatus?: number;
  }) {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes("/x/web-interface/nav")) {
        return jsonResponse({
          code: 0,
          data: {
            wbi_img: {
              img_url:
                "https://i0.hdslb.com/bfs/wbi/abcdefghijklmnopqrstuvwxyz123456.png",
              sub_url:
                "https://i0.hdslb.com/bfs/wbi/123456abcdefghijklmnopqrstuvwxyz.png",
            },
          },
        });
      }

      if (url.includes("/x/web-interface/wbi/view")) {
        if (options.wbiStatus && options.wbiStatus !== 200) {
          return textResponse("risk control", options.wbiStatus);
        }
        return jsonResponse({ code: 0, data: makeVideoInfoData() });
      }

      if (url.includes("/x/web-interface/view")) {
        if (options.legacyStatus && options.legacyStatus !== 200) {
          return textResponse("risk control", options.legacyStatus);
        }
        return jsonResponse({
          code: 0,
          data: { ...makeVideoInfoData(), title: "Legacy Video" },
        });
      }

      throw new Error(`Unexpected fetch URL: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
  }

  it("uses the WBI-signed /x/web-interface/wbi/view endpoint by default", async () => {
    const fetchMock = stubInfoEndpoints({});

    const result = await getVideoInfo("BV1tQH96XEgH");

    expect(result.title).toBe("Test Video");
    const calls = getFetchCalls(fetchMock);
    expect(
      calls.some((call) => call.url.includes("/x/web-interface/wbi/view")),
    ).toBe(true);
    expect(
      calls.some(
        (call) =>
          call.url.includes("/x/web-interface/view") &&
          !call.url.includes("/x/web-interface/wbi/view"),
      ),
    ).toBe(false);
  });

  it("falls back to /x/web-interface/view when the WBI endpoint returns HTTP 412", async () => {
    const fetchMock = stubInfoEndpoints({ wbiStatus: 412 });

    const result = await getVideoInfo("BV1tQH96XEgH");

    expect(result.title).toBe("Legacy Video");
    const calls = getFetchCalls(fetchMock);
    expect(
      calls.filter((call) => call.url.includes("/x/web-interface/wbi/view")),
    ).toHaveLength(1);
    expect(
      calls.filter(
        (call) =>
          call.url.includes("/x/web-interface/view") &&
          !call.url.includes("/x/web-interface/wbi/view"),
      ),
    ).toHaveLength(1);
    const videoInfoCalls = calls.filter((call) =>
      call.url.includes("/x/web-interface/wbi/view") ||
      call.url.includes("/x/web-interface/view")
    );
    for (const call of videoInfoCalls) {
      expect(new Headers(call.init?.headers).get("Cookie")).toContain(
        "SESSDATA=test-sessdata",
      );
    }
  });

  it("does not fall back to /x/web-interface/view for other WBI HTTP errors", async () => {
    const fetchMock = stubInfoEndpoints({ wbiStatus: 403 });

    await expect(
      getVideoInfo("BV1tQH96XEgH"),
    ).rejects.toMatchObject({ name: "NetworkError", statusCode: 403 });

    const calls = getFetchCalls(fetchMock);
    expect(
      calls.some(
        (call) =>
          call.url.includes("/x/web-interface/view") &&
          !call.url.includes("/x/web-interface/wbi/view"),
      ),
    ).toBe(false);
  });

  it("keeps paid-video semantics on the WBI endpoint without falling back", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes("/x/web-interface/nav")) {
        return jsonResponse({
          code: 0,
          data: {
            wbi_img: {
              img_url:
                "https://i0.hdslb.com/bfs/wbi/abcdefghijklmnopqrstuvwxyz123456.png",
              sub_url:
                "https://i0.hdslb.com/bfs/wbi/123456abcdefghijklmnopqrstuvwxyz.png",
            },
          },
        });
      }

      if (url.includes("/x/web-interface/wbi/view")) {
        return jsonResponse({ code: -403, message: "该视频为付费内容，购买后可观看" });
      }

      throw new Error(`Unexpected fetch URL: ${url}`);
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      getVideoInfo("BV1tQH96XEgH"),
    ).rejects.toMatchObject({ name: "PaidVideoError" });

    const calls = getFetchCalls(fetchMock);
    expect(
      calls.some(
        (call) =>
          call.url.includes("/x/web-interface/view") &&
          !call.url.includes("/x/web-interface/wbi/view"),
      ),
    ).toBe(false);
  });

  it("propagates the error when both endpoints return HTTP 412", async () => {
    stubInfoEndpoints({ wbiStatus: 412, legacyStatus: 412 });

    await expect(
      getVideoInfo("BV1tQH96XEgH"),
    ).rejects.toMatchObject({ name: "NetworkError", statusCode: 412 });
  });
});

describe("getSubtitleContent", () => {
  it("normalizes protocol-relative Bilibili subtitle URLs without sending auth cookies", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url === "https://aisubtitle.hdslb.com/subtitle.json") {
        return jsonResponse({
          body: [{ from: 0, to: 1, location: 2, content: "hello" }],
        });
      }

      throw new Error(`Unexpected fetch URL: ${url}`);
    });

    vi.stubGlobal("fetch", fetchMock);

    const result = await getSubtitleContent("//aisubtitle.hdslb.com/subtitle.json");

    expect(result.body[0].content).toBe("hello");
    expect(getFetchCalls(fetchMock)[0].url).toBe(
      "https://aisubtitle.hdslb.com/subtitle.json",
    );
    expect(getFetchCalls(fetchMock)[0].init?.headers).not.toHaveProperty(
      "Cookie",
    );
    expect(getFetchCalls(fetchMock)[0].init?.redirect).toBe("manual");
  });

  it("rejects non-Bilibili subtitle URLs before fetch", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      getSubtitleContent("http://127.0.0.1/subtitle.json"),
    ).rejects.toThrow("Unsupported subtitle URL host");
    await expect(
      getSubtitleContent("//example.test/subtitle.json"),
    ).rejects.toThrow("Unsupported subtitle URL host");

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sanitizes subtitle lines while preserving CJK, emoji, tabs, and newlines", async () => {
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        body: [
          {
            from: 0,
            to: 1,
            location: 2,
            content:
              "你好" +
              String.fromCharCode(0x202e) +
              "世界" +
              String.fromCharCode(0x200b),
          },
          {
            from: 1,
            to: 2,
            location: 2,
            content:
              "a" +
              String.fromCharCode(0x0080) +
              "b" +
              String.fromCharCode(0x009f) +
              "c",
          },
          {
            from: 2,
            to: 3,
            location: 2,
            content:
              "tab" +
              String.fromCharCode(0x09) +
              "and" +
              String.fromCharCode(0x0a) +
              "emoji😀" +
              String.fromCharCode(0x2066),
          },
        ],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await getSubtitleContent(
      "//aisubtitle.hdslb.com/subtitle.json",
    );

    expect(result.body[0].content).toBe("你好世界");
    expect(result.body[1].content).toBe("abc");
    expect(result.body[2].content).toBe(
      "tab" +
        String.fromCharCode(0x09) +
        "and" +
        String.fromCharCode(0x0a) +
        "emoji😀",
    );
  });

  it("sanitizes long subtitle lines without truncation", async () => {
    const longLine = "中".repeat(3_000) + String.fromCharCode(0x202e);
    const fetchMock = vi.fn(async () =>
      jsonResponse({
        body: [{ from: 0, to: 1, location: 2, content: longLine }],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await getSubtitleContent(
      "//aisubtitle.hdslb.com/subtitle.json",
    );

    expect(result.body[0].content).toBe("中".repeat(3_000));
  });

  it.each([
    "https://aisubtitle.hdslb.com:8443/subtitle.json",
    "//aisubtitle.hdslb.com:8443/subtitle.json",
    "https://user:pass@aisubtitle.hdslb.com/subtitle.json",
    "//user:pass@aisubtitle.hdslb.com/subtitle.json",
  ])(
    "rejects a subtitle URL with a custom port or userinfo before fetch: %s",
    async (url) => {
      const fetchMock = vi.fn();
      vi.stubGlobal("fetch", fetchMock);

      await expect(getSubtitleContent(url)).rejects.toThrow(
        "Unsupported subtitle URL port or userinfo",
      );
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it("does not allow subtitle fetch redirects to bypass the host allowlist", async () => {
    const fetchMock = vi.fn(async () => new Response(null, {
      status: 302,
      headers: { location: "http://127.0.0.1/metadata" },
    }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      getSubtitleContent("//aisubtitle.hdslb.com/redirect.json"),
    ).rejects.toThrow("Unsupported subtitle URL redirect");

    expect(getFetchCalls(fetchMock)[0].init?.redirect).toBe("manual");
  });

  it("does not retry a non-retryable subtitle HTTP status", async () => {
    vi.useFakeTimers();
    try {
      const fetchMock = vi.fn(async () => textResponse("forbidden", 403));
      vi.stubGlobal("fetch", fetchMock);

      const result = getSubtitleContent(
        "//aisubtitle.hdslb.com/forbidden.json",
      ).catch((error: unknown) => error);

      await vi.runAllTimersAsync();
      await expect(result).resolves.toMatchObject({ statusCode: 403 });
      expect(fetchMock).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it("rejects oversized subtitle responses before JSON parsing", async () => {
    const oversizedBody = JSON.stringify({
      body: [{ from: 0, to: 1, location: 2, content: "x".repeat(1_000_001) }],
    });
    const fetchMock = vi.fn(async () => textResponse(oversizedBody));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      getSubtitleContent("//aisubtitle.hdslb.com/huge.json"),
    ).rejects.toThrow("Subtitle response is too large");
  });
});
