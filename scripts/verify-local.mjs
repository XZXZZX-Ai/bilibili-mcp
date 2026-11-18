// Check the publishable file list after the build.
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

// A static shell command works with the npm.cmd shim on Windows.
const pack = JSON.parse(execSync("npm pack --dry-run --json --ignore-scripts", { encoding: "utf8" }));
const files = pack[0].files.map((f) => f.path);
const manifest = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const privatePaths = /(?:^|\/)(?:src|tests?|scripts|\.git|\.github|\.claude|\.codex|\.agents|\.scratch|\.harness|harness|agent-memory|strix_runs|\.env(?:\.[^/]*)?|\.npmrc)(?:\/|$)/i;
const privateArtifacts = /recovery-bundle|(?:^|\/)events\.jsonl$/i;
const unexpected = files.filter((file) => privatePaths.test(file) || privateArtifacts.test(file));
const entryPoints = [manifest.main, manifest.module, manifest.types, ...Object.values(manifest.bin)];
const missing = [...new Set(entryPoints)].filter((file) => !files.includes(file));

if (unexpected.length || missing.length) {
  if (unexpected.length) console.error("Unexpected npm package paths: " + unexpected.join(", "));
  if (missing.length) console.error("Missing npm entry points: " + missing.join(", "));
  process.exit(1);
}
console.log(`package contents OK: ${files.length} files`);
