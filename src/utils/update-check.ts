import fs from "fs";

const PACKAGE_NAME = "@xzxzzx/bilibili-mcp";
const LATEST_PACKAGE_SPEC = `${PACKAGE_NAME}@latest`;
const NPM_LATEST_URL = `https://registry.npmjs.org/${encodeURIComponent(PACKAGE_NAME)}/latest`;

type FetchLike = (
  input: string,
  init?: { headers?: Record<string, string> },
) => Promise<{
  ok: boolean;
  status: number;
  statusText: string;
  json: () => Promise<unknown>;
}>;

export interface PackageUpdateInfo {
  package_name: typeof PACKAGE_NAME;
  current_version: string;
  latest_version: string | null;
  update_available: boolean | null;
  checked_registry: string;
  recommended_mcp_config: {
    command: "npx";
    args: ["-y", typeof LATEST_PACKAGE_SPEC];
  };
  update_commands: {
    npx_config: string;
    npx_check: string;
    global_update: string;
  };
  notes: string[];
}

function readCurrentVersion(): string {
  const packageJsonUrl = new URL("../../package.json", import.meta.url);
  const packageJson = JSON.parse(fs.readFileSync(packageJsonUrl, "utf8")) as {
    version?: unknown;
  };

  if (typeof packageJson.version !== "string") {
    throw new Error("package.json version is missing");
  }

  return packageJson.version;
}

function parseVersion(version: string): number[] | null {
  const match = /^(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/.exec(version);
  if (!match) return null;
  return match.slice(1).map(Number);
}

function isNewerVersion(latestVersion: string, currentVersion: string): boolean | null {
  const latest = parseVersion(latestVersion);
  const current = parseVersion(currentVersion);
  if (!latest || !current) return null;

  for (let index = 0; index < latest.length; index += 1) {
    if (latest[index] > current[index]) return true;
    if (latest[index] < current[index]) return false;
  }

  return false;
}

function buildBaseInfo(currentVersion: string): Omit<
  PackageUpdateInfo,
  "latest_version" | "update_available"
> {
  return {
    package_name: PACKAGE_NAME,
    current_version: currentVersion,
    checked_registry: NPM_LATEST_URL,
    recommended_mcp_config: {
      command: "npx",
      args: ["-y", LATEST_PACKAGE_SPEC],
    },
    update_commands: {
      npx_config: `npx -y ${LATEST_PACKAGE_SPEC} config`,
      npx_check: `npx -y ${LATEST_PACKAGE_SPEC} check`,
      global_update: `npm install -g ${LATEST_PACKAGE_SPEC}`,
    },
    notes: [
      "Use the @latest MCP config so new client sessions resolve the latest npm version.",
      "Restart or reload the MCP client after changing package versions or MCP configuration.",
      "Do not print update hints during stdio startup; stdout must stay reserved for JSON-RPC.",
    ],
  };
}

export async function buildPackageUpdateInfo(
  fetchImpl: FetchLike = fetch,
): Promise<PackageUpdateInfo> {
  const currentVersion = readCurrentVersion();
  const baseInfo = buildBaseInfo(currentVersion);

  try {
    const response = await fetchImpl(NPM_LATEST_URL, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`npm registry returned HTTP ${response.status}: ${response.statusText}`);
    }

    const payload = (await response.json()) as { version?: unknown };
    const latestVersion = typeof payload.version === "string" ? payload.version : null;

    return {
      ...baseInfo,
      latest_version: latestVersion,
      update_available:
        latestVersion === null ? null : isNewerVersion(latestVersion, currentVersion),
    };
  } catch {
    return {
      ...baseInfo,
      latest_version: null,
      update_available: null,
      notes: [
        ...baseInfo.notes,
        "Could not reach the npm registry; retry later or run npm view @xzxzzx/bilibili-mcp version.",
      ],
    };
  }
}
