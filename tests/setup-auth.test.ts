import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { setupAuthentication, setupCredentials } from "../src/cli.js";
import { BilibiliAPIError } from "../src/utils/errors.js";
import { credentialManager } from "../src/utils/credentials.js";

const old = { sessdata: "synthetic-old", bili_jct: "synthetic-csrf", dedeuserid: "10001", expiresAt: 4e12 };
beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(credentialManager, "getCredentials").mockReturnValue(old);
  vi.spyOn(credentialManager, "getCredentialSource").mockReturnValue("global_config");
  vi.spyOn(credentialManager, "saveToFile").mockImplementation(() => {});
  vi.spyOn(credentialManager, "setCredentials").mockImplementation(() => {});
});
afterEach(() => { vi.restoreAllMocks(); process.exitCode = undefined; });

it("reuses online-verified credentials by default without saving", async () => {
  const verify = vi.fn().mockResolvedValue({ isLogin: true });
  expect(await setupAuthentication(vi.fn().mockResolvedValue(""), verify)).toBe(true);
  expect(verify).toHaveBeenCalledWith(old, expect.any(AbortSignal));
  expect(credentialManager.saveToFile).not.toHaveBeenCalled();
});
it("keeps old credentials when validation is unavailable", async () => {
  expect(await setupAuthentication(vi.fn().mockResolvedValue(""), vi.fn().mockRejectedValue(new Error("offline")))).toBe(false);
  expect(credentialManager.saveToFile).not.toHaveBeenCalled();
});
it("validates the manual candidate before saving and installing", async () => {
  const ask = vi.fn().mockResolvedValueOnce("2").mockResolvedValueOnce("2").mockResolvedValueOnce("synthetic-new").mockResolvedValueOnce("new-csrf").mockResolvedValueOnce("20002");
  const verify = vi.fn().mockResolvedValue({ isLogin: true });
  expect(await setupAuthentication(ask, verify)).toBe(true);
  expect(verify.mock.calls[1][0].dedeuserid).toBe("20002");
  expect(credentialManager.saveToFile).toHaveBeenCalledOnce();
  expect(credentialManager.setCredentials).toHaveBeenCalledOnce();
});
it("does not install a candidate after a late verification response following SIGINT", async () => {
  vi.mocked(credentialManager.getCredentials).mockReturnValue(null);
  const ask = vi.fn().mockResolvedValueOnce("2").mockResolvedValueOnce("synthetic-new").mockResolvedValueOnce("new-csrf").mockResolvedValueOnce("20002");
  const verify = vi.fn().mockImplementation(async () => { process.emit("SIGINT"); return { isLogin: true }; });
  expect(await setupAuthentication(ask, verify)).toBe(false);
  expect(process.exitCode).toBe(130);
  expect(credentialManager.saveToFile).not.toHaveBeenCalled();
});

it("retries uncertain validation before offering reuse", async () => {
  const verify = vi.fn().mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce({ isLogin: true });
  expect(await setupAuthentication(vi.fn().mockResolvedValueOnce("r").mockResolvedValueOnce(""), verify)).toBe(true);
  expect(verify).toHaveBeenCalledTimes(2);
});
it("confirmed expired credentials allow choosing manual login", async () => {
  const verify = vi.fn().mockRejectedValueOnce(new BilibiliAPIError("expired", "COOKIE_EXPIRED")).mockResolvedValueOnce({ isLogin: true });
  const ask = vi.fn().mockResolvedValueOnce("2").mockResolvedValueOnce("New-Synthetic").mockResolvedValueOnce("New-Csrf").mockResolvedValueOnce("20002");
  expect(await setupAuthentication(ask, verify)).toBe(true);
  expect(verify.mock.calls[1][0].sessdata).toBe("New-Synthetic");
});
it("asks before collecting replacement credentials when environment wins", async () => {
  vi.mocked(credentialManager.getCredentialSource).mockReturnValue("env");
  const ask = vi.fn().mockResolvedValueOnce("2").mockResolvedValueOnce("");
  expect(await setupAuthentication(ask, vi.fn().mockResolvedValue({ isLogin: true }))).toBe(false);
  expect(ask).toHaveBeenCalledTimes(2);
  expect(credentialManager.saveToFile).not.toHaveBeenCalled();
});
it("saves an approved candidate without replacing effective environment credentials", async () => {
  vi.mocked(credentialManager.getCredentialSource).mockReturnValue("env");
  const ask = vi.fn().mockResolvedValueOnce("2").mockResolvedValueOnce("y").mockResolvedValueOnce("2").mockResolvedValueOnce("new").mockResolvedValueOnce("csrf").mockResolvedValueOnce("20002");
  expect(await setupAuthentication(ask, vi.fn().mockResolvedValue({ isLogin: true }))).toBe(true);
  expect(credentialManager.saveToFile).toHaveBeenCalledOnce();
  expect(credentialManager.setCredentials).not.toHaveBeenCalled();
  expect(console.log).toHaveBeenCalledWith(expect.stringContaining("当前仍使用环境变量"));
});
it.each(["invalid", "save failure"])("preserves old state on %s", async (failure) => {
  vi.mocked(credentialManager.getCredentials).mockReturnValue(null);
  if (failure === "save failure") vi.mocked(credentialManager.saveToFile).mockImplementation(() => { throw new Error("private path"); });
  const ask = vi.fn().mockResolvedValueOnce("2").mockResolvedValueOnce("new").mockResolvedValueOnce("csrf").mockResolvedValueOnce("20002");
  expect(await setupAuthentication(ask, vi.fn().mockResolvedValue({ isLogin: failure !== "invalid" }))).toBe(false);
  expect(credentialManager.setCredentials).not.toHaveBeenCalled();
  expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain("private path");
});
it("cancels during input before another prompt or write", async () => {
  vi.mocked(credentialManager.getCredentials).mockReturnValue(null);
  const ask = vi.fn(async () => { process.emit("SIGINT"); return "partial"; });
  const verify = vi.fn();
  const count = process.listenerCount("SIGINT");
  expect(await setupAuthentication(ask, verify)).toBe(false);
  expect(process.exitCode).toBe(130);
  expect(ask).toHaveBeenCalledOnce();
  expect(verify).not.toHaveBeenCalled();
  expect(process.listenerCount("SIGINT")).toBe(count);
});
it("setup preserves exit 130 and never starts ASR after cancellation", async () => {
  const descriptor = Object.getOwnPropertyDescriptor(process.stdin, "isTTY");
  Object.defineProperty(process.stdin, "isTTY", { configurable: true, value: true });
  const asr = vi.fn();
  const ask = vi.fn();
  try {
    await setupCredentials(async () => { process.exitCode = 130; return false; }, asr, ask);
    expect(process.exitCode).toBe(130);
    expect(asr).not.toHaveBeenCalled();
    expect(ask).not.toHaveBeenCalled();
  } finally {
    if (descriptor) Object.defineProperty(process.stdin, "isTTY", descriptor);
    else delete (process.stdin as { isTTY?: boolean }).isTTY;
  }
});
