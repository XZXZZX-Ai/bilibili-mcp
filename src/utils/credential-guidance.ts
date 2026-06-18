import { credentialManager, type CredentialSource } from "./credentials.js";

export type { CredentialSource };

export interface CredentialSetupInstructions {
  title: "Bilibili credential setup";
  summary: string;
  recommended_commands: string[];
  global_install_commands: string[];
  required_cookie_fields: ["SESSDATA", "bili_jct", "DedeUserID"];
  security_notes: string[];
}

export interface CredentialStatus {
  configured: boolean;
  source: CredentialSource;
  logged_in: boolean;
  next_steps: string[];
  security_notes: string[];
}

export function buildCredentialSetupInstructions(): CredentialSetupInstructions {
  return {
    title: "Bilibili credential setup",
    summary:
      "For reliable Bilibili subtitles, transcripts, and comments, configure Cookies outside the MCP client config.",
    recommended_commands: [
      "npx -y @xzxzzx/bilibili-mcp@latest config",
      "npx -y @xzxzzx/bilibili-mcp@latest check",
    ],
    global_install_commands: [
      "bilibili-mcp config",
      "bilibili-mcp check",
    ],
    required_cookie_fields: ["SESSDATA", "bili_jct", "DedeUserID"],
    security_notes: [
      "Do not paste Cookie values into MCP client config files.",
      "Do not share Cookie values in chats, issues, PRs, logs, or tests.",
      "Use the CLI helper, environment variables, or local deployment secrets.",
    ],
  };
}

export function buildCredentialNextSteps(): string[] {
  return [
    "Run: npx -y @xzxzzx/bilibili-mcp@latest config",
    "Then run: npx -y @xzxzzx/bilibili-mcp@latest check",
    "Do not paste Cookie values into MCP client config files.",
  ];
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
    security_notes: [
      "This response never includes raw Cookie values.",
      "Configure credentials outside MCP client config files.",
    ],
  };
}
