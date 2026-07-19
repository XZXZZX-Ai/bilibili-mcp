// Bilibili 视频章节（view_points）检索
import { getPlayerData, matchPartIdentity, resolvePartCid } from "./client.js";
import { extractBVId } from "../utils/bvid.js";
import type { ChapterInfo, VideoChaptersData } from "./types.js";

const MAX_CHAPTER_TITLE_LENGTH = 500;
const MAX_CHAPTERS = 200;

/**
 * 获取 Bilibili 提供的视频章节（进度条分段）。
 * 无章节时返回 chapters: []。
 * 播放器/网络错误向上传播，不静默吞掉。
 */
export async function getVideoChaptersData(
  bvidOrUrl: string,
  page?: number,
): Promise<VideoChaptersData> {
  const bvid = extractBVId(bvidOrUrl);
  const { cid, pages, videoData } = await resolvePartCid(bvidOrUrl, page);

  const { page: displayPage, title: displayTitle } = matchPartIdentity(cid, pages, videoData.title);

  const playerData = await getPlayerData(bvid, cid);
  const viewPoints = playerData?.view_points;
  const chapters: ChapterInfo[] = [];

  if (viewPoints && viewPoints.length > 0) {
    for (const vp of viewPoints.slice(0, MAX_CHAPTERS)) {
      chapters.push({
        title: ((vp as Record<string, unknown>).content as string || vp.title || "").slice(0, MAX_CHAPTER_TITLE_LENGTH),
        start_seconds: vp.from,
        end_seconds: vp.to,
      });
    }
  }

  return {
    bvid,
    page: displayPage,
    cid,
    title: displayTitle,
    chapters,
  };
}
