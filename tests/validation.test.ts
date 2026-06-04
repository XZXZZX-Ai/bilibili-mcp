import { describe, expect, it } from "vitest";
import {
  validateBVInput,
  validateCommentLimit,
  validateCommentSort,
  validateDetailLevel,
  validateLanguage,
  validateLength,
} from "../src/utils/validation.js";

describe("validateBVInput", () => {
  it("accepts plain BV id", () => {
    expect(() => validateBVInput("BV1T6PQzQErF")).not.toThrow();
  });

  it("accepts Bilibili video URL", () => {
    expect(() =>
      validateBVInput("https://www.bilibili.com/video/BV1T6PQzQErF/"),
    ).not.toThrow();
  });

  it("accepts b23.tv short link", () => {
    expect(() => validateBVInput("https://b23.tv/abc123")).not.toThrow();
  });

  it("rejects input without BV or bilibili URL", () => {
    expect(() => validateBVInput("hello")).toThrow(
      "Input must contain BV ID or Bilibili URL",
    );
  });
});

describe("validateLanguage", () => {
  it("does nothing when lang is undefined", () => {
    expect(() => validateLanguage(undefined)).not.toThrow();
  });

  it("accepts two-letter language code", () => {
    expect(() => validateLanguage("en")).not.toThrow();
  });

  it("accepts language code with region subtag", () => {
    expect(() => validateLanguage("zh-Hans")).not.toThrow();
  });

  it("rejects Chinese characters", () => {
    expect(() => validateLanguage("中文")).toThrow(
      "Invalid language code format",
    );
  });

  it("rejects numeric-only input", () => {
    expect(() => validateLanguage("1234")).toThrow(
      "Invalid language code format",
    );
  });
});

describe("validateDetailLevel", () => {
  it("does nothing when level is undefined", () => {
    expect(() => validateDetailLevel(undefined)).not.toThrow();
  });

  it("accepts brief", () => {
    expect(() => validateDetailLevel("brief")).not.toThrow();
  });

  it("accepts detailed", () => {
    expect(() => validateDetailLevel("detailed")).not.toThrow();
  });

  it("rejects full", () => {
    expect(() => validateDetailLevel("full")).toThrow(
      'Invalid detail level: must be "brief" or "detailed"',
    );
  });

  it("rejects arbitrary string", () => {
    expect(() => validateDetailLevel("summary")).toThrow(
      'Invalid detail level: must be "brief" or "detailed"',
    );
  });
});

describe("validateCommentLimit", () => {
  it("does nothing when limit is undefined", () => {
    expect(() => validateCommentLimit(undefined)).not.toThrow();
  });

  it("accepts minimum value 1", () => {
    expect(() => validateCommentLimit(1)).not.toThrow();
  });

  it("accepts maximum value 50", () => {
    expect(() => validateCommentLimit(50)).not.toThrow();
  });

  it("rejects 0", () => {
    expect(() => validateCommentLimit(0)).toThrow(
      "Comment limit must be between 1 and 50",
    );
  });

  it("rejects negative value", () => {
    expect(() => validateCommentLimit(-1)).toThrow(
      "Comment limit must be between 1 and 50",
    );
  });

  it("rejects non-integer", () => {
    expect(() => validateCommentLimit(1.5)).toThrow(
      "Comment limit must be an integer between 1 and 50",
    );
  });

  it("rejects value above 50", () => {
    expect(() => validateCommentLimit(51)).toThrow(
      "Comment limit must be between 1 and 50",
    );
  });

  it("rejects non-number input", () => {
    expect(() =>
      validateCommentLimit("10" as unknown as number),
    ).toThrow("Comment limit must be an integer between 1 and 50");
  });
});

describe("validateCommentSort", () => {
  it("does nothing when sort is undefined", () => {
    expect(() => validateCommentSort(undefined)).not.toThrow();
  });

  it("accepts hot", () => {
    expect(() => validateCommentSort("hot")).not.toThrow();
  });

  it("accepts time", () => {
    expect(() => validateCommentSort("time")).not.toThrow();
  });

  it("rejects unknown value", () => {
    expect(() => validateCommentSort("latest")).toThrow(
      'Invalid comment sort: must be "hot" or "time"',
    );
  });

  it("rejects empty string", () => {
    expect(() => validateCommentSort("")).toThrow(
      'Invalid comment sort: must be "hot" or "time"',
    );
  });
});

describe("validateLength", () => {
  it("throws when required input is empty", () => {
    expect(() => validateLength("")).toThrow("Input is required");
  });

  it("throws when input exceeds maxLength", () => {
    expect(() => validateLength("a".repeat(257), { maxLength: 256 })).toThrow(
      "Input must not exceed",
    );
  });

  it("passes for valid input within limits", () => {
    expect(() =>
      validateLength("hello", { maxLength: 100, minLength: 1 }),
    ).not.toThrow();
  });
});
