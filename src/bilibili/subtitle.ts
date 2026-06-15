// 字幕处理逻辑
import { getVideoInfo, getVideoSubtitle, getSubtitleContent, checkLoginStatus } from "./client.js";
import { extractBVId } from "../utils/bvid.js";
import { cacheManager } from "../utils/cache.js";
import { BilibiliAPIError, NoSubtitleError, PaidVideoError } from "../utils/errors.js";
import { logger, redactSecrets } from "../utils/logger.js";
import type {
  BilibiliSubtitleItem,
  BilibiliVideoInfoData,
  SubtitleBodyItem,
  VideoTranscriptData,
} from "./types.js";


export interface SubtitleData {
  data_source: "subtitle" | "description";
  video_info: {
    title: string;
    description: string;
    tags: string[];
    subtitle_text?: string;
    pubdate?: string;  // ISO 8601 格式的发布日期
    pubdate_timestamp?: number;  // Unix 时间戳
  };
}

/**
 * 字幕语言优先级
 */
const LANGUAGE_PRIORITY = ["zh-Hans", "ai-zh", "zh-CN", "zh-Hant", "en"];
const MAX_SUBTITLE_BODY_ITEMS = 5_000;
const MAX_SUBTITLE_TEXT_LENGTH = 500_000;

/**
 * 将 Unix 时间戳转换为 ISO 8601 格式日期字符串
 */
function formatPublishDate(timestamp: number): string {
  const date = new Date(timestamp * 1000); // B站返回的是秒级时间戳
  return date.toISOString();
}



/**
 * 选择最佳字幕语言
 */
function selectBestSubtitle(
  subtitles: BilibiliSubtitleItem[],
  preferredLang?: string,
): BilibiliSubtitleItem | null {
  if (!subtitles || subtitles.length === 0) {
    return null;
  }

  // 如果用户指定了偏好语言，优先使用
  if (preferredLang) {
    const preferred = subtitles.find((s) => s.lan === preferredLang || s.lan_doc.includes(preferredLang));
    if (preferred) {
      return preferred;
    }
  }

  // 按优先级选择
  for (const lang of LANGUAGE_PRIORITY) {
    const subtitle = subtitles.find((s) => s.lan === lang || s.lan.includes(lang));
    if (subtitle) {
      return subtitle;
    }
  }

  // 如果没有匹配的语言，返回第一个
  return subtitles[0];
}

/**
 * 合并字幕内容为文本
 */
function mergeSubtitleText(
  body: SubtitleBodyItem[]
): string {
  if (body.length > MAX_SUBTITLE_BODY_ITEMS) {
    throw new Error("Subtitle body item count exceeds maximum limit");
  }

  const parts: string[] = [];
  let totalLength = 0;

  for (const item of body) {
    const content = item.content ?? "";
    totalLength += content.length;
    if (parts.length > 0) {
      totalLength += 1;
    }
    if (totalLength > MAX_SUBTITLE_TEXT_LENGTH) {
      throw new Error("Subtitle text exceeds maximum length");
    }
    parts.push(content);
  }

  return parts.join("\n");
}

/**
 * 提取视频标签
 */
function extractTags(videoData: BilibiliVideoInfoData): string[] {
  const tags = videoData.tag ?? [];
  return tags.map((tag) => tag.tag_name);
}

/**
 * 获取纯视频转录文本（新 API）
 *
 * 不自动降级到描述。如果字幕不可用：
 * - fallbackToDescription=false -> throw NoSubtitleError
 * - fallbackToDescription=true -> return description text
 * - COOKIE_EXPIRED 错误始终向上传播
 */
export async function getVideoTranscriptData(
  bvidOrUrl: string,
  preferredLang?: string,
  fallbackToDescription = false,
): Promise<VideoTranscriptData> {
  const bvid = extractBVId(bvidOrUrl);
  const videoData = (await getVideoInfo(bvid)) as BilibiliVideoInfoData;
  const title = videoData.title;
  const description = videoData.desc || "";
  const cid = videoData.cid;

  // 获取字幕列表
  try {
    const subtitleData = await getVideoSubtitle(bvid, cid);

    if (
      !subtitleData?.subtitle?.subtitles ||
      subtitleData.subtitle.subtitles.length === 0
    ) {
      if (fallbackToDescription) {
        return {
          bvid,
          data_source: "description",
          transcript: description,
          title,
        };
      }
      throw new NoSubtitleError(
        `Video ${bvid} has no subtitles available`,
      );
    }

    const bestSubtitle = selectBestSubtitle(
      subtitleData.subtitle.subtitles,
      preferredLang,
    );

    if (!bestSubtitle) {
      if (fallbackToDescription) {
        return {
          bvid,
          data_source: "description",
          transcript: description,
          title,
        };
      }
      throw new NoSubtitleError(
        `No suitable subtitle found for video ${bvid}`,
      );
    }

    const subtitleContent = await getSubtitleContent(
      bestSubtitle.subtitle_url,
    );

    if (!subtitleContent?.body || subtitleContent.body.length === 0) {
      if (fallbackToDescription) {
        return {
          bvid,
          data_source: "description",
          transcript: description,
          title,
        };
      }
      throw new NoSubtitleError(
        `Subtitle body is empty for video ${bvid}`,
      );
    }

    const transcript = mergeSubtitleText(subtitleContent.body);

    return {
      bvid,
      data_source: "subtitle",
      language: bestSubtitle.lan,
      transcript,
      title,
    };
  } catch (error) {
    // COOKIE_EXPIRED must propagate
    if (
      error instanceof BilibiliAPIError &&
      error.code === "COOKIE_EXPIRED"
    ) {
      throw error;
    }
    // NoSubtitleError: only rethrow if fallback disabled
    if (error instanceof NoSubtitleError) {
      if (!fallbackToDescription) throw error;
      return {
        bvid,
        data_source: "description",
        transcript: description,
        title,
      };
    }
    // Other errors: fallback to description if enabled, else rethrow
    if (fallbackToDescription) {
      return {
        bvid,
        data_source: "description",
        transcript: description,
        title,
      };
    }
    throw error;
  }
}

/**
 * 获取视频信息及字幕
 */
export async function getVideoInfoWithSubtitle(
  bvidOrUrl: string,
  preferredLang?: string
): Promise<SubtitleData> {
  try {
    const bvid = extractBVId(bvidOrUrl);
    
    // 生成缓存键
    const cacheKey = cacheManager.generateKey('video', bvid, preferredLang);
    
    // 尝试从缓存获取
    const cachedData = cacheManager.getVideoInfo(cacheKey) as SubtitleData | undefined;
    if (cachedData) {
      logger.debug("Video cache hit", { bvid, cacheKey }, { type: "subtitle" });
      return cachedData;
    }

    logger.debug("Video cache miss", { bvid, cacheKey }, { type: "subtitle" });

    // 获取视频基本信息
    const videoData = (await getVideoInfo(bvid)) as BilibiliVideoInfoData;

    const title = videoData.title;
    const description = videoData.desc || "";
    const tags = extractTags(videoData);
    const cid = videoData.cid;
    const pubdate = videoData.pubdate;  // Unix 时间戳（秒）
    const formattedDate = pubdate ? formatPublishDate(pubdate) : undefined;

    // 移除对付费视频的硬性拦截，因为即使是需要登录或付费的视频，API 有时也会返回 AI 字幕（至少登录状态下提供）
    // 旧逻辑会在这里直接退出并返回描述，现在我们让它继续尝试去调取 subtitle 接口。
    if (videoData.need_login_subtitle || videoData.preview_toast?.includes("付费")) {
      console.warn(`Video ${bvid} has 'need_login_subtitle' or '付费' flag. Will still attempt to fetch subtitles.`);
      // 仅用于调试，不中断流程
    }

    // 尝试获取字幕
    try {
      const subtitleData = await getVideoSubtitle(bvid, cid);

      if (!subtitleData?.subtitle?.subtitles || subtitleData.subtitle.subtitles.length === 0) {
        // 字幕列表为空。主动调用 /x/web-interface/nav 验证登录状态。
        // 理由：B站不会因 Cookie 无效就返回 -101，而是静默降级——字幕列表返回空。
        // 通过核实登录状态，我们可以区分两种情况：
        //   1. 已登录但视频确实无字幕 → 合法降级
        //   2. 未登录（Cookie 过期）→ 抛出明确错误，拒绝静默降级
        logger.warn(
          "Video returned no subtitles; verifying login status",
          { bvid },
          { type: "subtitle" },
        );
        const { isLogin } = await checkLoginStatus();
        if (!isLogin) {
          throw new BilibiliAPIError(
            `Video ${bvid} returned an empty subtitle list and current Bilibili credentials are not logged in. Run "npx -y @xzxzzx/bilibili-mcp config", then "npx -y @xzxzzx/bilibili-mcp check", or update environment variables.`,
            'COOKIE_EXPIRED',
            undefined,
            { code: -101, bvid }
          );
        }

        // 已登录但视频本身无字幕，使用简介降级
        logger.info(
          "Video has no subtitles while credentials are logged in",
          { bvid },
          { type: "subtitle" },
        );

        const result: SubtitleData = {
          data_source: "description",
          video_info: {
            title,
            description: description || "该视频没有可用的简介",
            tags: tags.length > 0 ? tags : ["无标签"],
            pubdate: formattedDate,
            pubdate_timestamp: pubdate,
          },
        };
        // 不缓存无字幕结果，以便下次重试时能拉取最新生成的字幕
        logger.debug(
          "Not caching fallback result to allow future retries",
          { bvid },
          { type: "subtitle" },
        );
        return result;
      }

      // 选择最佳字幕
      const bestSubtitle = selectBestSubtitle(subtitleData.subtitle.subtitles, preferredLang);

      if (!bestSubtitle) {
        const result: SubtitleData = {
          data_source: "description",
          video_info: {
            title,
            description: description || "该视频没有可用的简介",
            tags: tags.length > 0 ? tags : ["无标签"],
            pubdate: formattedDate,
            pubdate_timestamp: pubdate,
          },
        };
        // 不缓存无字幕结果，以便下次重试时能拉取最新生成的字幕
        logger.debug(
          "Not caching fallback result to allow future retries",
          { bvid },
          { type: "subtitle" },
        );
        return result;
      }

      // 获取字幕内容
      const subtitleContent = await getSubtitleContent(bestSubtitle.subtitle_url);

      if (!subtitleContent?.body || subtitleContent.body.length === 0) {
        const result: SubtitleData = {
          data_source: "description",
          video_info: {
            title,
            description: description || "该视频没有可用的简介",
            tags: tags.length > 0 ? tags : ["无标签"],
            pubdate: formattedDate,
            pubdate_timestamp: pubdate,
          },
        };
        // 不缓存无字幕结果，以便下次重试时能拉取最新生成的字幕
        logger.debug(
          "Not caching fallback result to allow future retries",
          { bvid },
          { type: "subtitle" },
        );
        return result;
      }

      // 合并字幕文本
      const subtitleText = mergeSubtitleText(subtitleContent.body);

      const result: SubtitleData = {
        data_source: "subtitle",
        video_info: {
          title,
          description,
          tags,
          subtitle_text: subtitleText,
          pubdate: formattedDate,
          pubdate_timestamp: pubdate,
        },
      };
      // 存入缓存
      cacheManager.setVideoInfo(cacheKey, result);
      return result;
    } catch (error) {
      // COOKIE_EXPIRED 错误必须向上传播，不能静默降级
      if (error instanceof BilibiliAPIError && error.code === 'COOKIE_EXPIRED') {
        throw error;
      }
      // 其他字幕获取失败，使用简介作为降级方案
      logger.warn(
        "Failed to fetch subtitles, using description fallback",
        { bvid, error: error instanceof Error ? error.message : error },
        { type: "subtitle" },
      );

      const result: SubtitleData = {
        data_source: "description",
        video_info: {
          title,
          description: description || "该视频没有可用的简介",
          tags: tags.length > 0 ? tags : ["无标签"],
          pubdate: formattedDate,
          pubdate_timestamp: pubdate,
        },
      };
      // 成功获取到字幕，存入缓存
      cacheManager.setVideoInfo(cacheKey, result);
      return result;
    }
  } catch (error) {
    logger.error(
      "Error getting video info with subtitle",
      { error: redactSecrets(error) },
      { type: "subtitle" },
    );
    throw error;
  }
}
