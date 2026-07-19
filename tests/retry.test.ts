import { describe, expect, it, vi } from "vitest";
import { withRetry } from "../src/utils/retry.js";
import { NetworkError } from "../src/utils/errors.js";

describe("retry status-code precedence", () => {
  it.each([
    ["non-retryable status 403", 403, 1],
    ["retryable status 503", 503, 4],
    ["status-less NetworkError", undefined, 4],
  ] as const)("handles %s", async (_name, statusCode, expectedAttempts) => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      let attempts = 0;
      const err = await withRetry(
        async () => {
          attempts++;
          throw new NetworkError("Request failed", undefined, undefined, statusCode);
        },
        { maxRetries: 3, baseDelay: 0, maxDelay: 0 },
      ).catch((e: unknown) => e);

      expect(attempts).toBe(expectedAttempts);
      expect(err).toBeInstanceOf(NetworkError);
      expect(err).toMatchObject({ statusCode });
    } finally {
      spy.mockRestore();
    }
  });
});
