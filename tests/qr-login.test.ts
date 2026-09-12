import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { loginWithQr } from "../src/bilibili/qr-login.js";

const qrUrl = "https://account.bilibili.com/h5/account-h5/auth/scan-web?auth_code=synthetic-challenge";
const json = (data: unknown, headers?: Headers) => new Response(JSON.stringify({ code: 0, data }), { headers });
const generate = () => json({ url: qrUrl, qrcode_key: "synthetic-key" });
const cookies = () => {
  const headers = new Headers();
  for (const value of ["SESSDATA=synthetic-session", "bili_jct=synthetic-csrf", "DedeUserID=20002"])
    headers.append("set-cookie", value + "; Max-Age=3600; Secure; HttpOnly");
  return headers;
};
const original = [
  [process.stdin, "isTTY"], [process.stdout, "isTTY"],
  [process.stdout, "columns"], [process.stdout, "rows"],
] as const;
const descriptors = original.map(([target, key]) => Object.getOwnPropertyDescriptor(target, key));

beforeEach(() => {
  vi.useFakeTimers();
  original.forEach(([target, key]) => Object.defineProperty(target, key, { configurable: true, value: key === "columns" ? 120 : key === "rows" ? 60 : true }));
  vi.spyOn(process.stdout, "write").mockReturnValue(true);
  vi.spyOn(console, "log").mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers();
  original.forEach(([target, key], i) => {
    const descriptor = descriptors[i];
    if (descriptor) Object.defineProperty(target, key, descriptor);
    else Reflect.deleteProperty(target, key);
  });
});

it("renders locally and polls no sooner than 3 seconds, returning only candidate fields", async () => {
  const fetch = vi.fn().mockResolvedValueOnce(generate()).mockResolvedValueOnce(json({ code: 0, refresh_token: "synthetic-discard" }, cookies()));
  vi.stubGlobal("fetch", fetch);
  const result = loginWithQr();
  await vi.advanceTimersByTimeAsync(2999);
  expect(fetch).toHaveBeenCalledTimes(1);
  await vi.advanceTimersByTimeAsync(1);
  expect(await result).toEqual({ sessdata: "synthetic-session", bili_jct: "synthetic-csrf", dedeuserid: "20002", expiresAt: Date.now() + 3600000 });
  expect(fetch.mock.calls[0][1]).toMatchObject({ redirect: "error", credentials: "omit" });
  const output = JSON.stringify(vi.mocked(process.stdout.write).mock.calls) + JSON.stringify(vi.mocked(console.log).mock.calls);
  expect(output).not.toContain("synthetic");
  expect(output).toContain("B站 App");
  expect(vi.getTimerCount()).toBe(0);
});
it("rejects unexpected QR hosts without polling or rendering", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json({ url: "https://evil.example/", qrcode_key: "synthetic-key" })));
  await expect(loginWithQr()).rejects.toMatchObject({ kind: "protocol" });
  expect(process.stdout.write).not.toHaveBeenCalled();
  expect(vi.getTimerCount()).toBe(0);
});
it("refuses redirected stdout before acquiring any challenge", async () => {
  Object.defineProperty(process.stdout, "isTTY", { configurable: true, value: false });
  const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
  await expect(loginWithQr()).rejects.toMatchObject({ kind: "terminal" });
  expect(fetch).not.toHaveBeenCalled();
});
it("cancels the polling delay and leaves no requests or timers", async () => {
  const fetch = vi.fn().mockResolvedValue(generate()); vi.stubGlobal("fetch", fetch);
  const controller = new AbortController();
  const result = loginWithQr(controller.signal);
  const assertion = expect(result).rejects.toMatchObject({ name: "AbortError" });
  await vi.advanceTimersByTimeAsync(100);
  controller.abort();
  await assertion;
  expect(fetch).toHaveBeenCalledTimes(1);
  expect(vi.getTimerCount()).toBe(0);
});

it("shows unscanned then awaiting-confirmation progress and never overlaps polls", async () => {
  const fetch = vi.fn().mockResolvedValueOnce(generate())
    .mockResolvedValueOnce(json({ code: 86101 }))
    .mockResolvedValueOnce(json({ code: 86090 }))
    .mockResolvedValueOnce(json({ code: 0 }, cookies()));
  vi.stubGlobal("fetch", fetch);
  const result = loginWithQr();
  await vi.advanceTimersByTimeAsync(8999);
  expect(fetch).toHaveBeenCalledTimes(3);
  await vi.advanceTimersByTimeAsync(1);
  expect((await result).dedeuserid).toBe("20002");
  expect(console.log).toHaveBeenCalledWith("等待使用 B站 App 扫码...");
  expect(console.log).toHaveBeenCalledWith("已扫码，请在手机 B站 App 确认登录。");
});

it.each([86038, 12345, "0", null])("rejects unsuccessful/unknown nested status %s", async (code) => {
  const fetch = vi.fn().mockResolvedValueOnce(generate()).mockResolvedValueOnce(json({ code }, cookies()));
  vi.stubGlobal("fetch", fetch);
  const assertion = expect(loginWithQr()).rejects.toMatchObject({ kind: code === 86038 ? "expired" : "protocol" });
  await vi.advanceTimersByTimeAsync(3000);
  await assertion;
  expect(fetch).toHaveBeenCalledTimes(2);
  expect(vi.getTimerCount()).toBe(0);
});

it("stops at the 180-second local deadline without automatic regeneration", async () => {
  const fetch = vi.fn().mockResolvedValueOnce(generate()).mockImplementation(async () => json({ code: 86101 }));
  vi.stubGlobal("fetch", fetch);
  const assertion = expect(loginWithQr()).rejects.toMatchObject({ kind: "expired" });
  await vi.advanceTimersByTimeAsync(180000);
  await assertion;
  expect(fetch).toHaveBeenCalledTimes(60); // Generate plus 59 sequential polls.
  expect(vi.getTimerCount()).toBe(0);
});

it.each(["generate", "poll"])("times out an in-flight %s request after 15 seconds", async (stage) => {
  let requestSignal: AbortSignal | undefined;
  const hanging = (_url: string, options: RequestInit) => new Promise<Response>((_resolve, reject) => {
    requestSignal = options.signal!;
    requestSignal.addEventListener("abort", () => reject(new Error("synthetic-private-request")), { once: true });
  });
  const fetch = vi.fn();
  if (stage === "poll") fetch.mockResolvedValueOnce(generate());
  fetch.mockImplementation(hanging); vi.stubGlobal("fetch", fetch);
  const assertion = expect(loginWithQr()).rejects.toMatchObject({ kind: "network" });
  await vi.advanceTimersByTimeAsync(stage === "poll" ? 18000 : 15000);
  await assertion;
  expect(requestSignal?.aborted).toBe(true);
  expect(vi.getTimerCount()).toBe(0);
});

it.each(["generate", "poll"])("aborts active %s requests and rejects late responses", async (stage) => {
  let resolve: (response: Response) => void = () => {};
  let requestSignal: AbortSignal | undefined;
  const fetch = vi.fn();
  if (stage === "poll") fetch.mockResolvedValueOnce(generate());
  fetch.mockImplementation((_url: string, options: RequestInit) => new Promise<Response>(done => { resolve = done; requestSignal = options.signal!; }));
  vi.stubGlobal("fetch", fetch);
  const controller = new AbortController();
  const assertion = expect(loginWithQr(controller.signal)).rejects.toMatchObject({ name: "AbortError" });
  await vi.advanceTimersByTimeAsync(stage === "poll" ? 3000 : 0);
  controller.abort();
  expect(requestSignal?.aborted).toBe(true);
  resolve(stage === "poll" ? json({ code: 0 }, cookies()) : generate());
  await assertion;
  expect(vi.getTimerCount()).toBe(0);
});

it.each([
  "http://account.bilibili.com/h5/account-h5/auth/scan-web",
  "https://user@account.bilibili.com/h5/account-h5/auth/scan-web",
  "https://account.bilibili.com:444/h5/account-h5/auth/scan-web",
  "https://account.bilibili.com/other",
  "https://account.bilibili.com/h5/account-h5/auth/scan-web#fragment",
])("rejects an unsafe challenge URL", async (url) => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(json({ url, qrcode_key: "synthetic-key" })));
  await expect(loginWithQr()).rejects.toMatchObject({ kind: "protocol" });
  expect(process.stdout.write).not.toHaveBeenCalled();
});

it.each([
  { code: 0, data: null }, { code: 0, data: [] },
  { code: 1, data: { url: qrUrl, qrcode_key: "synthetic-key" } },
  { code: 0, data: { url: qrUrl, qrcode_key: "invalid key" } },
])("rejects malformed generation responses", async (body) => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(body))));
  await expect(loginWithQr()).rejects.toMatchObject({ kind: "protocol" });
});

it("rejects a top-level poll failure despite success-like nested data and cookies", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(generate()).mockResolvedValueOnce(new Response(JSON.stringify({ code: -1, data: { code: 0 } }), { headers: cookies() })));
  const assertion = expect(loginWithQr()).rejects.toMatchObject({ kind: "protocol" });
  await vi.advanceTimersByTimeAsync(3000); await assertion;
});

it("rejects oversized bodies without leaking raw protocol data", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("synthetic-private", { headers: { "content-length": "65537" } })));
  await expect(loginWithQr()).rejects.toMatchObject({ kind: "protocol" });
  expect(vi.getTimerCount()).toBe(0);
});

it("requires space and renders a four-module quiet zone with fixed black/white colors", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(generate()).mockResolvedValueOnce(json({ code: 0 }, cookies())));
  const result = loginWithQr();
  await vi.advanceTimersByTimeAsync(3000); await result;
  const output = String(vi.mocked(process.stdout.write).mock.calls[0][0]);
  expect(output).toContain("\x1b[30;47m");
  const lines = output.replace(/\x1b\[[0-9;]*m/g, "").trimEnd().split("\n");
  expect(lines[0].trim()).toBe("");
  expect(lines[1].trim()).toBe("");
  for (const line of lines.slice(0, -1)) {
    expect(line.startsWith("    ")).toBe(true);
    expect(line.endsWith("    ")).toBe(true);
  }
});

it("rejects a small terminal without printing a truncated QR or polling", async () => {
  Object.defineProperty(process.stdout, "columns", { configurable: true, value: 20 });
  const fetch = vi.fn().mockResolvedValue(generate()); vi.stubGlobal("fetch", fetch);
  await expect(loginWithQr()).rejects.toMatchObject({ kind: "terminal" });
  expect(process.stdout.write).not.toHaveBeenCalled();
  expect(fetch).toHaveBeenCalledTimes(1);
});

it("preserves cookie encoding and handles Expires commas conservatively", async () => {
  const headers = new Headers();
  const expiry = new Date(Date.now() + 7200000).toUTCString();
  headers.append("set-cookie", `SESSDATA=synthetic%2Fsession; Expires=${expiry}; Max-Age=3600`);
  headers.append("set-cookie", `bili_jct=synthetic-csrf; Expires=${expiry}`);
  headers.append("set-cookie", `DedeUserID=20002; Expires=${expiry}`);
  headers.append("set-cookie", "refresh_token=synthetic-discard");
  vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(generate()).mockResolvedValueOnce(json({ code: 0 }, headers)));
  const result = loginWithQr();
  await vi.advanceTimersByTimeAsync(3000);
  expect(await result).toEqual({ sessdata: "synthetic%2Fsession", bili_jct: "synthetic-csrf", dedeuserid: "20002", expiresAt: Date.now() + 3600000 });
});

it.each([
  ["SESSDATA=duplicate"], ["DedeUserID=0002"], ["bili_jct="],
  ["SESSDATA=bad value"], ["SESSDATA=bad,value"],
  ["SESSDATA=valid; Expires=nonsense"], ["SESSDATA=valid; Max-Age=0"],
  ["SESSDATA=valid; Max-Age=-1"], ["SESSDATA=valid; Max-Age=20; Max-Age=30"],
])("rejects duplicate or malformed credential cookies", async (extra) => {
  const headers = new Headers();
  const field = extra.slice(0, extra.indexOf("="));
  for (const existing of cookies().getSetCookie()) {
    if (extra === "SESSDATA=duplicate" || !existing.startsWith(field + "=")) headers.append("set-cookie", existing);
  }
  headers.append("set-cookie", extra);
  vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(generate()).mockResolvedValueOnce(json({ code: 0 }, headers)));
  const assertion = expect(loginWithQr()).rejects.toMatchObject({ kind: "protocol" });
  await vi.advanceTimersByTimeAsync(3000); await assertion;
});

it("rejects successful status with missing required cookies", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(generate()).mockResolvedValueOnce(json({ code: 0 })));
  const assertion = expect(loginWithQr()).rejects.toMatchObject({ kind: "protocol" });
  await vi.advanceTimersByTimeAsync(3000); await assertion;
});

it("caps session-cookie expiry locally without inventing upstream persistence", async () => {
  const headers = new Headers();
  for (const value of ["SESSDATA=synthetic-session", "bili_jct=synthetic-csrf", "DedeUserID=20002"]) headers.append("set-cookie", value);
  vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce(generate()).mockResolvedValueOnce(json({ code: 0 }, headers)));
  const result = loginWithQr();
  await vi.advanceTimersByTimeAsync(3000);
  expect((await result).expiresAt).toBe(Date.now() + 86400000);
});

it.each(["http", "json", "transport"])("fails safely on %s errors without reflecting secrets", async (failure) => {
  const fetch = vi.fn();
  if (failure === "transport") fetch.mockRejectedValue(new Error("synthetic-secret-url"));
  else fetch.mockResolvedValue(new Response("synthetic-secret-body", { status: failure === "http" ? 500 : 200 }));
  vi.stubGlobal("fetch", fetch);
  const error = await loginWithQr().catch(error => error);
  expect(error.kind).toBe(failure === "json" ? "protocol" : "network");
  expect(error.message).not.toContain("synthetic");
  expect(vi.getTimerCount()).toBe(0);
});
