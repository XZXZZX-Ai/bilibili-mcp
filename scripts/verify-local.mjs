// Local mirror of the CI guards that npm test / npm run build do not cover.
// Runs the npm package forbidden-paths check on every call, and the harness
// core test modules when paths owned by the Harness workflow changed.
import { execFileSync, spawnSync } from "node:child_process";

const run = (file, args, options = {}) =>
  spawnSync(file, args, { stdio: "inherit", ...options });

const pack = JSON.parse(
  // npm is a .cmd shim on Windows; shell:true is required (direct .cmd spawn
  // is blocked) and safe here because every argument is a static literal.
  execFileSync("npm", ["pack", "--dry-run", "--json", "--ignore-scripts"], {
    encoding: "utf8",
    shell: process.platform === "win32",
  }),
);
const files = pack[0].files.map((f) => f.path);
const prefixes = ["harness/", ".harness/", "docs/agent-memory/", "tests/", "strix_runs/"];
const markers = ["recovery-bundle", "events.jsonl"];
const bad = files.filter((p) => prefixes.some((x) => p.startsWith(x)) || markers.some((x) => p.includes(x)));
if (bad.length) {
  console.error("forbidden paths in npm package: " + bad.join(", "));
  process.exit(1);
}
console.log(`package contents OK: ${files.length} files`);

const harnessPaths = /^harness\/|^\.codex\/|^\.claude\/|^docs\/agent-memory\/|^RULES\.md$|^AGENTS\.md$|^CLAUDE\.md$|^\.gitattributes$|^\.github\/workflows\/harness\.yml$/;
let changed = [];
try {
  changed = execFileSync("git", ["diff", "--name-only", "origin/master"], { encoding: "utf8" })
    .split("\n")
    .filter(Boolean);
} catch {
  console.log("origin/master unavailable; running harness tests unconditionally");
}
if (changed.length === 0 || changed.some((p) => harnessPaths.test(p))) {
  const modules = [
    "harness.tests.test_contracts",
    "harness.tests.test_events",
    "harness.tests.test_cli_and_adapters",
    "harness.tests.test_memory",
  ];
  const python = process.platform === "win32" ? "python" : "python3";
  const result = run(python, ["-m", "unittest", ...modules], { env: { ...process.env, PYTHONUTF8: "1" } });
  if (result.error?.code === "ENOENT" && python === "python3") {
    const retry = run("python", ["-m", "unittest", ...modules], { env: { ...process.env, PYTHONUTF8: "1" } });
    process.exit(retry.status ?? 1);
  }
  process.exit(result.status ?? 1);
} else {
  console.log("no harness-owned paths changed; skipping harness tests (CI runs them on harness path changes)");
}
