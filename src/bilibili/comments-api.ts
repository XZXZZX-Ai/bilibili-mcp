// B站 评论 API
import { credentialManager } from "../utils/credentials.js";
import { getBuvid } from "./fingerprint.js";
import { fetchWithWBI, fetchWithoutWBI } from "./http.js";
import { getVideoInfo } from "./video-api.js";

/**
 * 获取视频评论
 */
export async function getVideoComments(
  videoUrlOrBvid: string,
  page: number = 1,
  pageSize: number = 20,
  sort: number = 1, // 0按时间，1按热度
  includeReplies: boolean = true,
) {
  const authHeaders = credentialManager.getAuthHeaders();

  // 解析视频URL或bvid
  let bvid: string;
  let isBangumi = false;

  if (videoUrlOrBvid.includes("bilibili.com")) {
    // 从URL中提取bvid
    const url = new URL(videoUrlOrBvid);
    const pathParts = url.pathname.split("/").filter(Boolean);

    if (pathParts.includes("bangumi")) {
      isBangumi = true;
    }

    // 提取bvid
    const bvidMatch = videoUrlOrBvid.match(/BV[0-9A-Za-z]{10}/);
    if (!bvidMatch) {
      throw new Error("无法从URL中提取BV号");
    }
    bvid = bvidMatch[0];
  } else {
    // 直接使用bvid
    bvid = videoUrlOrBvid;
  }

  // 获取视频信息，获取aid和cid
  const videoInfo = await getVideoInfo(bvid);
  const oid = videoInfo.aid || videoInfo.cid; // 优先使用aid作为oid

  // 确定type
  let type = "1"; // 默认视频类型
  if (isBangumi) {
    type = "2"; // 番剧类型
  }

  // 构建标准Referer
  const baseVideoUrl = `https://www.bilibili.com/video/${bvid}/`;

  // 构建评论API参数（fetchWithWBI 会自动添加 timestamp）
  const params = {
    oid: Number(oid),
    type,
    pn: page,
    ps: Math.min(pageSize, 20),
    sort: sort.toString(),
    mode: "3",
  };

  console.error("获取视频评论:", {
    bvid,
    oid: Number(oid),
    type,
    page,
    pageSize,
    sort,
    includeReplies,
    isBangumi,
  });

  // 构建自定义headers，包含标准Referer
  const customHeaders = {
    ...authHeaders,
    Referer: baseVideoUrl,
  };

  // 构建普通评论API参数（无需WBI签名）
  const plainParams = {
    oid: Number(oid),
    type: Number(type),
    pn: page,
    ps: Math.min(pageSize, 20),
    sort,
    mode: 3,
  };

  /**
   * 构建带 buvid 指纹的 headers 并调用普通评论API
   * buvid3/buvid4 用于规避 Bilibili 的 -352 风控验证
   */
  async function fetchCommentsWithFallback() {
    const buvid = await getBuvid();
    const buvidHeaders: Record<string, string> = { ...customHeaders };
    if (buvid) {
      const existingCookie = buvidHeaders["Cookie"] || "";
      const buvidCookie = `buvid3=${buvid.buvid3}; buvid4=${buvid.buvid4}`;
      buvidHeaders["Cookie"] = existingCookie
        ? `${existingCookie}; ${buvidCookie}`
        : buvidCookie;
    }
    return fetchWithoutWBI("/x/v2/reply/main", plainParams, buvidHeaders);
  }

  try {
    // 优先尝试带WBI签名的评论API（需要有效的登录Cookie）
    const wbiPath = "/x/v2/reply/wbi/main";
    console.error("尝试使用WBI评论API:", wbiPath);

    const mainResult = (await fetchWithWBI(
      wbiPath,
      params,
      customHeaders,
    )) as any;

    // 如果WBI接口成功但返回空评论（可能是Cookie过期导致未登录），
    // 则自动降级到无需鉴权的普通接口
    if (
      mainResult &&
      (!mainResult.replies || mainResult.replies.length === 0)
    ) {
      console.error(
        "WBI评论API返回空评论，降级到普通评论API（无需登录）",
      );
      return await fetchCommentsWithFallback();
    }

    return mainResult;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("❌ WBI评论API失败，降级到普通评论API:", errorMsg);

    // 降级到无需WBI签名的普通评论API（携带 buvid 以规避 -352 风控）
    try {
      return await fetchCommentsWithFallback();
    } catch (fallbackError) {
      const fallbackErrorMsg =
        fallbackError instanceof Error
          ? fallbackError.message
          : String(fallbackError);
      console.error("❌ 普通评论API也失败:", {
        error: fallbackErrorMsg,
        bvid,
        oid: Number(oid),
      });
      throw fallbackError;
    }
  }
}
