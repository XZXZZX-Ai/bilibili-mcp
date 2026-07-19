"""Minimal deterministic checks for stop_summary.py path matching and reminder branches."""

import json
import sys
import io
from pathlib import Path

# Insert the script dir so we can import stop_summary directly
_script_dir = Path(__file__).resolve().parent
sys.path.insert(0, str(_script_dir))

from stop_summary import matches, harness_artifact_reminders, main

# -- matches ----------------------------------------------------------

def test_matches_exact_file():
    assert matches("AGENTS.md", ("src/",), {"AGENTS.md", "CLAUDE.md"})
    assert not matches("README.md", ("src/",), {"AGENTS.md", "CLAUDE.md"})

def test_matches_prefix():
    assert matches("src/bilibili/wbi.ts", ("src/bilibili/", "tests/"), set())
    assert not matches("docs/readme.md", ("src/", "tests/"), set())

# -- harness_artifact_reminders (all three branches) -------------------

def test_codemap_branch():
    r = harness_artifact_reminders(["src/server.ts"])
    assert any("Codemap" in m for m in r), r

def test_security_branch():
    r = harness_artifact_reminders(["AGENTS.md"])
    assert any("security" in m for m in r), r

def test_eval_branch_below_threshold():
    r = harness_artifact_reminders(["AGENTS.md", "CLAUDE.md"])
    assert not any("eval" in m for m in r), r  # only 2, below threshold of 3

def test_eval_branch_at_threshold():
    r = harness_artifact_reminders([".claude/agents/a.md", ".codex/hooks.json", "docs/agent-memory/x.md"])
    assert any("eval" in m for m in r), r

def test_no_false_positive():
    r = harness_artifact_reminders(["README.md", "CHANGELOG.md"])
    assert r == [], r

# -- stdout is JSON-safe ----------------------------------------------

def test_main_stdout_is_json_control():
    old = sys.stdout
    sys.stdout = io.StringIO()
    try:
        main()  # no args → default agent "codex"
        out = sys.stdout.getvalue().strip()
    finally:
        sys.stdout = old
    obj = json.loads(out)
    assert obj == {"suppressOutput": True}, obj


if __name__ == "__main__":
    passed = 0
    for name, fn in list(globals().items()):
        if name.startswith("test_"):
            try:
                fn()
                print(f"PASS {name}")
                passed += 1
            except Exception:
                print(f"FAIL {name}")
                import traceback
                traceback.print_exc()
    total = sum(1 for n in globals() if n.startswith("test_"))
    print(f"\n{passed}/{total} passed")
    if passed != total:
        sys.exit(1)
