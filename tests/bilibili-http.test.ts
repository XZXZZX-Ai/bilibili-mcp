import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const savedRateLimit = process.env.BILIBILI_RATE_LIMIT_MS;

beforeEach(async () => {
  vi.useFakeTimers();
  vi.resetModules();
  process.env.BILIBILI_RATE_LIMIT_MS = "500";
});

afterEach(() => {
  vi.useRealTimers();
  if (savedRateLimit === undefined) {
    delete process.env.BILIBILI_RATE_LIMIT_MS;
  } else {
    process.env.BILIBILI_RATE_LIMIT_MS = savedRateLimit;
  }
});

describe("throttledFetch", () => {
  it("serializes concurrent request admissions", async () => {
    const { throttledFetch } = await import("../src/bilibili/http.js");
    const starts: number[] = [];
    let resolveFirst!: (v: number) => void;
    const firstDone = new Promise<number>((resolve) => {
      resolveFirst = resolve;
    });

    const p1 = throttledFetch(async () => {
      starts.push(Date.now());
      return await firstDone;
    });
    const p2 = throttledFetch(async () => {
      starts.push(Date.now());
      return 2;
    });
    const p3 = throttledFetch(async () => {
      starts.push(Date.now());
      return 3;
    });

    await vi.advanceTimersByTimeAsync(500);
    await vi.advanceTimersByTimeAsync(500);
    await vi.advanceTimersByTimeAsync(500);

    // p2 and p3 admitted and resolved while p1 is still in-flight
    resolveFirst(1);
    const results = await Promise.all([p1, p2, p3]);
    expect(results).toEqual([1, 2, 3]);

    expect(starts).toHaveLength(3);
    expect(starts[1] - starts[0]).toBeGreaterThanOrEqual(500);
    expect(starts[2] - starts[1]).toBeGreaterThanOrEqual(500);
  });

  it("does not block subsequent admissions after a request failure", async () => {
    const { throttledFetch } = await import("../src/bilibili/http.js");
    const starts: number[] = [];

    const p1 = throttledFetch(async () => {
      starts.push(Date.now());
      throw new Error("boom");
    });
    p1.catch(() => {}); // suppress unhandled rejection until explicit expect below
    const p2 = throttledFetch(async () => {
      starts.push(Date.now());
      return "ok";
    });

    await vi.advanceTimersByTimeAsync(500);
    await vi.advanceTimersByTimeAsync(500);

    await expect(p1).rejects.toThrow("boom");
    const result = await p2;

    expect(result).toBe("ok");
    expect(starts).toHaveLength(2);
    expect(starts[1] - starts[0]).toBeGreaterThanOrEqual(500);
  });
});

describe("checkLoginStatus", () => {
  it("returns false for a successful logged-out nav response", async () => {
    const { checkLoginStatus } = await import("../src/bilibili/http.js");
    const originalFetch = globalThis.fetch;
    try {
      globalThis.fetch = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ code: 0, data: { isLogin: false } }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ) as typeof globalThis.fetch;

      const outcome = checkLoginStatus();
      await vi.advanceTimersByTimeAsync(500);
      await expect(outcome).resolves.toEqual({ isLogin: false });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("rejects with NetworkError for non-2xx login-status response", async () => {
    const { NetworkError } = await import("../src/utils/errors.js");
    const { checkLoginStatus } = await import("../src/bilibili/http.js");
    const originalFetch = globalThis.fetch;
    try {
      globalThis.fetch = vi.fn().mockResolvedValue(
        new Response("Forbidden", { status: 403 }),
      ) as typeof globalThis.fetch;

      const outcome = checkLoginStatus().catch((error: unknown) => error);
      await vi.runAllTimersAsync();
      const error = await outcome;
      expect(error).toBeInstanceOf(NetworkError);
      expect(error).toMatchObject({ statusCode: 403 });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

describe("throttledFetch TypeError normalization", () => {
  it("normalizes native fetch TypeError to NetworkError", async () => {
    const { NetworkError } = await import("../src/utils/errors.js");
    const { throttledFetch } = await import("../src/bilibili/http.js");
    const err = new TypeError("Failed to fetch");

    const outcome = throttledFetch(async () => { throw err; }).catch(
      (error: unknown) => error,
    );
    await vi.advanceTimersByTimeAsync(500);
    const error = await outcome;
    expect(error).toBeInstanceOf(NetworkError);
    expect(error).toMatchObject({ originalError: err });
  });
});
