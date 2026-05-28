import { describe, expect, it } from "vitest";
import {
  containsBVId,
  createVideoUrl,
  extractBVId,
  isValidBVId,
  normalizeBVId,
  validateBVId,
} from "../src/utils/bvid.js";

describe("extractBVId", () => {
  it("extracts from a plain BV id", () => {
    expect(extractBVId("BV1T6PQzQErF")).toBe("BV1T6PQzQErF");
  });

  it("extracts BV id from a Bilibili URL", () => {
    expect(extractBVId("https://www.bilibili.com/video/BV1T6PQzQErF/")).toBe(
      "BV1T6PQzQErF",
    );
  });

  it("throws on empty input", () => {
    expect(() => extractBVId("")).toThrow("Input cannot be empty");
  });

  it("throws on invalid input with no BV pattern", () => {
    expect(() => extractBVId("not-a-video")).toThrow(
      "Invalid Bilibili video ID or URL",
    );
  });

  it("extracts BV id embedded in longer text", () => {
    expect(extractBVId("watch BV1xx2yy3zz4 now")).toBe("BV1xx2yy3zz4");
  });
});

describe("isValidBVId", () => {
  it("accepts mixed-case BV id", () => {
    expect(isValidBVId("BV1T6PQzQErF")).toBe(true);
  });

  it("rejects lowercase BV prefix", () => {
    expect(isValidBVId("bv1t6pqzqerf")).toBe(false);
  });

  it("rejects empty string", () => {
    expect(isValidBVId("")).toBe(false);
  });

  it("rejects too-short BV id", () => {
    expect(isValidBVId("BV123")).toBe(false);
  });

  it("rejects non-BV prefix", () => {
    expect(isValidBVId("AV1234567890")).toBe(false);
  });
});

describe("validateBVId", () => {
  it("passes for valid BV id", () => {
    expect(() => validateBVId("BV1T6PQzQErF")).not.toThrow();
  });

  it("throws on empty input", () => {
    expect(() => validateBVId("")).toThrow("BV ID cannot be empty");
  });

  it("throws on wrong length", () => {
    expect(() => validateBVId("BV123")).toThrow("Invalid BV ID length");
  });

  it("throws on invalid format", () => {
    expect(() => validateBVId("BV123456789!")).toThrow(
      "Invalid BV ID format",
    );
  });
});

describe("normalizeBVId", () => {
  it("uppercases a mixed-case BV id", () => {
    expect(normalizeBVId("BV1t6PqzQeRF")).toBe("BV1T6PQZQERF");
  });

  it("trims whitespace", () => {
    expect(normalizeBVId("  BV1T6PQzQErF  ")).toBe("BV1T6PQZQERF");
  });

  it("throws on empty input", () => {
    expect(() => normalizeBVId("")).toThrow("Input cannot be empty");
  });
});

describe("containsBVId", () => {
  it("detects BV id in text", () => {
    expect(containsBVId("watch BV1T6PQzQErF now")).toBe(true);
  });

  it("returns false when no BV pattern", () => {
    expect(containsBVId("watch av123 now")).toBe(false);
  });

  it("returns false for empty input", () => {
    expect(containsBVId("")).toBe(false);
  });
});

describe("createVideoUrl", () => {
  it("creates standard bilibili video URL from mixed-case BV id", () => {
    expect(createVideoUrl("BV1t6PqzQeRF")).toBe(
      "https://www.bilibili.com/video/BV1T6PQZQERF",
    );
  });
});
