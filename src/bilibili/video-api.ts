// B站 视频/字幕 API
import { config } from "../config.js";
import { credentialManager } from "../utils/credentials.js";
import { NetworkError, ValidationError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";
import { getBuvid } from "./fingerprint.js";
import {
  fetchWithWBI,
  fetchWithoutWBI,
  retryableFetch,
  throttledFetch,
} from "./http.js";

const MAX_SUBTITLE_RESPONSE_BYTES = 1_000_000;

/**
 * 获取视频基本信息
 */
export async function getVideoInfo(bvid: string) {
  return fetchWithoutWBI("/x/web-interface/view", { bvid }) as Promise<{
    title: string;
    desc: string;
    pic?: string;
    owner: { name: string; face: string };
    stat: {
      view: number;
      danmaku: number;
      reply: number;
      favorite: number;
      coin: number;
      share: number;
      like: number;
    };
    cid: number;
    aid: number;
    duration: number;
    pubdate: number;
    tag?: { tag_name: string }[];
  }>;
}

/**
 * 获取视频字幕信息
 *
 * 策略：优先使用带 WBI 签名的 /x/player/wbi/v2 接口。
 * 若该接口返回空字幕（部分视频的 AI 字幕 subtitle_url 只在非 WBI 版接口中暴露），
 * 自动降级到 /x/player/v2 重试一次。
 */
export async function getVideoSubtitle(bvid: string, cid: number) {
  const authHeaders = credentialManager.getAuthHeaders();

  // 获取 buvid 指纹 Cookie，规避 B站近期将 -352 风控扩展到播放器接口的问题
  const buvidFingerprint = await getBuvid();
  const headersWithBuvid: Record<string, string> = { ...authHeaders };
  if (buvidFingerprint) {
    const existingCookie = headersWithBuvid["Cookie"] || "";
    const buvidCookie = `buvid3=${buvidFingerprint.buvid3}; buvid4=${buvidFingerprint.buvid4}`;
    headersWithBuvid["Cookie"] = existingCookie
      ? `${existingCookie}; ${buvidCookie}`
      : buvidCookie;
  }

  type SubtitleResponse = {
    subtitle: {
      subtitles: Array<{
        id: number;
        lan: string;
        lan_doc: string;
        subtitle_url: string;
      }>;
    };
  };

  // 第一次尝试：WBI 签名接口
  const wbiResult = (await fetchWithWBI(
    "/x/player/wbi/v2",
    { bvid, cid },
    headersWithBuvid,
  )) as SubtitleResponse;

  if (
    wbiResult?.subtitle?.subtitles &&
    wbiResult.subtitle.subtitles.length > 0
  ) {
    return wbiResult;
  }

  // WBI 接口返回空字幕，降级到非 WBI 接口重试
  logger.debug(
    "WBI subtitle API returned empty subtitles, falling back to /x/player/v2",
    { bvid, cid },
    { type: "video-api", operation: "getVideoSubtitle" },
  );
  const fallbackResult = (await fetchWithoutWBI(
    "/x/player/v2",
    { bvid, cid },
    headersWithBuvid,
  )) as SubtitleResponse;

  if (
    fallbackResult?.subtitle?.subtitles &&
    fallbackResult.subtitle.subtitles.length > 0
  ) {
    logger.info(
      "Subtitle fallback succeeded",
      { bvid, cid, subtitleCount: fallbackResult.subtitle.subtitles.length },
      { type: "video-api", operation: "getVideoSubtitle" },
    );
  } else {
    logger.info(
      "Subtitle fallback also returned no subtitles",
      { bvid, cid },
      { type: "video-api", operation: "getVideoSubtitle" },
    );
  }

  return fallbackResult;
}

/**
 * 获取字幕内容
 */
export async function getSubtitleContent(url: string): Promise<{
  body: Array<{
    from: number;
    to: number;
    location: number;
    content: string;
  }>;
}> {
  const allowedSubtitleHosts = new Set([
    "aisubtitle.hdslb.com",
    "subtitle.bilibili.com",
  ]);
  const fullUrl = new URL(url, "https://www.bilibili.com");
  if (
    fullUrl.protocol !== "https:" ||
    !allowedSubtitleHosts.has(fullUrl.hostname)
  ) {
    throw new ValidationError(
      "Unsupported subtitle URL host",
    );
  }

  async function readSubtitleResponse(response: Response): Promise<string> {
    const contentLength = response.headers.get("content-length");
    if (
      contentLength !== null &&
      Number.isFinite(Number(contentLength)) &&
      Number(contentLength) > MAX_SUBTITLE_RESPONSE_BYTES
    ) {
      throw new ValidationError("Subtitle response is too large");
    }

    if (!response.body) {
      const text = await response.text();
      if (new TextEncoder().encode(text).byteLength > MAX_SUBTITLE_RESPONSE_BYTES) {
        throw new ValidationError("Subtitle response is too large");
      }
      return text;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    const chunks: string[] = [];
    let receivedBytes = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      receivedBytes += value.byteLength;
      if (receivedBytes > MAX_SUBTITLE_RESPONSE_BYTES) {
        await reader.cancel();
        throw new ValidationError("Subtitle response is too large");
      }
      chunks.push(decoder.decode(value, { stream: true }));
    }

    chunks.push(decoder.decode());
    return chunks.join("");
  }

  return retryableFetch(async () => {
    return throttledFetch(async (controller) => {
      try {
        const response = await fetch(fullUrl.toString(), {
          headers: {
            "User-Agent": config.userAgent,
            Referer: config.referer,
          },
          redirect: "manual",
          signal: controller.signal,
        });

        if (response.status >= 300 && response.status < 400) {
          throw new ValidationError("Unsupported subtitle URL redirect");
        }

        if (!response.ok) {
          throw new NetworkError(
            `HTTP ${response.status}: ${response.statusText}`,
            undefined,
            url.toString(),
            response.status,
          );
        }

        const responseText = await readSubtitleResponse(response);
        return JSON.parse(responseText);
      } catch (error) {
        logger.error(
          "Error fetching subtitle content",
          { error: error instanceof Error ? error.message : error },
          { type: "subtitle-error", url },
        );
        throw error;
      }
    });
  });
}
