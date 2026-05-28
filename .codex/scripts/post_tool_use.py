#!/usr/bin/env python3
import argparse
import datetime as dt
import json
import re
import sys
import hashlib
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[2]
SENSITIVE_PATTERNS = [
    re.compile(r"(?i)\b(SESSDATA|bili_jct|DedeUserID|Cookie|Authorization|access_token|api[_-]?key|token)\b\s*[:=]\s*[^;\s\"']+"),
    re.compile(r"(?i)\b(Bearer|Basic)\s+[A-Za-z0-9._~+/=-]{16,}"),
    re.compile(r"\b[A-Za-z0-9._~+/=-]{48,}\b"),
]


def now_iso() -> str:
    return dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds")


def redact(value: Any, limit: int = 1600) -> str:
    text = "" if value is None else str(value)
    for pattern in SENSITIVE_PATTERNS:
        text = pattern.sub(lambda match: f"{match.group(1) if match.lastindex else 'secret'}=[REDACTED]", text)
    if len(text) > limit:
        return text[:limit] + "...[truncated]"
    return text


def find_key(data: Any, names: set[str]) -> Any:
    if isinstance(data, dict):
        for key, value in data.items():
            if key in names:
                return value
        for value in data.values():
            found = find_key(value, names)
            if found is not None:
                return found
    elif isinstance(data, list):
        for item in data:
            found = find_key(item, names)
            if found is not None:
                return found
    return None


def read_payload() -> dict[str, Any]:
    raw = sys.stdin.read()
    if not raw.strip():
        return {}
    try:
        payload = json.loads(raw)
        return payload if isinstance(payload, dict) else {"payload": payload}
    except json.JSONDecodeError:
        return {"raw": raw}


def as_int(value: Any) -> int | None:
    if value is None:
        return None
    if isinstance(value, bool):
        return int(value)
    if isinstance(value, int):
        return value
    try:
        return int(str(value))
    except ValueError:
        return None


def category_for(command: str) -> str:
    lower = command.lower()
    if "npm run build" in lower or "tsc" in lower:
        return "build"
    if "npm test" in lower or "vitest" in lower or " test" in lower:
        return "test"
    if "lint" in lower:
        return "lint"
    if "npm pack" in lower or "npm publish" in lower:
        return "package"
    if lower.startswith("git ") or " git " in lower:
        return "git"
    return "shell"


def should_record(payload: dict[str, Any], exit_code: int | None, stderr: Any, error: Any) -> bool:
    if exit_code is not None and exit_code != 0:
        return True
    if stderr or error:
        return True
    status = find_key(payload, {"status", "outcome"})
    return isinstance(status, str) and status.lower() in {"failed", "error"}


def append_jsonl(path: Path, row: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(row, ensure_ascii=False, sort_keys=True) + "\n")


def agent_base(agent: str) -> Path:
    if agent == "codex":
        return Path.home() / ".codex" / "memories" / "bilibili-mcp"
    return ROOT / ".claude"


def candidate_id(category: str, command: str, stderr: str) -> str:
    fingerprint = f"{category}\n{command}\n{stderr[:240]}"
    return hashlib.sha256(fingerprint.encode("utf-8")).hexdigest()[:12]


def evidence_count(path: Path, cid: str) -> int:
    if not path.exists():
        return 1
    count = 1
    for line in path.read_text(encoding="utf-8").splitlines():
        try:
            row = json.loads(line)
        except json.JSONDecodeError:
            continue
        if isinstance(row, dict) and row.get("candidate_id") == cid:
            count += 1
    return count


def confidence_for(category: str, count: int) -> float:
    base = {
        "build": 0.65,
        "test": 0.65,
        "lint": 0.6,
        "package": 0.7,
        "git": 0.55,
    }.get(category, 0.4)
    return min(0.9, round(base + max(0, count - 1) * 0.05, 2))


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--agent", choices=["codex", "claude"], default="codex")
    args = parser.parse_args()

    payload = read_payload()
    tool = find_key(payload, {"tool_name", "tool", "name"}) or "unknown"
    command = find_key(payload, {"command", "cmd"}) or ""
    exit_code = as_int(find_key(payload, {"exit_code", "exitCode", "returncode", "return_code"}))
    stderr = find_key(payload, {"stderr", "errorOutput"})
    stdout = find_key(payload, {"stdout", "output"})
    error = find_key(payload, {"error", "message"})

    if not should_record(payload, exit_code, stderr, error):
        return 0

    command_text = redact(command, limit=500)
    category = category_for(command_text)
    row = {
        "ts": now_iso(),
        "agent": args.agent,
        "tool": redact(tool, limit=120),
        "category": category,
        "command": command_text,
        "exit_code": exit_code,
        "stderr": redact(stderr or error, limit=1200),
        "stdout_preview": redact(stdout, limit=500),
    }

    memory_root = agent_base(args.agent) / "memory"
    append_jsonl(memory_root / "observations.jsonl", row)

    if category in {"build", "test", "lint", "package", "git"}:
        candidate = dict(row)
        cid = candidate_id(category, command_text, row["stderr"])
        count = evidence_count(memory_root / "candidates.jsonl", cid)
        candidate["candidate_id"] = cid
        candidate["scope"] = "project"
        candidate["evidence_count"] = count
        candidate["confidence"] = confidence_for(category, count)
        candidate["promotion_status"] = "candidate"
        candidate["promote_after_review"] = count >= 2 and candidate["confidence"] >= 0.7
        candidate["promotion_note"] = "Review before adding to docs/agent-memory."
        append_jsonl(memory_root / "candidates.jsonl", candidate)

    print(json.dumps({"suppressOutput": True}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
