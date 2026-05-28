import { describe, expect, it } from "vitest";
import { sanitizeBVInput, sanitizeInput } from "../src/utils/sanitization.js";

describe("sanitizeInput", () => {
  it("returns empty string unchanged", () => {
    expect(sanitizeInput("")).toBe("");
  });

  it("returns safe alphanumeric input unchanged", () => {
    expect(sanitizeInput("hello123")).toBe("hello123");
  });

  it("removes control characters", () => {
    expect(sanitizeInput("hello\x00world")).toBe("helloworld");
  });

  it("throws on unsafe characters", () => {
    expect(() => sanitizeInput("hello<world>")).toThrow(
      "Input contains unsafe characters",
    );
  });
});

describe("sanitizeBVInput", () => {
  it("trims leading whitespace", () => {
    expect(sanitizeBVInput("  BV1T6PQzQErF  ")).toBe("BV1T6PQzQErF");
  });

  it("removes control characters and trims", () => {
    expect(sanitizeBVInput("\x01BV1T6PQzQErF ")).toBe("BV1T6PQzQErF");
  });

  it("throws on angle brackets in BV input", () => {
    expect(() => sanitizeBVInput("BV1T6PQzQ<ErF>")).toThrow(
      "Input contains unsafe characters",
    );
  });
});
