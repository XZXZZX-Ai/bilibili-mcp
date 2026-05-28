// B站 API 客户端 — 兼容性 re-export
export { checkLoginStatus, fetchWithWBI, fetchWithoutWBI } from "./http.js";
export {
  getSubtitleContent,
  getVideoInfo,
  getVideoSubtitle,
} from "./video-api.js";
export { getVideoComments } from "./comments-api.js";
