import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { setupAuthentication, setupCredentials } from "../src/cli.js";
import { QrLoginError } from "../src/bilibili/qr-login.js";
import { credentialManager } from "../src/utils/credentials.js";

const candidate = { sessdata: "synthetic-qr", bili_jct: "synthetic-csrf", dedeuserid: "20002", expiresAt: 4e12 };
beforeEach(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(credentialManager, "getCredentials").mockReturnValue(null);
  vi.spyOn(credentialManager, "getCredentialSource").mockReturnValue("none");
  vi.spyOn(credentialManager, "saveToFile").mockImplementation(() => {});
  vi.spyOn(credentialManager, "setCredentials").mockImplementation(() => {});
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers(); process.exitCode = undefined; });

it("defaults to QR, verifies that exact candidate, then saves", async () => {
  const acquire = vi.fn().mockResolvedValue(candidate);
  const verify = vi.fn().mockResolvedValue({ isLogin: true });
  expect(await setupAuthentication(vi.fn().mockResolvedValue(""), verify, acquire)).toBe(true);
  expect(acquire).toHaveBeenCalledOnce();
  expect(verify).toHaveBeenCalledWith(candidate, expect.any(AbortSignal));
  expect(credentialManager.saveToFile).toHaveBeenCalledWith(candidate);
});
it("only regenerates an expired QR after an explicit retry", async () => {
  const acquire = vi.fn().mockRejectedValueOnce(new QrLoginError("expired")).mockResolvedValueOnce(candidate);
  const ask = vi.fn().mockResolvedValueOnce("").mockResolvedValueOnce("r");
  expect(await setupAuthentication(ask, vi.fn().mockResolvedValue({ isLogin: true }), acquire)).toBe(true);
  expect(acquire).toHaveBeenCalledTimes(2);
});
it("falls back to manual after a QR failure without another QR attempt", async () => {
  const acquire = vi.fn().mockRejectedValue(new QrLoginError("network"));
  const ask = vi.fn().mockResolvedValueOnce("").mockResolvedValueOnce("m").mockResolvedValueOnce("synthetic-manual").mockResolvedValueOnce("manual-csrf").mockResolvedValueOnce("30003");
  const verify = vi.fn().mockResolvedValue({ isLogin: true });
  expect(await setupAuthentication(ask, verify, acquire)).toBe(true);
  expect(acquire).toHaveBeenCalledOnce();
  expect(verify.mock.calls[0][0].sessdata).toBe("synthetic-manual");
});
it("does not save or enter recovery after cancellation while acquiring", async () => {
  const acquire = vi.fn(async () => { process.emit("SIGINT"); return candidate; });
  const ask = vi.fn().mockResolvedValue("");
  const verify = vi.fn();
  expect(await setupAuthentication(ask, verify, acquire)).toBe(false);
  expect(process.exitCode).toBe(130);
  expect(ask).toHaveBeenCalledOnce();
  expect(verify).not.toHaveBeenCalled();
  expect(credentialManager.saveToFile).not.toHaveBeenCalled();
});

it.each(["expired", "network", "protocol", "terminal"] as const)("exits %s recovery without saving or retrying automatically", async (kind) => {
  const acquire = vi.fn().mockRejectedValue(new QrLoginError(kind));
  expect(await setupAuthentication(vi.fn().mockResolvedValue(""), vi.fn(), acquire)).toBe(false);
  expect(acquire).toHaveBeenCalledOnce();
  expect(credentialManager.saveToFile).not.toHaveBeenCalled();
});

it.each(["verification", "save"])("keeps old state and redacts %s failures", async (failure) => {
  const verify = vi.fn().mockResolvedValue({ isLogin: true });
  if (failure === "verification") verify.mockRejectedValue(new Error("synthetic-sensitive-failure"));
  else vi.mocked(credentialManager.saveToFile).mockImplementation(() => { throw new Error("synthetic-sensitive-failure"); });
  expect(await setupAuthentication(vi.fn().mockResolvedValue(""), verify, vi.fn().mockResolvedValue(candidate))).toBe(false);
  expect(credentialManager.setCredentials).not.toHaveBeenCalled();
  expect(JSON.stringify(vi.mocked(console.error).mock.calls)).not.toContain("synthetic-sensitive-failure");
});

it("preserves environment precedence while verifying the QR candidate independently", async () => {
  const existing = { ...candidate, dedeuserid: "10001" };
  vi.mocked(credentialManager.getCredentials).mockReturnValue(existing);
  vi.mocked(credentialManager.getCredentialSource).mockReturnValue("env");
  const ask = vi.fn().mockResolvedValueOnce("2").mockResolvedValueOnce("y").mockResolvedValueOnce("");
  const verify = vi.fn().mockResolvedValue({ isLogin: true });
  expect(await setupAuthentication(ask, verify, vi.fn().mockResolvedValue(candidate))).toBe(true);
  expect(verify.mock.calls.map(call => call[0])).toEqual([existing, candidate]);
  expect(credentialManager.setCredentials).not.toHaveBeenCalled();
});

it("cancels during QR candidate validation without saving or further prompts", async () => {
  const verify = vi.fn(async () => { process.emit("SIGINT"); return { isLogin: true }; });
  const ask = vi.fn().mockResolvedValue("");
  expect(await setupAuthentication(ask, verify, vi.fn().mockResolvedValue(candidate))).toBe(false);
  expect(process.exitCode).toBe(130);
  expect(ask).toHaveBeenCalledOnce();
  expect(credentialManager.saveToFile).not.toHaveBeenCalled();
});

it("cancels at the recovery prompt and releases the SIGINT listener", async () => {
  const count = process.listenerCount("SIGINT");
  const ask = vi.fn().mockResolvedValueOnce("").mockImplementationOnce(async () => { process.emit("SIGINT"); return "r"; });
  const acquire = vi.fn().mockRejectedValue(new QrLoginError("expired"));
  expect(await setupAuthentication(ask, vi.fn(), acquire)).toBe(false);
  expect(process.exitCode).toBe(130);
  expect(acquire).toHaveBeenCalledOnce();
  expect(process.listenerCount("SIGINT")).toBe(count);
});

it.each(["success", "mismatch", "cancel"])("integrates real QR polling, candidate nav validation and ASR gating: %s", async (outcome) => {
  vi.useFakeTimers();
  const properties = [[process.stdin, "isTTY"], [process.stdout, "isTTY"], [process.stdout, "columns"], [process.stdout, "rows"]] as const;
  const originals = properties.map(([target, key]) => Object.getOwnPropertyDescriptor(target, key));
  properties.forEach(([target, key]) => Object.defineProperty(target, key, { configurable: true, value: key === "columns" ? 120 : key === "rows" ? 60 : true }));
  vi.spyOn(process.stdout, "write").mockReturnValue(true);
  const fetch = vi.fn(async (input: string | URL | Request, options?: RequestInit) => {
    const url = String(input);
    if (url.endsWith("/generate")) {
      expect(new Headers(options?.headers).has("Cookie")).toBe(false);
      return new Response(JSON.stringify({ code: 0, data: { url: "https://account.bilibili.com/h5/account-h5/auth/scan-web?auth_code=synthetic", qrcode_key: "synthetic-key" } }));
    }
    if (url.includes("/poll?")) {
      const headers = new Headers();
      for (const value of ["SESSDATA=synthetic-qr", "bili_jct=synthetic-csrf", "DedeUserID=20002"]) headers.append("Set-Cookie", value + "; Max-Age=3600");
      return new Response(JSON.stringify({ code: 0, data: { code: 0 } }), { headers });
    }
    expect(url).toContain("/x/web-interface/nav");
    expect(new Headers(options?.headers).get("Cookie")).toContain("SESSDATA=synthetic-qr");
    if (outcome === "cancel") process.emit("SIGINT");
    return new Response(JSON.stringify({ code: 0, data: { isLogin: true, mid: outcome === "mismatch" ? 10001 : 20002 } }));
  });
  vi.stubGlobal("fetch", fetch);
  const ask = vi.fn().mockResolvedValueOnce("").mockResolvedValueOnce(outcome === "success" ? "y" : "").mockResolvedValue("");
  const asr = vi.fn(async () => ({ success: true }));
  try {
    const result = setupCredentials(undefined, asr, ask);
    await vi.advanceTimersByTimeAsync(5000);
    await result;
    expect(fetch).toHaveBeenCalledTimes(3);
    if (outcome === "success") {
      expect(credentialManager.saveToFile).toHaveBeenCalledWith(expect.objectContaining({ sessdata: "synthetic-qr", dedeuserid: "20002" }));
      expect(asr).toHaveBeenCalledWith("small", "auto");
    } else {
      expect(credentialManager.saveToFile).not.toHaveBeenCalled();
      expect(asr).not.toHaveBeenCalled();
      expect(process.exitCode).toBe(outcome === "cancel" ? 130 : 1);
    }
    expect(vi.getTimerCount()).toBe(0);
  } finally {
    properties.forEach(([target, key], i) => {
      if (originals[i]) Object.defineProperty(target, key, originals[i]!);
      else Reflect.deleteProperty(target, key);
    });
  }
});
