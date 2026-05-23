# Riverside Café — Hermes deploy kit

This is the canonical Hermes adapter (**`/adapters/hermes/`**) copied for Riverside Café — the
worked example for the tutorial's "Deploy on Hermes" step.

**Notice there is no rules file here.** The plugin reads the café's **own Governance layer live**
(`../../2_GovernanceLayer/HardLimits` + `Actions`), so the café's hard limits, the $50 refund
cap, the approver, and the allergen rule all come straight from the model — edit that Markdown
and the guardrails change with it. The only café-specific file in this kit is `config.yaml`
(it withholds the `web` toolset for a Front-of-House pilot). Everything in
`plugins/mentor-guardrails/` is byte-identical to the canonical adapter.

**To deploy, follow the canonical runbook:** [`/adapters/hermes/RUNBOOK.md`](../../../adapters/hermes/RUNBOOK.md).
Start Hermes inside this café business folder (it auto-loads `AGENTS.md` and the plugin finds the
Governance layer from there), copy `config.yaml` → `~/.hermes/config.yaml`, copy
`plugins/mentor-guardrails` → `~/.hermes/plugins/`, and `hermes plugins enable mentor-guardrails`.

Check what's enforceable: `python3 ../../../adapters/hermes/check_coverage.py .` from this
folder lists which café rules a Hermes detector can spot (the allergen + AI-disclosure rules will
show as uncovered — they're behavioural, enforced via the prompt + audit).
