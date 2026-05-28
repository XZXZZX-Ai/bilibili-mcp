#!/usr/bin/env python3
import argparse
import datetime as dt
import json
import subprocess
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]


def now_iso() -> str:
    return dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds")


def read_recent(path: Path, limit: int = 8) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    rows: list[dict[str, Any]] = []
    for line in path.read_text(encoding="utf-8").splitlines()[-limit:]:
        try:
            parsed = json.loads(line)
            if isinstance(parsed, dict):
                rows.append(parsed)
        except json.JSONDecodeError:
            continue
    return rows


def agent_base(agent: str) -> Path:
    if agent == "codex":
        return Path.home() / ".codex" / "memories" / "bilibili-mcp"
    return ROOT / ".claude"


def git_status_count() -> int:
    try:
        result = subprocess.run(
            ["git", "-C", str(ROOT), "status", "--short"],
            check=False,
            capture_output=True,
            text=True,
            timeout=5,
        )
    except Exception:
        return 0
    return len([line for line in result.stdout.splitlines() if line.strip()])


def compact_advice(observations: list[dict[str, Any]], candidates: list[dict[str, Any]]) -> str:
    dirty_count = git_status_count()
    if candidates:
        return "Consider manual compact after recording the current failure/debug state in docs or handoff notes."
    if dirty_count >= 8:
        return "Consider manual compact after summarizing the current phase; the working tree has many changed paths."
    if observations:
        return "Compact is optional. Keep current context if you are still debugging the same failure."
    return "No compact needed from hook signals."


def phase_learning_reminder(agent: str) -> str | None:
    reminder = agent_base(agent) / "runtime" / "learning-proposal-reminder.md"
    if reminder.exists():
        return reminder.read_text(encoding="utf-8").strip()
    return None


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--agent", choices=["codex", "claude"], default="codex")
    args = parser.parse_args()

    base = agent_base(args.agent)
    memory = base / "memory"
    runtime = base / "runtime"
    runtime.mkdir(parents=True, exist_ok=True)
    memory.mkdir(parents=True, exist_ok=True)

    observations = read_recent(memory / "observations.jsonl")
    candidates = read_recent(memory / "candidates.jsonl")

    lines = [
        f"# {args.agent} hook stop summary",
        f"Generated: {now_iso()}",
        f"Recent observations: {len(observations)}",
        f"Recent candidates: {len(candidates)}",
        "",
    ]

    if candidates:
        lines.append("## Candidate Failures")
        for item in candidates[-5:]:
            command = item.get("command") or "(no command)"
            category = item.get("category") or "unknown"
            exit_code = item.get("exit_code")
            lines.append(f"- {category}: exit={exit_code} command={command}")
    else:
        lines.append("No recent promotion candidates.")

    lines.extend(["", "## Strategic Compact", compact_advice(observations, candidates)])

    reminder = phase_learning_reminder(args.agent)
    if reminder:
        lines.extend(["", "## Phase Learning Review", reminder])

    content = "\n".join(lines) + "\n"
    (runtime / "last-stop-summary.txt").write_text(content, encoding="utf-8")
    (memory / "observation-summary.md").write_text(content, encoding="utf-8")

    print(json.dumps({"suppressOutput": True}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
