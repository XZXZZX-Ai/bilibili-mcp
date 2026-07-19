// 视频元数据 wrapper
import { getVideoInfo, resolvePartCid } from "./client.js";
import { extractBVId } from "../utils/bvid.js";
import type { VideoMetadataData } from "./types.js";

/**
 * 获取视频元数据（不含字幕、评论），含多P pages 列表。
 */
export async function getVideoMetadataData(
  bvidOrUrl: string,
): Promise<VideoMetadataData> {
  const bvid = extractBVId(bvidOrUrl);
  const videoData = await getVideoInfo(bvid);
  const { pages } = await resolvePartCid(bvidOrUrl, undefined, videoData);

  const pubdate_timestamp = videoData.pubdate
    ? videoData.pubdate
    : undefined;
  const pubdate = pubdate_timestamp
    ? new Date(pubdate_timestamp * 1000).toISOString()
    : undefined;

  return {
    bvid,
    title: videoData.title,
    author: videoData.owner?.name,
    duration: videoData.duration,
    pubdate,
    pubdate_timestamp,
    description: videoData.desc || "",
    tags: videoData.tag?.map((t) => t.tag_name) || [],
    pages,
    stats: {
      view: videoData.stat?.view,
      like: videoData.stat?.like,
      coin: videoData.stat?.coin,
      favorite: videoData.stat?.favorite,
      share: videoData.stat?.share,
      reply: videoData.stat?.reply,
      danmaku: videoData.stat?.danmaku,
    },
  };
}
