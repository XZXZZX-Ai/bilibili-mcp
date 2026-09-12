import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const original = {
  sessdata: "synthetic-original-session",
  bili_jct: "synthetic-original-csrf",
  dedeuserid: "10001",
  expiresAt: 4_000_000_000_000,
};
const replacement = { ...original, sessdata: "synthetic-replacement-session", dedeuserid: "20002" };
let home: string;

beforeEach(() => {
  vi.resetModules();
  home = fs.mkdtempSync(path.join(os.tmpdir(), "bilibili-credential-storage-"));
  vi.spyOn(os, "homedir").mockReturnValue(home);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  // Only the directory created by this test is eligible for recursive cleanup.
  if (path.dirname(home) !== os.tmpdir() || !path.basename(home).startsWith("bilibili-credential-storage-")) {
    throw new Error("Unexpected test home");
  }
  fs.rmSync(home, { recursive: true, force: true });
});

async function seededStore() {
  const store = await import("../src/utils/credentials.js");
  fs.mkdirSync(store.GLOBAL_CONFIG_DIR, { recursive: true });
  const bytes = JSON.stringify(original, null, 2) + "\n";
  fs.writeFileSync(store.GLOBAL_CONFIG_FILE, bytes);
  store.credentialManager.setCredentials(original);
  return { ...store, bytes };
}

describe("credential file replacement", () => {
  it("keeps the effective login when direct config cannot save", async () => {
    const store = await seededStore();
    const { configureCredentials } = await import("../src/cli.js");
    const exitCode = process.exitCode;
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const exit = vi.spyOn(process, "exit").mockImplementation(() => { throw new Error("synthetic exit"); });
    vi.spyOn(fs, "renameSync").mockImplementation(() => { throw new Error("synthetic denied"); });
    const ask = vi.fn<(question: string) => Promise<string>>()
      .mockResolvedValueOnce(replacement.sessdata)
      .mockResolvedValueOnce(replacement.bili_jct)
      .mockResolvedValueOnce(replacement.dedeuserid);
    try {
      await expect(configureCredentials(ask)).rejects.toThrow("synthetic exit");
      expect(exit).toHaveBeenCalledWith(1);
      expect(fs.readFileSync(store.GLOBAL_CONFIG_FILE, "utf8")).toBe(store.bytes);
      expect(store.credentialManager.getCredentials()).toEqual(original);
      const output = JSON.stringify([...log.mock.calls, ...error.mock.calls]);
      expect(output).not.toContain("凭证配置成功");
      expect(output).not.toContain(replacement.sessdata);
      expect(output).not.toContain(replacement.bili_jct);
    } finally {
      process.exitCode = exitCode;
    }
  });

  it("replaces an existing file successfully without changing manager state implicitly", async () => {
    const store = await seededStore();
    store.credentialManager.saveToFile(replacement);
    expect(JSON.parse(fs.readFileSync(store.GLOBAL_CONFIG_FILE, "utf8"))).toEqual(replacement);
    expect(store.credentialManager.getCredentials()).toEqual(original);
    expect(fs.readdirSync(store.GLOBAL_CONFIG_DIR)).toEqual(["config.json"]);
  });

  it("preserves old bytes and state after a partial write failure", async () => {
    const store = await seededStore();
    const write = fs.writeFileSync.bind(fs);
    vi.spyOn(fs, "writeFileSync").mockImplementation((file) => {
      write(file, "partial");
      throw new Error("synthetic disk full");
    });

    expect(() => store.credentialManager.saveToFile(replacement)).toThrow();
    expect(fs.readFileSync(store.GLOBAL_CONFIG_FILE, "utf8")).toBe(store.bytes);
    expect(store.credentialManager.getCredentials()).toEqual(original);
    expect(fs.readdirSync(store.GLOBAL_CONFIG_DIR)).toEqual(["config.json"]);
  });

  it("preserves old bytes on Windows-style rename failure and removes only its own temporary file", async () => {
    const store = await seededStore();
    const unrelated = path.join(store.GLOBAL_CONFIG_DIR, "unrelated.tmp");
    fs.writeFileSync(unrelated, "keep");
    vi.spyOn(fs, "renameSync").mockImplementation(() => {
      throw Object.assign(new Error("synthetic replacement denied"), { code: "EPERM" });
    });

    expect(() => store.credentialManager.saveToFile(replacement)).toThrow();
    expect(fs.readFileSync(store.GLOBAL_CONFIG_FILE, "utf8")).toBe(store.bytes);
    expect(store.credentialManager.getCredentials()).toEqual(original);
    expect(fs.readdirSync(store.GLOBAL_CONFIG_DIR).sort()).toEqual(["config.json", "unrelated.tmp"]);
  });
});
