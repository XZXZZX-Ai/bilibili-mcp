import { afterEach, describe, expect, it } from "vitest";

import {
  buildCredentialSetupInstructions,
  buildCredentialNextSteps,
  hasSecretLikeValue,
  buildCredentialStatus,
} from "../src/utils/credential-guidance.js";
import { credentialManager } from "../src/utils/credentials.js";

describe("credential guidance", () => {
  afterEach(() => {
    credentialManager.clearCredentials();
    delete process.env.BILIBILI_SESSDATA;
    delete process.env.BILIBILI_BILI_JCT;
    delete process.env.BILIBILI_DEDEUSERID;
  });

  it("returns actionable setup commands for agent installers", () => {
    const result = buildCredentialSetupInstructions();

    expect(result.title).toBe("Bilibili credential setup");
    expect(result.recommended_commands).toContain(
      "npx -y @xzxzzx/bilibili-mcp config",
    );
    expect(result.recommended_commands).toContain(
      "npx -y @xzxzzx/bilibili-mcp check",
    );
    expect(result.required_cookie_fields).toEqual([
      "SESSDATA",
      "bili_jct",
      "DedeUserID",
    ]);
    expect(result.security_notes.join(" ")).toContain(
      "Do not paste Cookie values into MCP client config",
    );
  });

  it("returns reusable next steps for credential errors", () => {
    expect(buildCredentialNextSteps()).toEqual([
      "Run: npx -y @xzxzzx/bilibili-mcp config",
      "Then run: npx -y @xzxzzx/bilibili-mcp check",
      "Do not paste Cookie values into MCP client config files.",
    ]);
  });

  it("does not include secret-looking Cookie values", () => {
    const result = JSON.stringify(buildCredentialSetupInstructions());

    expect(hasSecretLikeValue(result)).toBe(false);
    expect(result).not.toContain("your_sessdata");
    expect(result).not.toContain("bili_jct=");
    expect(result).not.toContain("SESSDATA=");
  });
});

describe("credential status", () => {
  afterEach(() => {
    credentialManager.clearCredentials();
    delete process.env.BILIBILI_SESSDATA;
    delete process.env.BILIBILI_BILI_JCT;
    delete process.env.BILIBILI_DEDEUSERID;
  });

  it("reports none when no credentials are configured", async () => {
    const result = await buildCredentialStatus(async () => ({ isLogin: false }));

    expect(result.configured).toBe(false);
    expect(result.source).toBe("none");
    expect(result.logged_in).toBe(false);
    expect(result.next_steps).toContain(
      "Run: npx -y @xzxzzx/bilibili-mcp config",
    );
  });

  it("reports env without exposing Cookie values", async () => {
    process.env.BILIBILI_SESSDATA = "secret-sessdata";
    process.env.BILIBILI_BILI_JCT = "secret-jct";
    process.env.BILIBILI_DEDEUSERID = "123456789";

    const result = await buildCredentialStatus(async () => ({ isLogin: true }));
    const serialized = JSON.stringify(result);

    expect(result.configured).toBe(true);
    expect(result.source).toBe("env");
    expect(result.logged_in).toBe(true);
    expect(serialized).not.toContain("secret-sessdata");
    expect(serialized).not.toContain("secret-jct");
    expect(serialized).not.toContain("123456789");
  });
});
