import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, symlinkSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";
import { afterAll, beforeAll, expect, it } from "vitest";

const dir = mkdtempSync(path.join(process.cwd(), ".cli-entry-test-"));
const cli = path.join(dir, "cli.mjs");

beforeAll(async () => {
  await build({ entryPoints: ["src/cli.ts"], outfile: cli, bundle: true,
    platform: "node", format: "esm", packages: "external" });
});
afterAll(() => rmSync(dir, { recursive: true, force: true }));

it.skipIf(process.platform === "win32")("runs the CLI through a symlink, as npm bin does", () => {
  const link = path.join(dir, "bilibili-mcp");
  symlinkSync(cli, link);
  const output = execFileSync(process.execPath, [link, "setup", "--help"], { encoding: "utf8" });
  expect(output).toContain("--non-interactive");
});

it("runs directly but does not start when imported", () => {
  expect(execFileSync(process.execPath, [cli, "setup", "--help"], { encoding: "utf8" }))
    .toContain("--non-interactive");
  const imported = execFileSync(process.execPath, ["--input-type=module", "-e",
    "await import(process.argv[1]); console.log('imported');", pathToFileURL(cli).href], { encoding: "utf8" });
  expect(imported.trim()).toBe("imported");
});

it.skipIf(process.platform === "win32")("echoes menu choices while keeping manual credentials hidden", () => {
  const script = String.raw`
import os, pty, select, subprocess, sys, tempfile, time
master, slave = pty.openpty()
env = os.environ.copy()
for key in ('BILIBILI_SESSDATA', 'BILIBILI_BILI_JCT', 'BILIBILI_DEDEUSERID'):
    env.pop(key, None)
with tempfile.TemporaryDirectory() as home:
    env['HOME'] = home
    env['XDG_CONFIG_HOME'] = home
    child = subprocess.Popen([sys.argv[1], sys.argv[2], 'setup'], stdin=slave, stdout=slave, stderr=slave, env=env)
    os.close(slave)
    def read_until(needle):
        data = b''
        deadline = time.monotonic() + 5
        while needle not in data and time.monotonic() < deadline:
            if select.select([master], [], [], 0.1)[0]:
                data += os.read(master, 4096)
        if needle not in data:
            raise RuntimeError('prompt not reached')
        return data
    try:
        read_until('手动 Cookie：'.encode())
        os.write(master, b'2')
        echoed = read_until(b'2')
        os.write(master, b'\n')
        read_until(b'SESSDATA: ')
        os.write(master, b'SYNTHETIC_SECRET_ABC')
        time.sleep(0.2)
        hidden = b''
        while select.select([master], [], [], 0)[0]:
            hidden += os.read(master, 4096)
        assert b'SYNTHETIC_SECRET_ABC' not in hidden, 'credential echoed'
    finally:
        child.kill()
        child.wait()
        os.close(master)
`;
  expect(() => execFileSync("python3", ["-c", script, process.execPath, cli], { timeout: 8000 })).not.toThrow();
}, 10_000);
