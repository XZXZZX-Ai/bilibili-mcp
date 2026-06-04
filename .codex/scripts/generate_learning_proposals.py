#!/usr/bin/env python3
import argparse
import datetime as dt
import json
import re
from collections import defaultdict
from pathlib import Path
from typing import Any

from plan_tracker import resolve_active_plan, task_section_completed_count

ROOT = Path(__file__).resolve().parents[2]
PROPOSAL_PATH = ROOT / "docs" / "agent-memory" / "pending-learning-proposals.md"
SECRET_RE = re.compile(
    r"(?i)(SESSDATA|bili_jct|DedeUserID|Cookie|Authorization|access_token|api[_-]?key|token)\s*[:=]\s*[^;\s\"']+"
)


def now_date() -> str:
    return dt.datetime.now().strftime("%Y-%m-%d")


def codex_memory() -> Path:
    return Path.home() / ".codex" / "memories" / "bilibili-mcp" / "memory"


def claude_memory() -> Path:
    return ROOT / ".claude" / "memory"


def runtime_dir(source: str) -> Path:
    if source == "codex":
        return Path.home() / ".codex" / "memories" / "bilibili-mcp" / "runtime"
    return ROOT / ".claude" / "runtime"


def read_jsonl(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    rows: list[dict[str, Any]] = []
    for line in path.read_text(encoding="utf-8").splitlines():
        try:
            row = json.loads(line)
        except json.JSONDecodeError:
            continue
        if isinstance(row, dict):
            rows.append(row)
    return rows


def redact(text: Any) -> str:
    value = "" if text is None else str(text)
    value = SECRET_RE.sub(lambda match: f"{match.group(1)}=[REDACTED]", value)
    if len(value) > 500:
        return value[:500] + "...[truncated]"
    return value


def stable_candidates() -> list[dict[str, Any]]:
    candidates = read_jsonl(codex_memory() / "candidates.jsonl") + read_jsonl(claude_memory() / "candidates.jsonl")
    grouped: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for item in candidates:
        combined = f"{item.get('command', '')}\n{item.get('stderr', '')}".lower()
        if "synthetic" in combined:
            continue
        cid = item.get("candidate_id") or f"{item.get('category')}:{item.get('command')}:{item.get('stderr')}"
        grouped[str(cid)].append(item)

    proposals: list[dict[str, Any]] = []
    for cid, items in grouped.items():
        latest = items[-1]
        evidence_count = max(len(items), int(latest.get("evidence_count") or 1))
        confidence = float(latest.get("confidence") or 0.4)
        if evidence_count < 2 and confidence < 0.7 and not latest.get("promote_after_review"):
            continue
        proposals.append(
            {
                "candidate_id": cid,
                "type": "lesson",
                "target": "docs/agent-memory/lessons-learned.md",
                "confidence": max(confidence, 0.7 if evidence_count >= 2 else confidence),
                "evidence_count": evidence_count,
                "agents": sorted({str(item.get("agent", "unknown")) for item in items}),
                "category": latest.get("category", "unknown"),
                "command": redact(latest.get("command")),
                "stderr": redact(latest.get("stderr")),
                "status": "pending",
            }
        )
    return sorted(proposals, key=lambda item: (-item["confidence"], -item["evidence_count"], item["candidate_id"]))


def phase_boundary_message(source: str, proposal_count: int) -> str | None:
    runtime = runtime_dir(source)
    runtime.mkdir(parents=True, exist_ok=True)
    state_path = runtime / "learning-proposal-phase-state.json"
    reminder_path = runtime / "learning-proposal-reminder.md"

    previous_plan = None
    previous = 0
    if state_path.exists():
        try:
            state = json.loads(state_path.read_text(encoding="utf-8"))
            previous = int(state.get("completed_phase_count", 0))
            previous_plan = state.get("active_plan")
        except (ValueError, json.JSONDecodeError, AttributeError):
            previous = 0

    active_plan = resolve_active_plan(previous_plan)
    completed = task_section_completed_count(active_plan)
    if previous_plan and Path(str(previous_plan)) != active_plan:
        previous = 0

    state_path.write_text(
        json.dumps(
            {
                "completed_phase_count": completed,
                "updated": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
                "active_plan": str(active_plan),
            },
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )

    if completed > previous and proposal_count > 0:
        message = (
            f"Learning proposal review reminder: completed plan phases increased "
            f"from {previous} to {completed} for {active_plan.name}. Review {PROPOSAL_PATH} and approve with "
            "the agreed approval phrase if the proposals should be promoted."
        )
        reminder_path.write_text(message + "\n", encoding="utf-8")
        return message
    return None


def render(proposals: list[dict[str, Any]]) -> str:
    lines = [
        "# Pending Learning Proposals",
        "",
        "This file is generated by `.codex/scripts/generate_learning_proposals.py`.",
        "It is a review queue only. Do not treat entries as formal memory until the user approves promotion.",
        "",
        "Approval phrase: `批准本轮 learning proposals`.",
        "",
        f"Generated: {now_date()}",
        "",
    ]

    if not proposals:
        lines.extend(
            [
                "## No Proposals",
                "",
                "No candidate currently meets the promotion threshold.",
                "",
                "Threshold: repeated evidence, confidence >= 0.7, or explicit `promote_after_review` signal.",
            ]
        )
        return "\n".join(lines) + "\n"

    for index, proposal in enumerate(proposals, start=1):
        lines.extend(
            [
                f"## Proposal {now_date()}-{index:02d}",
                "",
                f"Type: {proposal['type']}",
                f"Status: {proposal['status']}",
                f"Candidate ID: `{proposal['candidate_id']}`",
                f"Confidence: {proposal['confidence']}",
                f"Evidence count: {proposal['evidence_count']}",
                f"Agents: {', '.join(proposal['agents'])}",
                f"Suggested target: `{proposal['target']}`",
                "",
                "### Evidence",
                "",
                f"- Category: `{proposal['category']}`",
                f"- Command: `{proposal['command']}`",
                f"- Error preview: `{proposal['stderr']}`",
                "",
                "### Proposed Entry",
                "",
                f"- Lesson: `{proposal['command']}` has produced repeated `{proposal['category']}` failures in agent runtime observations.",
                f"- Evidence: Candidate `{proposal['candidate_id']}` appeared {proposal['evidence_count']} time(s) across {', '.join(proposal['agents'])}.",
                "- Future behavior: Before promoting this lesson, Codex should confirm the failure is not synthetic, transient, or already covered by existing project memory.",
                "",
                "### Review Checklist",
                "",
                "- [ ] Verified against real task context, not only a synthetic dry run.",
                "- [ ] Contains no Cookie, token, `.env`, or secret values.",
                "- [ ] Will affect future Codex planning or Claude Code execution.",
                "- [ ] Not already captured in `docs/agent-memory/`.",
                "",
            ]
        )
    return "\n".join(lines)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", choices=["codex", "claude", "manual"], default="manual")
    args = parser.parse_args()

    proposals = stable_candidates()
    PROPOSAL_PATH.parent.mkdir(parents=True, exist_ok=True)
    PROPOSAL_PATH.write_text(render(proposals), encoding="utf-8")
    reminder = phase_boundary_message(args.source, len(proposals))
    print(json.dumps({"suppressOutput": True}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
