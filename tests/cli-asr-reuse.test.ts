import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { setupCredentials } from "../src/cli.js";
import { readAsrState, type AsrState } from "../src/asr/state.js";

vi.mock("../src/asr/state.js", async (original) => ({
  ...await original<typeof import("../src/asr/state.js")>(),
  readAsrState: vi.fn(),
}));

const tty = Object.getOwnPropertyDescriptor(process.stdin, "isTTY");
const exitCode = process.exitCode;
beforeEach(() => {
  Object.defineProperty(process.stdin, "isTTY", { configurable: true, value: true });
  vi.spyOn(console, "log").mockImplementation(() => {});
  vi.mocked(readAsrState).mockReturnValue({
    kind: "ready", modelKey: "small", version: 2,
    executionProfile: { device: "cpu", computeType: "int8" },
    deviceReadiness: "ready", migrationStatus: "completed",
    failureCategory: "cuda_runtime_missing",
  });
});
afterEach(() => {
  vi.restoreAllMocks();
  if (tty) Object.defineProperty(process.stdin, "isTTY", tty);
  else delete (process.stdin as { isTTY?: boolean }).isTTY;
  process.exitCode = exitCode;
});

it("shows the installed CPU fallback and reuses it on Enter without installation", async () => {
  const ask = vi.fn(async () => "");
  const install = vi.fn(async () => ({ success: true }));
  await setupCredentials(async () => true, install, ask);
  expect(ask).toHaveBeenCalledExactlyOnceWith("是否重新配置 ASR？[y/N] ");
  expect(console.log).toHaveBeenCalledWith(expect.stringContaining("small / cpu / int8"));
  expect(console.log).toHaveBeenCalledWith("继续使用现有 ASR，无需重新安装。");
  expect(install).not.toHaveBeenCalled();
});

it("shows an installed CUDA profile and keeps it on No", async () => {
  vi.mocked(readAsrState).mockReturnValue({
    kind: "ready", modelKey: "base", executionProfile: { device: "cuda", computeType: "float16" },
    deviceReadiness: "ready", migrationStatus: "completed",
  });
  const install = vi.fn(async () => ({ success: true }));
  await setupCredentials(async () => true, install, async () => "n");
  expect(console.log).toHaveBeenCalledWith(expect.stringContaining("base / cuda / float16"));
  expect(install).not.toHaveBeenCalled();
});

it.each(["small", "tiny"])("allows explicit reconfiguration to %s", async (model) => {
  const ask = vi.fn().mockResolvedValueOnce("y").mockResolvedValueOnce(model).mockResolvedValueOnce("cpu");
  const install = vi.fn(async () => ({ success: true }));
  await setupCredentials(async () => true, install, ask);
  expect(ask).toHaveBeenNthCalledWith(1, "是否重新配置 ASR？[y/N] ");
  expect(install).toHaveBeenCalledExactlyOnceWith(model, "cpu");
});

it.each<AsrState>([
  { kind: "incomplete" },
  { kind: "ready", version: 1, modelKey: "small" },
  { kind: "ready", modelKey: "small", deviceReadiness: "migration_pending", migrationStatus: "pending" },
])("offers repair for unready installation %j without claiming reuse", async (state) => {
  vi.mocked(readAsrState).mockReturnValue(state);
  const ask = vi.fn(async () => "");
  const install = vi.fn(async () => ({ success: true }));
  await setupCredentials(async () => true, install, ask);
  expect(ask).toHaveBeenCalledExactlyOnceWith("是否修复或重新验证 ASR？[y/N] ");
  expect(console.log).not.toHaveBeenCalledWith(expect.stringContaining("ASR 已安装并就绪"));
  expect(install).not.toHaveBeenCalled();
});

it("offers first-time installation when absent", async () => {
  vi.mocked(readAsrState).mockReturnValue({ kind: "not_installed" });
  const ask = vi.fn().mockResolvedValueOnce("y").mockResolvedValueOnce("").mockResolvedValueOnce("auto");
  const install = vi.fn(async () => ({ success: true }));
  await setupCredentials(async () => true, install, ask);
  expect(ask).toHaveBeenNthCalledWith(1, "是否现在安装？[y/N] ");
  expect(install).toHaveBeenCalledExactlyOnceWith("small", "auto");
});

it("does not read ASR or prompt after failed login", async () => {
  vi.mocked(readAsrState).mockClear();
  const ask = vi.fn();
  const install = vi.fn(async () => ({ success: true }));
  await setupCredentials(async () => false, install, ask);
  expect(readAsrState).not.toHaveBeenCalled();
  expect(ask).not.toHaveBeenCalled();
  expect(install).not.toHaveBeenCalled();
});
