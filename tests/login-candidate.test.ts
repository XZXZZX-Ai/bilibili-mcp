import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { BilibiliCredentials } from "../src/utils/credentials.js";

const candidate: BilibiliCredentials = {
  sessdata: "synthetic-new-session",
  bili_jct: "synthetic-new-csrf",
  dedeuserid: "20002",
  expiresAt: 4_000_000_000_000,
};
const existing = { ...candidate, sessdata: "synthetic-old-session", dedeuserid: "10001" };

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv("BILIBILI_RATE_LIMIT_MS", "1");
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("candidate login verification", () => {
  it.each([
    { ...candidate, sessdata: "" },
    { ...candidate, sessdata: "synthetic; injected=value" },
    { ...candidate, bili_jct: "synthetic\r\nHeader: value" },
    { ...candidate, dedeuserid: "not-an-account" },
    { ...candidate, expiresAt: 0 },
    { ...candidate, expiresAt: Number.NaN },
    null,
  ])("rejects invalid candidate %# before reading ambient credentials or making a request", async (invalid) => {
    const { credentialManager } = await import("../src/utils/credentials.js");
    const { checkLoginStatus } = await import("../src/bilibili/http.js");
    const read = vi.spyOn(credentialManager, "getCredentials").mockReturnValue(existing);
    const fetchMock = vi.fn().mockResolvedValue(new Response('{"code":0,"data":{"isLogin":false}}'));
    vi.stubGlobal("fetch", fetchMock);
    await expect(checkLoginStatus(invalid as BilibiliCredentials)).rejects.toMatchObject({ name: "ValidationError" });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(read).not.toHaveBeenCalled();
  });

  it("does not dispatch a pre-cancelled check", async () => {
    const { checkLoginStatus } = await import("../src/bilibili/http.js");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const controller = new AbortController();
    controller.abort();
    await expect(checkLoginStatus(candidate, controller.signal)).rejects.toMatchObject({ name: "AbortError" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([20002, "20002"])("accepts matching account identity %s", async (mid) => {
    const { checkLoginStatus } = await import("../src/bilibili/http.js");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ code: 0, data: { isLogin: true, mid } }))));
    await expect(checkLoginStatus(candidate)).resolves.toEqual({ isLogin: true });
  });

  it("returns false only for an explicit logged-out response", async () => {
    const { checkLoginStatus } = await import("../src/bilibili/http.js");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response('{"code":0,"data":{"isLogin":false}}')));
    await expect(checkLoginStatus(candidate)).resolves.toEqual({ isLogin: false });
  });

  it.each([undefined, null, [], {}, { isLogin: "true" }, { isLogin: true, mid: 10001 }])(
    "rejects malformed or mismatched candidate response %# without reflecting its data",
    async (data) => {
      const { checkLoginStatus } = await import("../src/bilibili/http.js");
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ code: 0, data })),
      ));
      await expect(checkLoginStatus(candidate)).rejects.toMatchObject({ name: "UpstreamResponseError" });
    },
  );

  it("rejects malformed nav data for the existing no-argument caller too", async () => {
    const { credentialManager } = await import("../src/utils/credentials.js");
    const { checkLoginStatus } = await import("../src/bilibili/http.js");
    credentialManager.setCredentials(existing);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response('{"code":0,"data":{}}')));
    await expect(checkLoginStatus()).rejects.toMatchObject({ name: "UpstreamResponseError" });
  });

  it("cancels an in-flight candidate check without changing the manager", async () => {
    const { credentialManager } = await import("../src/utils/credentials.js");
    const { checkLoginStatus } = await import("../src/bilibili/http.js");
    credentialManager.setCredentials(existing);
    const controller = new AbortController();
    const fetchMock = vi.fn((_url: string, init: RequestInit) => {
      controller.abort();
      // Even a transport completing at the cancellation boundary cannot count as success.
      return Promise.resolve(new Response(JSON.stringify({ code: 0, data: { isLogin: true, mid: 20002 } })));
    });
    vi.stubGlobal("fetch", fetchMock);
    await expect(checkLoginStatus(candidate, controller.signal)).rejects.toMatchObject({ name: "AbortError" });
    expect((fetchMock.mock.calls[0][1].signal as AbortSignal).aborted).toBe(true);
    expect(credentialManager.getCredentials()).toEqual(existing);
  });

  it("verifies only the candidate while leaving the effective login untouched", async () => {
    const { credentialManager } = await import("../src/utils/credentials.js");
    const { checkLoginStatus } = await import("../src/bilibili/http.js");
    credentialManager.setCredentials(existing);
    vi.stubEnv("BILIBILI_SESSDATA", "synthetic-env-session");
    vi.stubEnv("BILIBILI_BILI_JCT", "synthetic-env-csrf");
    vi.stubEnv("BILIBILI_DEDEUSERID", "30003");
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ code: 0, data: { isLogin: true, mid: 20002 } })),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(checkLoginStatus(candidate)).resolves.toEqual({ isLogin: true });

    const headers = new Headers(fetchMock.mock.calls[0][1].headers);
    expect(headers.get("Cookie")).toBe(
      "SESSDATA=synthetic-new-session; bili_jct=synthetic-new-csrf; DedeUserID=20002",
    );
    expect(credentialManager.getCredentials()).toEqual(existing);
  });
});
