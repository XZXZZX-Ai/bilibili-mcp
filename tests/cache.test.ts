import { describe, expect, it } from "vitest";
import { CacheManager } from "../src/utils/cache.js";

describe("CacheManager", () => {
  it("keeps primitive key generation stable", () => {
    const cache = new CacheManager();

    expect(
      cache.generateKey("comments", "BV1T6PQzQErF", "limit-5", "1", "true"),
    ).toBe("comments:BV1T6PQzQErF:limit-5:1:true");
  });

  it("keeps current object insertion-order serialization stable", () => {
    const cache = new CacheManager();

    expect(cache.generateKey("video", { lang: "zh-Hans" })).toBe(
      'video:{"lang":"zh-Hans"}',
    );
  });

  it("tracks video cache hits, misses, sets, deletes, and clear", () => {
    const cache = new CacheManager<{ title: string }>();

    expect(cache.getVideoInfo("missing")).toBeUndefined();
    cache.setVideoInfo("video-key", { title: "Test Video" });

    expect(cache.getVideoInfo("video-key")).toEqual({ title: "Test Video" });
    cache.deleteVideoInfo("video-key");
    expect(cache.getVideoInfo("video-key")).toBeUndefined();

    expect(cache.getStats()).toEqual({
      hits: 1,
      misses: 2,
      sets: 1,
      deletes: 1,
    });

    cache.clear();
    expect(cache.getStats()).toEqual({
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
    });
  });

  it("tracks comment cache values with a separate generic type", () => {
    const cache = new CacheManager<unknown, { comments: string[] }>();

    cache.setCommentInfo("comment-key", { comments: ["first"] });

    expect(cache.getCommentInfo("comment-key")).toEqual({
      comments: ["first"],
    });
  });
});
