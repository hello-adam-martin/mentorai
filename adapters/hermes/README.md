# Hermes adapter for Mentor

The **runnable** Hermes Agent adapter — the concrete form of `_meta/EngineAdapters.md`. It's
engine-specific (Hermes) but **business-neutral**, and it has **no copy of your rules**: the
plugin reads them **live from your model's Governance layer** at runtime. You copy this folder
next to your model and deploy — there's nothing to regenerate and no per-business rules file to
drift out of sync with the Markdown.

> Why it lives here and not in the template: Mentor's core is engine-agnostic — a business's
> seven layers never name an engine. Anything Hermes-specific (this kit) lives in an adapter,
> kept out of the engine-neutral model. Deploying on a different engine means a different
> adapter, not a changed model.

## What's in it

| Path | What it is |
| --- | --- |
| `config.yaml` | Hermes config — native command-approval gate, withheld toolsets, gateway access, plugin enabled. → `~/.hermes/config.yaml` |
| `.env.example` | Secrets template (model key, Telegram token + allow-list, audit-log path). → `~/.hermes/.env` |
| `plugins/mentor-guardrails/` | The plugin: `pre_tool_call` **blocks** hard-limit violations + **gates** approve-tier actions; `post_tool_call` writes an **audit** log. Reads Governance live. |
| `…/detectors.json` | **Business-neutral.** The one engine-specific bit: how to *recognise* a category of tool call in Hermes. Holds no business rules. |
| `check_coverage.py` | Reports which of your Governance rules a detector can spot on Hermes (and which can't). |
| `RUNBOOK.md` | The step-by-step deployment. |

The four enforcement mechanisms from `_meta/Guardrails.md` map onto Hermes as: **withhold** →
`config.yaml` `agent.disabled_toolsets`; **gate** → native `approvals.mode` (shell) + the
plugin's `pre_tool_call` (business actions); **hook** → the plugin's block return; **audit** →
`post_tool_call` → `~/.hermes/logs/mentor-audit.jsonl`.

## Use it (copy + go)

1. **Copy** this folder next to the business model you compiled (the folder with `AGENTS.md` and
   the `1_…7_` layers).
2. **Deploy** per `RUNBOOK.md`. There's nothing to tune for the rules — the plugin reads your
   `2_GovernanceLayer/HardLimits` + `Actions` directly. Edit that Markdown and the change is
   enforced on the next tool call (an mtime cache reloads it); no regenerate, no reload-from-snapshot.
3. **Check coverage:** `python3 check_coverage.py <your-business-folder>` lists which hard limits
   and approve-tier actions a Hermes detector can spot — and which can't (behavioural rules, or
   ones that need a new detector keyword/pattern).

`example/deploy/hermes/` is this adapter copied for Riverside Café — and it carries **no
rules file at all**, because it reads the café's own Governance live. That's the whole point.

## Where the truth lives

- **Rules — which limits exist, which actions need approval, who approves, the caps — live in
  your model's Governance layer.** Edit the Markdown to change them. Single source, no snapshot.
- **`detectors.json` is business-neutral** and holds only Hermes detection: each detector is a
  category (money, data, destructive, public, legal) with the `tool_patterns` / `arg_patterns`
  that recognise it, plus `action` (`block` or `require_approval`). A detector attaches to a
  Governance rule when the rule's **text** contains its keywords. You only touch this file to
  teach Hermes a new tool-call shape — never to change a business rule.
- **Behavioural rules** ("always disclose you're an AI", "disclose allergens") have no tool-call
  detector by nature — they're enforced via the launch prompt + audit review, and show up under
  "uncovered" in `check_coverage.py` (expected).

**Withholding beats matching.** If the agent should never have a capability at all, disable its
toolset in `config.yaml` (or don't wire the tool/credential) rather than relying on a pattern.
