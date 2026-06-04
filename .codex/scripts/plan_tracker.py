#!/usr/bin/env python3
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
PLANS_DIR = ROOT / "docs" / "superpowers" / "plans"

KNOWN_PLAN_ORDER = [
    "2026-05-27-stabilization-roadmap.md",
    "2026-05-28-bilibili-client-split-implementation-plan.md",
    "2026-05-28-mcp-tool-surface-implementation-plan.md",
    "2026-05-28-documentation-release-polish-implementation-plan.md",
]


def checkbox_counts(plan_path: Path) -> tuple[int, int]:
    if not plan_path.exists():
        return 0, 0

    completed = 0
    total = 0
    for raw_line in plan_path.read_text(encoding="utf-8", errors="ignore").splitlines():
        line = raw_line.strip()
        if not line.startswith("- ["):
            continue
        total += 1
        if line.startswith("- [x]") or line.startswith("- [X]"):
            completed += 1
    return completed, total


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
        boxes = [line.strip() for line in section if line.strip().startswith("- [")]
        if boxes and all(line.startswith("- [x]") or line.startswith("- [X]") for line in boxes):
            completed += 1
    return completed


def is_incomplete_plan(plan_path: Path) -> bool:
    completed, total = checkbox_counts(plan_path)
    return total > 0 and completed < total


def plan_sort_key(path: Path) -> tuple[int, str]:
    try:
        return KNOWN_PLAN_ORDER.index(path.name), path.name
    except ValueError:
        return len(KNOWN_PLAN_ORDER), path.name


def is_tracked_plan(path: Path) -> bool:
    return path.name in KNOWN_PLAN_ORDER or path.name.endswith("-implementation-plan.md")


def candidate_plans() -> list[Path]:
    if not PLANS_DIR.exists():
        return []
    plans = [path for path in PLANS_DIR.glob("*.md") if is_tracked_plan(path)]
    return sorted(plans, key=plan_sort_key)


def resolve_active_plan(previous_plan: str | None = None) -> Path:
    if previous_plan:
        previous = Path(previous_plan)
        if not previous.is_absolute():
            previous = ROOT / previous
        if is_tracked_plan(previous) and is_incomplete_plan(previous):
            return previous

    incomplete = [path for path in candidate_plans() if is_incomplete_plan(path)]
    if incomplete:
        return incomplete[0]

    plans = candidate_plans()
    if plans:
        return plans[-1]

    return PLANS_DIR / "2026-05-27-stabilization-roadmap.md"


def main() -> int:
    print(resolve_active_plan())
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
