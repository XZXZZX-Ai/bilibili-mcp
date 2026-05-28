#!/usr/bin/env python3
import argparse
import datetime as dt
import json
import subprocess
import sys
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]


def now_iso() -> str:
    return dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds")


def agent_base(agent: str) -> Path:
    if agent == "codex":
        return Path.home() / ".codex" / "memories" / "bilibili-mcp"
    return ROOT / ".claude"


def run_git(args: list[str]) -> str:
    try:
        result = subprocess.run(
            ["git", "-C", str(ROOT), *args],
            check=False,
            capture_output=True,
            text=True,
            timeout=5,
        )
    except Exception as exc:
        return f"git unavailable: {exc}"
    return result.stdout.strip() or result.stderr.strip()


def read_payload() -> dict[str, Any]:
    raw = sys.stdin.read()
    if not raw.strip():
        return {}
    try:
        payload = json.loads(raw)
        return payload if isinstance(payload, dict) else {"payload": payload}
    except json.JSONDecodeError:
        return {"raw_preview": raw[:500]}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--agent", choices=["codex", "claude"], default="codex")
    args = parser.parse_args()

    base = agent_base(args.agent)
    runtime = base / "runtime"
    runtime.mkdir(parents=True, exist_ok=True)

    payload = read_payload()
    branch = run_git(["branch", "--show-current"])
    status = run_git(["status", "--short"])
    roadmap = ROOT / "docs" / "superpowers" / "plans" / "2026-05-27-stabilization-roadmap.md"

    lines = [
        f"# {args.agent} pre-compact checkpoint",
        f"Generated: {now_iso()}",
        f"Repository: {ROOT}",
        f"Branch: {branch or 'unknown'}",
        "",
        "## Current Goal",
        str(payload.get("trigger") or payload.get("event") or "PreCompact triggered"),
        "",
        "## Git Status",
        status or "Clean or unavailable.",
        "",
        "## Active Roadmap",
        str(roadmap),
        "",
        "## Resume Guidance",
        "- Re-read AGENTS.md, CLAUDE.md, and docs/agent-memory before substantial work.",
        "- Treat runtime observations as candidates only; promote durable lessons manually.",
        "- If debugging was in progress, inspect latest observation-summary.md before continuing.",
    ]

    output = "\n".join(lines) + "\n"
    (runtime / "pre-compact-checkpoint.md").write_text(output, encoding="utf-8")
    print(json.dumps({"suppressOutput": True}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
