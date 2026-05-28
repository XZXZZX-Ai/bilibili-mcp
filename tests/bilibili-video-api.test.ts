import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  getSubtitleContent,
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
  it("returns WBI subtitles without calling the non-WBI fallback", async () => {
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
                  id: 1,
                  lan: "zh-Hans",
                  lan_doc: "中文",
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
    expect(calls.some((call) => call.url.includes("/x/player/wbi/v2"))).toBe(
      true,
    );
    expect(calls.some((call) => call.url.includes("/x/player/v2"))).toBe(true);
  });
});

describe("getSubtitleContent", () => {
  it("normalizes protocol-relative subtitle URLs", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url === "https://example.test/subtitle.json") {
        return jsonResponse({
          body: [{ from: 0, to: 1, location: 2, content: "hello" }],
        });
      }

      throw new Error(`Unexpected fetch URL: ${url}`);
    });

    vi.stubGlobal("fetch", fetchMock);

    const result = await getSubtitleContent("//example.test/subtitle.json");

    expect(result.body[0].content).toBe("hello");
    expect(getFetchCalls(fetchMock)[0].url).toBe(
      "https://example.test/subtitle.json",
    );
  });
});
