import { afterEach, describe, expect, it, vi } from "vitest";

import { buildPackageUpdateInfo } from "../src/utils/update-check.js";

function mockRegistryVersion(version: string) {
  return vi.fn(async () => ({
    ok: true,
    status: 200,
    statusText: "OK",
    json: async () => ({ version }),
  }));
}

describe("package update guidance", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns @latest MCP config and manual update commands", async () => {
    const result = await buildPackageUpdateInfo(mockRegistryVersion("9.9.9"));

    expect(result.package_name).toBe("@xzxzzx/bilibili-mcp");
    expect(result.latest_version).toBe("9.9.9");
    expect(result.update_available).toBe(true);
    expect(result.recommended_mcp_config).toEqual({
      command: "npx",
      args: ["-y", "@xzxzzx/bilibili-mcp@latest"],
    });
    expect(result.update_commands.global_update).toBe(
      "npm install -g @xzxzzx/bilibili-mcp@latest",
    );
    expect(result.update_commands.npx_config).toBe(
      "npx -y @xzxzzx/bilibili-mcp@latest config",
    );
  });

  it("reports unknown registry state without throwing", async () => {
    const result = await buildPackageUpdateInfo(
      vi.fn(async () => {
        throw new Error("offline");
      }),
    );

    expect(result.latest_version).toBeNull();
    expect(result.update_available).toBeNull();
    expect(result.notes.join(" ")).toContain("Could not reach the npm registry");
  });
});
