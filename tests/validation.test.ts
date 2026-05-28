import { describe, expect, it } from "vitest";
import {
  validateBVInput,
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
