import { credentialManager, type CredentialSource } from "./credentials.js";

export type { CredentialSource };

export interface CredentialSetupInstructions {
  title: "Bilibili credential setup";
  title_zh: "Bilibili 凭证配置";
  summary: string;
  summary_zh: string;
  recommended_commands: string[];
  global_install_commands: string[];
  required_cookie_fields: ["SESSDATA", "bili_jct", "DedeUserID"];
  security_notes: string[];
  security_notes_en: string[];
  security_notes_zh: string[];
}

export interface CredentialStatus {
  configured: boolean;
  source: CredentialSource;
  logged_in: boolean;
  next_steps: string[];
  next_steps_en: string[];
  next_steps_zh: string[];
  security_notes: string[];
  security_notes_en: string[];
  security_notes_zh: string[];
}

const credentialNextStepsEn = [
  "Run: npx -y @xzxzzx/bilibili-mcp@latest config",
  "Then run: npx -y @xzxzzx/bilibili-mcp@latest check",
  "Do not paste Cookie values into MCP client config files.",
];

const credentialNextStepsZh = [
  "运行：npx -y @xzxzzx/bilibili-mcp@latest config",
  "然后运行：npx -y @xzxzzx/bilibili-mcp@latest check",
  "不要把 Cookie 值粘贴到 MCP 客户端配置文件中。",
];

const credentialSecurityNotesEn = [
  "Do not paste Cookie values into MCP client config files.",
  "Do not share Cookie values in chats, issues, PRs, logs, or tests.",
  "Use the CLI helper, environment variables, or local deployment secrets.",
];

const credentialSecurityNotesZh = [
  "不要把 Cookie 值粘贴到 MCP 客户端配置文件中。",
  "不要在聊天、Issue、PR、日志或测试中分享 Cookie 值。",
  "请使用 CLI 助手、环境变量或本地部署密钥管理凭证。",
];

export function buildCredentialSetupInstructions(): CredentialSetupInstructions {
  return {
    title: "Bilibili credential setup",
    title_zh: "Bilibili 凭证配置",
    summary:
      "For reliable Bilibili subtitles, transcripts, and comments, configure Cookies outside the MCP client config.",
    summary_zh:
      "为了稳定获取 Bilibili 字幕、转录和评论，请在 MCP 客户端配置之外配置 Cookie。",
    recommended_commands: [
      "npx -y @xzxzzx/bilibili-mcp@latest config",
      "npx -y @xzxzzx/bilibili-mcp@latest check",
    ],
    global_install_commands: [
      "bilibili-mcp config",
      "bilibili-mcp check",
    ],
    required_cookie_fields: ["SESSDATA", "bili_jct", "DedeUserID"],
    security_notes: credentialSecurityNotesEn,
    security_notes_en: credentialSecurityNotesEn,
    security_notes_zh: credentialSecurityNotesZh,
  };
}

export function buildCredentialNextSteps(): string[] {
  return credentialNextStepsEn;
}

export function buildCredentialNextStepsEn(): string[] {
  return credentialNextStepsEn;
}

export function buildCredentialNextStepsZh(): string[] {
  return credentialNextStepsZh;
}

export function hasSecretLikeValue(value: string): boolean {
  return /SESSDATA=|bili_jct=|DedeUserID=|BILIBILI_SESSDATA=|BILIBILI_BILI_JCT=|BILIBILI_DEDEUSERID=/i.test(
    value,
  );
}

export async function buildCredentialStatus(
  checkLoginStatus: () => Promise<{ isLogin: boolean }>,
): Promise<CredentialStatus> {
  const source = credentialManager.getCredentialSource();
  const configured = source !== "none";
  const logged_in = configured
    ? (await checkLoginStatus()).isLogin
    : false;

  return {
    configured,
    source,
    logged_in,
    next_steps: configured && logged_in ? [] : buildCredentialNextSteps(),
    next_steps_en: configured && logged_in ? [] : buildCredentialNextStepsEn(),
    next_steps_zh: configured && logged_in ? [] : buildCredentialNextStepsZh(),
    security_notes: [
      "This response never includes raw Cookie values.",
      "Configure credentials outside MCP client config files.",
    ],
    security_notes_en: [
      "This response never includes raw Cookie values.",
      "Configure credentials outside MCP client config files.",
    ],
    security_notes_zh: [
      "此响应永远不会包含原始 Cookie 值。",
      "请在 MCP 客户端配置文件之外配置凭证。",
    ],
  };
}
