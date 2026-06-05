import { describe, expect, it, vi } from "vitest";

import { logger, redactSecrets } from "../src/utils/logger.js";

describe("logger secret redaction", () => {
  it("redacts Cookie fields by key and value pattern", () => {
    const redacted = redactSecrets({
      Cookie: "SESSDATA=real-sess; bili_jct=real-jct; DedeUserID=123456",
      nested: {
        message: "BILIBILI_SESSDATA=real-env",
      },
    });

    const serialized = JSON.stringify(redacted);

    expect(serialized).toContain('"Cookie":"***"');
    expect(serialized).not.toContain("real-sess");
    expect(serialized).not.toContain("real-jct");
    expect(serialized).not.toContain("123456");
    expect(serialized).not.toContain("real-env");
    expect(serialized).toContain("BILIBILI_SESSDATA=***");
  });

  it("redacts logger output before writing to stderr", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    logger.error("failed with SESSDATA=real-sess", {
      headers: {
        Cookie: "SESSDATA=real-sess; bili_jct=real-jct; DedeUserID=123456",
      },
    });

    const output = spy.mock.calls.map((call) => call.join(" ")).join("\n");
    spy.mockRestore();

    expect(output).not.toContain("real-sess");
    expect(output).not.toContain("real-jct");
    expect(output).not.toContain("123456");
    expect(output).toContain("SESSDATA=***");
    expect(output).toContain('"Cookie":"***"');
  });
});
