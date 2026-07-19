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
let admissionChain: Promise<void> = Promise.resolve();

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
  const previousTurn = admissionChain;
  const myTurn = previousTurn.then(() => waitForRateLimit());
  admissionChain = myTurn.catch(() => {});
  await previousTurn;

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

  try {
    await myTurn;
    return await fetchFn(controller);
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new TimeoutError(
        `Request timeout: ${REQUEST_TIMEOUT_MS}ms`,
        REQUEST_TIMEOUT_MS,
      );
    }
    if (error instanceof TypeError) {
      throw new NetworkError("Network request failed", error);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
    controller.abort(); // 确保 AbortController 被清理
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
  const authHeaders = credentialManager.getAuthHeaders();
  const data = await fetchWithoutWBI("/x/web-interface/nav", undefined, authHeaders);
  return { isLogin: (data as { isLogin?: unknown } | undefined)?.isLogin === true };
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

        logger.debug(
          "Sending WBI request",
          {
            url: url.toString(),
            headers: finalHeaders,
          },
          { type: "bilibili-http", operation: "fetchWithWBI" },
        );

        const response = await fetch(url.toString(), {
          headers: finalHeaders,
          signal: controller.signal,
        });

        if (!response.ok) {
          const errorMsg = `HTTP ${response.status}: ${response.statusText}`;
          logger.warn(
            "WBI request failed",
            {
              error: errorMsg,
              url: url.toString(),
              status: response.status,
              statusText: response.statusText,
            },
            { type: "bilibili-http", operation: "fetchWithWBI" },
          );
          throw new NetworkError(errorMsg, undefined, url.toString(), response.status);
        }

        const data = await response.json();

        if (data.code !== 0) {
          // Detect specific error types
          if (data.code === -101) {
            logger.warn(
              "Bilibili credentials appear expired",
              { url: url.toString(), code: data.code },
              { type: "bilibili-http", code: "COOKIE_EXPIRED" },
            );
            throw new BilibiliAPIError(
              "Current Bilibili credentials are expired or not logged in. Run \"npx -y @xzxzzx/bilibili-mcp@latest config\", then \"npx -y @xzxzzx/bilibili-mcp@latest check\", or update environment variables.",
              "COOKIE_EXPIRED",
              undefined,
              { code: data.code },
            );
          }

          if (data.code === -404 && data.message === "啥都木有") {
            logger.warn(
              "Bilibili API returned an error",
              {
                code: data.code,
                message: data.message,
                url: url.toString(),
                params,
              },
              { type: "bilibili-http", operation: "fetchWithWBI" },
            );
            throw new CommentsDisabledError(
              "该视频的评论功能已被禁用或限制访问",
            );
          }
          if (data.code === -403) {
            logger.warn(
              "Bilibili API returned an error",
              {
                code: data.code,
                message: data.message,
                url: url.toString(),
                params,
              },
              { type: "bilibili-http", operation: "fetchWithWBI" },
            );
            throw new BilibiliAPIError(
              data.message || "访问权限不足，请检查登录凭证是否有效",
              "ACCESS_DENIED",
              undefined,
              data,
            );
          }

          logger.warn(
            "Bilibili API returned an error",
            {
              code: data.code,
              message: data.message,
              url: url.toString(),
              params,
            },
            { type: "bilibili-http", operation: "fetchWithWBI" },
          );
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

        logger.error(
          "WBI request threw",
          {
            error: error instanceof Error ? error.message : String(error),
            path,
            params,
            url: tempUrl.toString(),
          },
          { type: "bilibili-http", operation: "fetchWithWBI" },
        );

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
  logger.debug(
    "fetchWithoutWBI request",
    { path, params },
    { type: "bilibili-http", operation: "fetchWithoutWBI" },
  );
  return retryableFetch(async () => {
    return throttledFetch(async (controller) => {
      try {
        const url = new URL(path, BASE_URL);
        if (params) {
          Object.entries(params).forEach(([key, value]) => {
            url.searchParams.append(key, String(value));
          });
        }
        logger.debug(
          "fetchWithoutWBI URL",
          { url: url.toString() },
          { type: "bilibili-http", operation: "fetchWithoutWBI" },
        );

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
            response.status,
          );
        }

        const data = await response.json();

        if (data.code !== 0) {
          // Detect specific error types
          if (data.code === -101) {
            logger.warn(
              "Bilibili credentials appear expired",
              { url: url.toString(), code: data.code },
              { type: "bilibili-http", code: "COOKIE_EXPIRED" },
            );
            throw new BilibiliAPIError(
              "Current Bilibili credentials are expired or not logged in. Run \"npx -y @xzxzzx/bilibili-mcp@latest config\", then \"npx -y @xzxzzx/bilibili-mcp@latest check\", or update environment variables.",
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
