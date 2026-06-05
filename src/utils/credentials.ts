/**
 * 凭证管理模块
 * 用于安全地存储和管理用户的登录凭证
 */

import fs from "fs";
import path from "path";
import os from "os";

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
    if (!fs.existsSync(GLOBAL_CONFIG_DIR)) {
      fs.mkdirSync(GLOBAL_CONFIG_DIR, { recursive: true, mode: 0o700 });
    }
    fs.writeFileSync(
      GLOBAL_CONFIG_FILE,
      JSON.stringify(credentials, null, 2),
      { encoding: "utf-8", mode: 0o600 },
    );
    try {
      fs.chmodSync(GLOBAL_CONFIG_FILE, 0o600);
    } catch {
      // Best-effort hardening; Windows ACL semantics may not map cleanly to POSIX modes.
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
    if (
      process.env.BILIBILI_SESSDATA &&
      process.env.BILIBILI_BILI_JCT &&
      process.env.BILIBILI_DEDEUSERID
    ) {
      return "env";
    }

    if (fs.existsSync(GLOBAL_CONFIG_FILE)) {
      try {
        const raw = fs.readFileSync(GLOBAL_CONFIG_FILE, "utf-8");
        const parsed = JSON.parse(raw) as Partial<BilibiliCredentials>;
        if (parsed.sessdata && parsed.bili_jct && parsed.dedeuserid) {
          return "global_config";
        }
      } catch {
        return "none";
      }
    }

    return "none";
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
  getAuthHeaders(): Record<string, string> {
    const creds = this.getCredentials();
    if (!creds) {
      return {};
    }

    return {
      Cookie: `SESSDATA=${creds.sessdata}; bili_jct=${creds.bili_jct}; DedeUserID=${creds.dedeuserid}`,
    };
  }
}

export const credentialManager = CredentialManager.getInstance();
