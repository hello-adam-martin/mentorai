#!/usr/bin/env python3
"""check_coverage.py — does the Hermes detector library cover this model's Governance?

Reads your model's LIVE Governance layer + the adapter's detectors.json and reports which
hard limits / approve-tier actions are detectable on Hermes, and which aren't (so an
undetectable rule is surfaced loudly instead of silently unenforced).

Usage:
    python3 check_coverage.py [path-to-business-folder]

Defaults to the current directory. Behavioural rules (e.g. "always disclose you're an AI",
"disclose allergens") legitimately have no tool-call detector — they're enforced via the launch
prompt + audit review, so seeing them under "uncovered" is expected.
"""
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "plugins", "mentor-guardrails"))

model = os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 else os.getcwd()
os.environ["MENTOR_MODEL_DIR"] = model

import policy  # noqa: E402

rep = policy.coverage_report()
print(f"Model: {rep['model']}")
print(f"Enforceable rules built: {rep['rules']}\n")

print("COVERED (a detector can spot it on Hermes):")
for c in rep["covered"]:
    print(f"  ✓ {c['id']}  via {', '.join(c['via'])}")
if not rep["covered"]:
    print("  (none)")

print("\nUNCOVERED (no Hermes detector — behavioural, or add a detector keyword/pattern):")
for u in rep["uncovered"]:
    print(f"  • [{u['kind']}] {u['id']}: {u['text']}")
if not rep["uncovered"]:
    print("  (none)")

sys.exit(0)
