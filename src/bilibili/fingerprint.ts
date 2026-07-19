// B站 buvid 指纹模块
import { config } from "../config.js";
import { logger } from "../utils/logger.js";

const BASE_URL = config.baseUrl;
const REQUEST_TIMEOUT_MS = config.requestTimeoutMs;

// buvid 指纹缓存（用于规避反爬验证）
let cachedBuvid: {
  buvid3: string;
  buvid4: string;
  expireTime: number;
} | null = null;

/**
 * 获取 buvid 指纹 Cookie（规避 Bilibili 反爬 -352 错误）
 * buvid3/buvid4 是 Bilibili 用来识别浏览器的指纹 Cookie，
 * 无需登录即可从 /x/frontend/finger/spi 接口获取
 */
export async function getBuvid(): Promise<{
  buvid3: string;
  buvid4: string;
} | null> {
  const now = Date.now();
  const BUVID_CACHE_MS = 24 * 60 * 60 * 1000; // 缓存 24 小时

  if (cachedBuvid && cachedBuvid.expireTime > now) {
    return { buvid3: cachedBuvid.buvid3, buvid4: cachedBuvid.buvid4 };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    REQUEST_TIMEOUT_MS,
  );

  try {
    const resp = await fetch(`${BASE_URL}/x/frontend/finger/spi`, {
      headers: {
        "User-Agent": config.userAgent,
        Referer: config.referer,
      },
      signal: controller.signal,
    });

    if (!resp.ok) return null;

    const data = await resp.json();
    if (data.code !== 0 || !data.data?.b_3 || !data.data?.b_4) return null;

    cachedBuvid = {
      buvid3: data.data.b_3,
      buvid4: data.data.b_4,
      expireTime: now + BUVID_CACHE_MS,
    };

    logger.info("Buvid fingerprint fetched", {
      buvid3: data.data.b_3.substring(0, 8) + "...",
    });
    return { buvid3: cachedBuvid.buvid3, buvid4: cachedBuvid.buvid4 };
  } catch (error) {
    logger.warn(
      "Failed to fetch buvid fingerprint, continuing without it",
      { error: error instanceof Error ? error.message : error },
    );
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}
