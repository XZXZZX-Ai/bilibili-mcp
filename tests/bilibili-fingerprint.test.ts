import { afterEach, expect, it, vi } from "vitest";

import { getBuvid } from "../src/bilibili/fingerprint.js";

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

it("clears the fingerprint request timeout when fetch rejects", async () => {
  vi.useFakeTimers();
  const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");
  const mockFetch = vi.fn(async () => {
    throw new TypeError("fetch failed");
  });
  vi.stubGlobal("fetch", mockFetch);

  await expect(getBuvid()).resolves.toBeNull();
  expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);
  expect(mockFetch).toHaveBeenCalledTimes(1);
});
