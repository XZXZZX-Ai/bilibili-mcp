// B站 API HTTP 层：限流、重试、WBI 签名请求、普通请求
import { config } from "../config.js";
import {
  BilibiliAPIError,
  CommentsDisabledError,
  NetworkError,
  PaidVideoError,
  TimeoutError,
} from "../utils/errors.js";
import { logger } from "../utils/logger.js";
import { withRetry } from "../utils/retry.js";
import { credentialManager } from "../utils/credentials.js";
import { generateWBISign, getWBI } from "./wbi.js";

const BASE_URL = config.baseUrl;

// 请求限流 - 避免高频请求被 Bilibili 限制
const RATE_LIMIT_MS = config.rateLimitMs;
const REQUEST_TIMEOUT_MS = config.requestTimeoutMs;
let lastRequestTime = 0;
let pendingPromise: Promise<void> | null = null;

/**
 * 等待到下一个允许请求的时间
 */
async function waitForRateLimit(): Promise<void> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;

  if (timeSinceLastRequest < RATE_LIMIT_MS) {
    const waitTime = RATE_LIMIT_MS - timeSinceLastRequest;
    await new Promise<void>((resolve) => setTimeout(resolve, waitTime));
  }

  lastRequestTime = Date.now();
}

/**
 * 带限流和超时控制的请求包装器
 */
export async function throttledFetch<T>(
  fetchFn: (controller: AbortController) => Promise<T>,
): Promise<T> {
  // 等待上一个请求完成
  if (pendingPromise) {
    await pendingPromise;
  }

  // 创建 AbortController 用于超时控制
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
    logger.error(
      `Request timeout after ${REQUEST_TIMEOUT_MS}ms`,
      {},
      { type: "request-timeout" },
    );
  }, REQUEST_TIMEOUT_MS);

  // 创建新的请求
  pendingPromise = (async () => {
    await waitForRateLimit();
  })();

  try {
    await pendingPromise;
    return await fetchFn(controller);
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new TimeoutError(
        `Request timeout: ${REQUEST_TIMEOUT_MS}ms`,
        REQUEST_TIMEOUT_MS,
      );
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
    controller.abort(); // 确保 AbortController 被清理
    pendingPromise = null;
  }
}

/**
 * 带重试机制的请求包装器
 */
export async function retryableFetch<T>(fetchFn: () => Promise<T>): Promise<T> {
  return withRetry(() => fetchFn(), {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    retryableStatusCodes: [408, 429, 500, 502, 503, 504],
    retryableErrorTypes: ["NetworkError", "TimeoutError", "AbortError"],
  });
}

/**
 * 检查当前 Cookie 是否处于登录状态。
 * 该函数不会在日志或错误信息中输出任何 Cookie 内容。
 */
export async function checkLoginStatus(): Promise<{ isLogin: boolean }> {
  try {
    const authHeaders = credentialManager.getAuthHeaders();
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      config.requestTimeoutMs,
    );
    const resp = await fetch(`${BASE_URL}/x/web-interface/nav`, {
      headers: {
        "User-Agent": config.userAgent,
        Referer: config.referer,
        ...authHeaders,
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!resp.ok) return { isLogin: false };
    const data = await resp.json();
    return { isLogin: data?.data?.isLogin === true };
  } catch {
    // 网络问题或超时，保守地认为登录状态未知，返回 false
    return { isLogin: false };
  }
}

/**
 * 带有 WBI 签名的 GET 请求
 */
export async function fetchWithWBI(
  path: string,
  params: Record<string, string | number>,
  additionalHeaders: Record<string, string> = {},
): Promise<unknown> {
  return retryableFetch(async () => {
    return throttledFetch(async (controller) => {
      try {
        const { mixKey } = await getWBI();

        // 添加时间戳参数（WBI 要求 Unix 秒级时间戳，不是毫秒）
        params = { ...params, timestamp: Math.floor(Date.now() / 1000) };

        // 生成签名
        const w_rid = generateWBISign(params, mixKey);

        // 构建 URL
        const url = new URL(path, BASE_URL);
        Object.entries({ ...params, w_rid }).forEach(([key, value]) => {
          url.searchParams.append(key, String(value));
        });

        const finalHeaders = {
          "User-Agent": config.userAgent,
          Referer: additionalHeaders.Referer || config.referer,
          Accept: "application/json",
          ...additionalHeaders,
        };

        // 构建安全的headers日志（隐藏敏感信息）
        const safeHeaders: Record<string, string> = {};
        Object.entries(finalHeaders).forEach(([key, value]) => {
          if (key === "Cookie") {
            safeHeaders[key] = "***";
          } else {
            safeHeaders[key] = value;
          }
        });

        console.error("发送WBI请求:", {
          url: url.toString(),
          headers: safeHeaders,
        });

        const response = await fetch(url.toString(), {
          headers: finalHeaders,
          signal: controller.signal,
        });

        if (!response.ok) {
          const errorMsg = `HTTP ${response.status}: ${response.statusText}`;
          console.error("❌ WBI请求失败:", {
            error: errorMsg,
            url: url.toString(),
            status: response.status,
            statusText: response.statusText,
          });
          throw new NetworkError(errorMsg, undefined, url.toString());
        }

        const data = await response.json();

        if (data.code !== 0) {
          // Detect specific error types
          if (data.code === -101) {
            console.error("❌ 检测到 Bilibili Cookie 已过期或失效 (-101):", {
              url: url.toString(),
            });
            throw new BilibiliAPIError(
              "检测到当前 Bilibili Cookie 已失效（未登录），请更新配置。",
              "COOKIE_EXPIRED",
              undefined,
              { code: data.code },
            );
          }

          if (data.code === -404 && data.message === "啥都木有") {
            console.error("❌ 评论API返回错误:", {
              code: data.code,
              message: data.message,
              url: url.toString(),
              params,
            });
            throw new CommentsDisabledError(
              "该视频的评论功能已被禁用或限制访问",
            );
          }
          if (data.code === -403) {
            console.error("❌ API返回权限错误(-403):", {
              code: data.code,
              message: data.message,
              url: url.toString(),
              params,
            });
            throw new BilibiliAPIError(
              data.message || "访问权限不足，请检查登录凭证是否有效",
              "ACCESS_DENIED",
              undefined,
              data,
            );
          }

          console.error("❌ 评论API返回错误:", {
            code: data.code,
            message: data.message,
            url: url.toString(),
            params,
          });
          throw new BilibiliAPIError(
            data.message || "Unknown error",
            "API_ERROR",
            undefined,
            data,
          );
        }

        return data.data;
      } catch (error) {
        // 构建URL用于错误日志
        const tempUrl = new URL(path, BASE_URL);
        Object.entries(params).forEach(([key, value]) => {
          tempUrl.searchParams.append(key, String(value));
        });

        console.error("❌ WBI请求异常:", {
          error: error instanceof Error ? error.message : String(error),
          path,
          params,
          url: tempUrl.toString(),
        });

        logger.error(
          `Error fetching ${path}`,
          { error: error instanceof Error ? error.message : error },
          { type: "fetch-error", path },
        );
        throw error;
      }
    });
  });
}

/**
 * 普通的 GET 请求（不需要 WBI 签名）
 */
export async function fetchWithoutWBI(
  path: string,
  params?: Record<string, string | number>,
  additionalHeaders: Record<string, string> = {},
): Promise<unknown> {
  console.error(`[DEBUG] fetchWithoutWBI: ${path}`, params);
  return retryableFetch(async () => {
    return throttledFetch(async (controller) => {
      try {
        const url = new URL(path, BASE_URL);
        if (params) {
          Object.entries(params).forEach(([key, value]) => {
            url.searchParams.append(key, String(value));
          });
        }
        console.error(`[DEBUG] Fetching URL: ${url.toString()}`);

        const response = await fetch(url.toString(), {
          headers: {
            "User-Agent": config.userAgent,
            Referer: config.referer,
            Accept: "application/json",
            ...additionalHeaders,
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new NetworkError(
            `HTTP ${response.status}: ${response.statusText}`,
            undefined,
            url.toString(),
          );
        }

        const data = await response.json();

        if (data.code !== 0) {
          // Detect specific error types
          if (data.code === -101) {
            console.error("❌ 检测到 Bilibili Cookie 已过期或失效 (-101):", {
              url: url.toString(),
            });
            throw new BilibiliAPIError(
              "检测到当前 Bilibili Cookie 已失效（未登录），请更新配置。",
              "COOKIE_EXPIRED",
              undefined,
              { code: data.code },
            );
          }

          if (data.code === -404 && data.message === "啥都木有") {
            throw new CommentsDisabledError(
              "该视频的评论功能已被禁用或限制访问",
            );
          }
          if (data.code === -403) {
            throw new PaidVideoError(
              "该视频为付费内容，无法获取完整信息",
            );
          }
          throw new BilibiliAPIError(
            data.message || "Unknown error",
            "API_ERROR",
            undefined,
            data,
          );
        }

        return data.data;
      } catch (error) {
        logger.error(
          `Error fetching ${path}`,
          { error: error instanceof Error ? error.message : error },
          { type: "fetch-error", path },
        );
        throw error;
      }
    });
  });
}
