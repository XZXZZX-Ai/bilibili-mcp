import { afterEach, expect, it, vi } from "vitest";

import { getWBI } from "../src/bilibili/wbi.js";

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

it("retries WBI HTTP 503 four times and preserves status 503", async () => {
  vi.useFakeTimers();
  const fetchMock = vi.fn(async () =>
    new Response(null, { status: 503, statusText: "Service Unavailable" }),
  );
  vi.stubGlobal("fetch", fetchMock);

  const result = getWBI().catch((error: unknown) => error);

  await vi.runAllTimersAsync();
  await expect(result).resolves.toMatchObject({ statusCode: 503 });
  expect(fetchMock).toHaveBeenCalledTimes(4);
});

it("retries WBI AbortError four times and returns TimeoutError", async () => {
  vi.useFakeTimers();
  const abortError = new DOMException("The operation was aborted.", "AbortError");
  const fetchMock = vi.fn(async () => {
    throw abortError;
  });
  vi.stubGlobal("fetch", fetchMock);

  const result = getWBI().catch((error: unknown) => error);

  await vi.runAllTimersAsync();
  await expect(result).resolves.toMatchObject({ name: "TimeoutError" });
  expect(fetchMock).toHaveBeenCalledTimes(4);
});

it("does not retry a non-retryable WBI HTTP status", async () => {
  vi.useFakeTimers();
  const fetchMock = vi.fn(async () =>
    new Response(null, { status: 403, statusText: "Forbidden" }),
  );
  vi.stubGlobal("fetch", fetchMock);

  const result = getWBI().catch((error: unknown) => error);

  await vi.runAllTimersAsync();
  await expect(result).resolves.toMatchObject({ statusCode: 403 });
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

it("retries WBI transport failures and clears each request timeout", async () => {
  vi.useFakeTimers();
  const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");
  const fetchMock = vi.fn(async () => {
    throw new TypeError("fetch failed");
  });
  vi.stubGlobal("fetch", fetchMock);

  const result = getWBI().catch((error: unknown) => error);

  await vi.runAllTimersAsync();
  await expect(result).resolves.toMatchObject({
    name: "NetworkError",
    statusCode: undefined,
  });
  expect(clearTimeoutSpy).toHaveBeenCalledTimes(4);
  expect(fetchMock).toHaveBeenCalledTimes(4);
});
