import qrcode from "qrcode-generator";
import type { BilibiliCredentials } from "../utils/credentials.js";
import { parseBoundedJsonResponse } from "../utils/bounded-response.js";
import { abortableDelay, linkAbortSignal, throwIfAborted } from "../security/operation-context.js";

export class QrLoginError extends Error {
  constructor(public readonly kind: "expired" | "network" | "protocol" | "terminal") {
    super({
      expired: "二维码已过期，请重新生成。",
      network: "扫码请求失败或超时，请检查网络后重试。",
      protocol: "扫码响应异常，未获得可用凭证；请重试或使用手动 Cookie。",
      terminal: "二维码需要可交互的输入和输出，并有足够空间；请放大终端后重试，或选择手动 Cookie。",
    }[kind]);
    this.name = "QrLoginError";
  }
}

function requireTerminal() {
  if (!process.stdin.isTTY || !process.stdout.isTTY) throw new QrLoginError("terminal");
}

function displayQr(url: string) {
  requireTerminal();
  const qr = qrcode(0, "M");
  qr.addData(url, "Byte");
  qr.make();
  const size = qr.getModuleCount();
  const width = size + 8; // Four light modules on every side.
  if ((process.stdout.columns ?? 0) <= width || (process.stdout.rows ?? 0) < Math.ceil(width / 2) + 6) {
    throw new QrLoginError("terminal");
  }
  const dark = (row: number, col: number) => row >= 4 && row < size + 4 && col >= 4 && col < size + 4 && qr.isDark(row - 4, col - 4);
  let output = "";
  for (let row = 0; row < width; row += 2) {
    output += "\x1b[30;47m";
    for (let col = 0; col < width; col++) {
      const upper = dark(row, col), lower = dark(row + 1, col);
      output += upper ? (lower ? "█" : "▀") : (lower ? "▄" : " ");
    }
    output += "\x1b[0m\n";
  }
  console.log("请使用手机 B站 App 扫描下方二维码，并在手机上确认登录。Ctrl+C 可取消。");
  process.stdout.write(output);
}

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new QrLoginError("protocol");
  return value as Record<string, unknown>;
}

function candidateFromCookies(headers: Headers): BilibiliCredentials {
  const values = new Map<string, string>();
  const now = Date.now();
  let expiresAt = now + 30 * 24 * 60 * 60 * 1000;
  const cookies = headers.getSetCookie(); // Preserves Expires commas; no comma splitting.
  if (cookies.join("").length > 16_384) throw new QrLoginError("protocol");
  for (const cookie of cookies) {
    const [pair, ...attributes] = cookie.split(";");
    const separator = pair.indexOf("=");
    const name = pair.slice(0, separator).trim();
    if (!["SESSDATA", "bili_jct", "DedeUserID"].includes(name)) continue;
    const value = pair.slice(separator + 1);
    if (values.has(name) || !/^[\x21\x23-\x2B\x2D-\x3A\x3C-\x5B\x5D-\x7E]+$/.test(value)) {
      throw new QrLoginError("protocol");
    }
    values.set(name, value);
    const expiryAttributes = new Set<string>();
    for (const attribute of attributes) {
      const index = attribute.indexOf("=");
      const key = (index < 0 ? attribute : attribute.slice(0, index)).trim().toLowerCase();
      if (key !== "max-age" && key !== "expires") continue;
      if (expiryAttributes.has(key) || index < 0) throw new QrLoginError("protocol");
      expiryAttributes.add(key);
      const text = attribute.slice(index + 1).trim();
      let expiry: number;
      if (key === "max-age") {
        if (!/^\d+$/.test(text) || !Number.isSafeInteger(Number(text))) throw new QrLoginError("protocol");
        expiry = now + Number(text) * 1000;
      } else {
        expiry = Date.parse(text);
      }
      if (!Number.isFinite(expiry) || expiry <= now) throw new QrLoginError("protocol");
      expiresAt = Math.min(expiresAt, expiry);
    }
    // Session cookies have no durable expiry; limit local reuse to one day.
    if (expiryAttributes.size === 0) expiresAt = Math.min(expiresAt, now + 86_400_000);
  }
  const sessdata = values.get("SESSDATA"), bili_jct = values.get("bili_jct"), dedeuserid = values.get("DedeUserID");
  if (!sessdata || !bili_jct || !dedeuserid || !/^[1-9]\d*$/.test(dedeuserid)) throw new QrLoginError("protocol");
  return { sessdata, bili_jct, dedeuserid, expiresAt };
}

async function request(url: string, signal: AbortSignal) {
  throwIfAborted(signal);
  const controller = new AbortController();
  const unlink = linkAbortSignal(signal, controller);
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(url, {
      signal: controller.signal, redirect: "error", credentials: "omit",
      headers: { Accept: "application/json" }, cache: "no-store",
    });
    throwIfAborted(controller.signal);
    if (!response.ok) {
      await response.body?.cancel();
      throw new QrLoginError("network");
    }
    let raw: unknown;
    try {
      raw = await parseBoundedJsonResponse(response, 65_536, "QR login response");
    } catch {
      throwIfAborted(controller.signal);
      throw new QrLoginError("protocol");
    }
    throwIfAborted(controller.signal);
    const body = object(raw);
    if (body.code !== 0) throw new QrLoginError("protocol");
    return { data: object(body.data), headers: response.headers };
  } catch (error) {
    throwIfAborted(signal);
    if (error instanceof QrLoginError) throw error;
    throw new QrLoginError("network");
  } finally {
    clearTimeout(timer);
    unlink();
    controller.abort();
  }
}

/** One anonymous, bounded attempt. Returns a candidate, never installs or saves it. */
export async function loginWithQr(signal?: AbortSignal): Promise<BilibiliCredentials> {
  throwIfAborted(signal);
  requireTerminal();
  const attempt = new AbortController();
  const unlink = linkAbortSignal(signal, attempt);
  const deadline = Date.now() + 180_000;
  const timer = setTimeout(() => attempt.abort(), 180_000);
  try {
    const { data } = await request("https://passport.bilibili.com/x/passport-login/web/qrcode/generate", attempt.signal);
    if (typeof data.qrcode_key !== "string" || !/^[A-Za-z0-9_-]{1,256}$/.test(data.qrcode_key) || typeof data.url !== "string" || data.url.length > 2048) {
      throw new QrLoginError("protocol");
    }
    let url: URL;
    try { url = new URL(data.url); } catch { throw new QrLoginError("protocol"); }
    if (url.protocol !== "https:" || url.hostname !== "account.bilibili.com" || url.port || url.username || url.password || url.hash || url.pathname !== "/h5/account-h5/auth/scan-web") {
      throw new QrLoginError("protocol");
    }
    displayQr(url.href);
    let lastCode: number | undefined;
    while (true) {
      await abortableDelay(3000, attempt.signal);
      const response = await request(`https://passport.bilibili.com/x/passport-login/web/qrcode/poll?qrcode_key=${encodeURIComponent(data.qrcode_key)}`, attempt.signal);
      const code = response.data.code;
      if (code === 0) return candidateFromCookies(response.headers);
      if (code === 86038) throw new QrLoginError("expired");
      if (code !== 86101 && code !== 86090) throw new QrLoginError("protocol");
      if (code !== lastCode) console.log(code === 86101 ? "等待使用 B站 App 扫码..." : "已扫码，请在手机 B站 App 确认登录。");
      lastCode = code;
    }
  } catch (error) {
    throwIfAborted(signal);
    if (Date.now() >= deadline) throw new QrLoginError("expired");
    if (error instanceof QrLoginError) throw error;
    throw new QrLoginError("protocol");
  } finally {
    clearTimeout(timer);
    unlink();
    attempt.abort();
  }
}
