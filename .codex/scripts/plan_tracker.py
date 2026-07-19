#!/usr/bin/env python3
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
ACTIVE_WORK = ROOT / "docs" / "agent-memory" / "active-work.md"


def checkbox_counts(plan_path: Path) -> tuple[int, int]:
    if not plan_path.exists():
        return 0, 0

    completed = 0
    total = 0
    for raw_line in plan_path.read_text(encoding="utf-8", errors="ignore").splitlines():
        line = raw_line.strip()
        if not is_tracked_checkbox(line):
            continue
        total += 1
        if line.startswith("- [x]") or line.startswith("- [X]"):
            completed += 1
    return completed, total


def is_tracked_checkbox(line: str) -> bool:
    if not line.startswith("- ["):
        return False

    normalized = line.lower()
    if "commit" in normalized and "explicit user approval" in normalized:
        return False
    return True


def task_section_completed_count(plan_path: Path) -> int:
    if not plan_path.exists():
        return 0

    sections: list[list[str]] = []
    current: list[str] | None = None
    for line in plan_path.read_text(encoding="utf-8", errors="ignore").splitlines():
        if line.startswith("### Task "):
            if current is not None:
                sections.append(current)
            current = []
            continue
        if current is not None:
            current.append(line)
    if current is not None:
        sections.append(current)

    completed = 0
    for section in sections:
        boxes = [
            line.strip()
            for line in section
            if is_tracked_checkbox(line.strip())
        ]
        if boxes and all(line.startswith("- [x]") or line.startswith("- [X]") for line in boxes):
            completed += 1
    return completed


def resolve_active_work() -> Path:
    return ACTIVE_WORK


def main() -> int:
    print(resolve_active_work())
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
