/**
 * 凭证管理模块
 * 用于安全地存储和管理用户的登录凭证
 */

import fs from "fs";
import path from "path";
import os from "os";
import { randomUUID } from "node:crypto";

export type CredentialSource = "env" | "global_config" | "none";

export interface BilibiliCredentials {
  sessdata: string;
  bili_jct: string;
  dedeuserid: string;
  expiresAt: number;
}

/** 全局配置文件路径: ~/.bilibili-mcp/config.json */
export const GLOBAL_CONFIG_DIR = path.join(os.homedir(), ".bilibili-mcp");
export const GLOBAL_CONFIG_FILE = path.join(GLOBAL_CONFIG_DIR, "config.json");

export class CredentialManager {
  private static instance: CredentialManager;
  private credentials: BilibiliCredentials | null = null;

  private constructor() {}

  static getInstance(): CredentialManager {
    if (!CredentialManager.instance) {
      CredentialManager.instance = new CredentialManager();
    }
    return CredentialManager.instance;
  }

  /**
   * 从环境变量加载凭证
   */
  loadFromEnv(): BilibiliCredentials | null {
    const sessdata = process.env.BILIBILI_SESSDATA;
    const bili_jct = process.env.BILIBILI_BILI_JCT;
    const dedeuserid = process.env.BILIBILI_DEDEUSERID;

    if (!sessdata || !bili_jct || !dedeuserid) {
      return null;
    }

    this.credentials = {
      sessdata,
      bili_jct,
      dedeuserid,
      expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30天过期
    };

    return this.credentials;
  }

  /**
   * 从全局配置文件加载凭证 (~/.bilibili-mcp/config.json)
   */
  loadFromFile(): BilibiliCredentials | null {
    try {
      if (!fs.existsSync(GLOBAL_CONFIG_FILE)) {
        return null;
      }
      const raw = fs.readFileSync(GLOBAL_CONFIG_FILE, "utf-8");
      const parsed = JSON.parse(raw) as BilibiliCredentials;
      if (!parsed.sessdata || !parsed.bili_jct || !parsed.dedeuserid) {
        return null;
      }
      this.credentials = parsed;
      return this.credentials;
    } catch {
      return null;
    }
  }

  /**
   * 将当前凭证持久化保存至全局配置文件
   */
  saveToFile(credentials: BilibiliCredentials): void {
    const temporaryFile = path.join(GLOBAL_CONFIG_DIR, `.config-${randomUUID()}.tmp`);
    let descriptor: number | undefined;
    let ownsTemporaryFile = false;
    try {
      fs.mkdirSync(GLOBAL_CONFIG_DIR, { recursive: true, mode: 0o700 });
      descriptor = fs.openSync(temporaryFile, "wx", 0o600);
      ownsTemporaryFile = true;
      fs.writeFileSync(descriptor, JSON.stringify(credentials, null, 2), "utf-8");
      try {
        fs.fchmodSync(descriptor, 0o600);
      } catch {
        // Best effort: Windows ACLs do not map directly to POSIX modes.
      }
      fs.closeSync(descriptor);
      descriptor = undefined;
      fs.renameSync(temporaryFile, GLOBAL_CONFIG_FILE);
      ownsTemporaryFile = false;
    } catch {
      // Do not expose filesystem paths or serialize the candidate into diagnostics.
      throw new Error("Unable to save Bilibili credentials; existing credentials were preserved");
    } finally {
      if (descriptor !== undefined) {
        try { fs.closeSync(descriptor); } catch { /* Best-effort cleanup. */ }
      }
      if (ownsTemporaryFile) {
        try { fs.unlinkSync(temporaryFile); } catch { /* Preserve the original failure. */ }
      }
    }
  }

  /**
   * 设置凭证
   */
  setCredentials(credentials: BilibiliCredentials): void {
    this.credentials = credentials;
  }

  /**
   * 获取凭证（优先级：内存 > 环境变量 > 全局配置文件）
   */
  getCredentials(): BilibiliCredentials | null {
    if (!this.credentials) {
      this.loadFromEnv();
    }

    if (!this.credentials) {
      this.loadFromFile();
    }

    if (!this.credentials) {
      return null;
    }

    if (this.isExpired()) {
      console.warn("Credentials have expired");
      this.credentials = null;
      return null;
    }

    return this.credentials;
  }

  /**
   * 检查凭证是否过期
   */
  isExpired(): boolean {
    if (!this.credentials) {
      return true;
    }
    return Date.now() > this.credentials.expiresAt;
  }

  /**
   * 检查凭证是否即将过期（7天内）
   */
  isExpiringSoon(): boolean {
    if (!this.credentials) {
      return true;
    }
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    return Date.now() > this.credentials.expiresAt - sevenDays;
  }

  /**
   * 刷新凭证过期时间
   */
  refreshExpiration(): void {
    if (this.credentials) {
      this.credentials.expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
    }
  }

  getCredentialSource(): CredentialSource {
    if (this.hasEnvCredentials()) {
      return "env";
    }

    if (this.hasFileCredentials()) {
      return "global_config";
    }

    return "none";
  }

  /**
   * 返回同样存有完整凭证、但被更高优先级来源遮蔽的来源。
   * 用于诊断“重新登录后仍使用旧凭证”这类来源冲突。
   */
  getShadowedSources(): Exclude<CredentialSource, "none">[] {
    const present: Exclude<CredentialSource, "none">[] = [];
    if (this.hasEnvCredentials()) {
      present.push("env");
    }
    if (this.hasFileCredentials()) {
      present.push("global_config");
    }
    const effective = this.getCredentialSource();
    if (effective === "none") {
      return present;
    }
    const effectiveIndex = present.indexOf(effective);
    return effectiveIndex < 0 ? present : present.slice(effectiveIndex + 1);
  }

  private hasEnvCredentials(): boolean {
    return Boolean(
      process.env.BILIBILI_SESSDATA &&
      process.env.BILIBILI_BILI_JCT &&
      process.env.BILIBILI_DEDEUSERID
    );
  }

  private hasFileCredentials(): boolean {
    if (!fs.existsSync(GLOBAL_CONFIG_FILE)) {
      return false;
    }
    try {
      const raw = fs.readFileSync(GLOBAL_CONFIG_FILE, "utf-8");
      const parsed = JSON.parse(raw) as Partial<BilibiliCredentials>;
      return Boolean(parsed.sessdata && parsed.bili_jct && parsed.dedeuserid);
    } catch {
      return false;
    }
  }

  /**
   * 清除凭证
   */
  clearCredentials(): void {
    this.credentials = null;
  }

  /**
   * 检查是否已登录
   */
  isLoggedIn(): boolean {
    const creds = this.getCredentials();
    return creds !== null && !this.isExpired();
  }

  /**
   * 获取请求头
   */
  getAuthHeaders(candidate?: BilibiliCredentials): Record<string, string> {
    const creds = candidate ?? this.getCredentials();
    if (!creds) {
      return {};
    }

    return {
      Cookie: `SESSDATA=${creds.sessdata}; bili_jct=${creds.bili_jct}; DedeUserID=${creds.dedeuserid}`,
    };
  }
}

export const credentialManager = CredentialManager.getInstance();
