// B站 WBI 签名模块
import { createHash } from "crypto";
import { config } from "../config.js";
import {
  BilibiliAPIError,
  NetworkError,
  TimeoutError,
} from "../utils/errors.js";
import { logger } from "../utils/logger.js";
import { withRetry } from "../utils/retry.js";

// WBI 缓存
let cachedWBI: {
  imgKey: string;
  subKey: string;
  mixKey: string;
  expireTime: number;
} | null = null;

const REQUEST_TIMEOUT_MS = config.requestTimeoutMs;
const BASE_URL = config.baseUrl;
const CACHE_EXPIRATION_MS = config.wbiCacheExpirationMs;

/**
 * 生成 WBI 签名所需的混合密钥
 */
function getMixKey(imgKey: string, subKey: string): string {
  // WBI 签名使用特定的混合顺序
  const saltTable = [
    46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35, 27, 43, 5,
    49, 33, 9, 42, 19, 29, 28, 14, 39, 12, 38, 41, 13, 37, 48, 7, 16, 24, 55,
    40, 61, 26, 17, 0, 1, 60, 51, 30, 4, 22, 25, 54, 21, 56, 59, 6, 63, 57,
    62, 11, 36, 20, 34, 44, 52,
  ];
  const mixKey = imgKey + subKey;
  return saltTable.map((i) => mixKey[i]).join("");
}

/**
 * MD5 哈希函数 - 使用 Node.js crypto 模块
 * 这是 B 站 WBI 签名算法真正需要的哈希函数
 */
function md5Hash(str: string): string {
  return createHash("md5").update(str).digest("hex");
}

/**
 * 获取 WBI 签名密钥
 */
export async function getWBI(): Promise<{
  imgKey: string;
  subKey: string;
  mixKey: string;
}> {
  // 检查缓存是否有效（1小时过期）
  const now = Date.now();
  if (cachedWBI && cachedWBI.expireTime > now) {
    return {
      imgKey: cachedWBI.imgKey,
      subKey: cachedWBI.subKey,
      mixKey: cachedWBI.mixKey,
    };
  }

  try {
    return await withRetry(
      async () => {
        // 获取 nav 数据中的 wbi_img 字段
        const controller = new AbortController();
        const timeoutId = setTimeout(
          () => controller.abort(),
          REQUEST_TIMEOUT_MS,
        );

        let navRes: Response;
        try {
          navRes = await fetch(`${BASE_URL}/x/web-interface/nav`, {
            headers: {
              "User-Agent": config.userAgent,
              Referer: config.referer,
            },
            signal: controller.signal,
          });
        } catch (error) {
          if (error instanceof TypeError) {
            throw new NetworkError("Network request failed", error);
          }
          throw error;
        } finally {
          clearTimeout(timeoutId);
        }

        if (!navRes.ok) {
          throw new NetworkError(
            `Failed to fetch WBI: ${navRes.status}`,
            undefined,
            `${BASE_URL}/x/web-interface/nav`,
            navRes.status,
          );
        }

        const navData = await navRes.json();
        const wbiImg = navData.data?.wbi_img;

        if (!wbiImg) {
          throw new BilibiliAPIError(
            "WBI image data not found",
            "WBI_DATA_MISSING",
          );
        }

        // 提取 img_key 和 sub_key
        const imgKeyMatch = wbiImg.img_url?.match(
          /([^\/_]+)(?=\.[a-zA-Z]+$)/,
        );
        const subKeyMatch = wbiImg.sub_url?.match(
          /([^\/_]+)(?=\.[a-zA-Z]+$)/,
        );

        if (!imgKeyMatch || !subKeyMatch) {
          throw new BilibiliAPIError(
            "Failed to extract WBI keys",
            "WBI_KEY_EXTRACT_FAILED",
          );
        }

        const imgKey = imgKeyMatch[0];
        const subKey = subKeyMatch[0];
        const mixKey = getMixKey(imgKey, subKey);

        // 缓存 WBI
        cachedWBI = {
          imgKey,
          subKey,
          mixKey,
          expireTime: now + CACHE_EXPIRATION_MS,
        };

        return { imgKey, subKey, mixKey };
      },
      {
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 10000,
        retryableStatusCodes: [408, 429, 500, 502, 503, 504],
        retryableErrorTypes: ["NetworkError", "TimeoutError", "AbortError"],
      },
    );
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new TimeoutError(
        `WBI request timeout: ${REQUEST_TIMEOUT_MS}ms`,
        REQUEST_TIMEOUT_MS,
      );
    }
    logger.error(
      "Error getting WBI",
      { error: error instanceof Error ? error.message : error },
      { type: "wbi-error" },
    );
    throw new NetworkError(
      "Failed to fetch WBI",
      error instanceof Error ? error : undefined,
      `${BASE_URL}/x/web-interface/nav`,
      error instanceof NetworkError ? error.statusCode : undefined,
    );
  }
}

/**
 * 生成 WBI 签名
 */
export function generateWBISign(
  params: Record<string, string | number>,
  mixKey: string,
): string {
  // 将参数按字典序排序
  const sortedParams = Object.keys(params)
    .sort()
    .reduce(
      (result, key) => {
        result[key] = params[key];
        return result;
      },
      {} as Record<string, string | number>,
    );

  // 构建 query 字符串
  const queryStr = Object.entries(sortedParams)
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  // 计算 w_rid（使用 MD5 哈希）
  const strToSign = queryStr + mixKey;
  const w_rid = md5Hash(strToSign);

  return w_rid;
}
