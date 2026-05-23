# Recommended Defaults

Safe-by-default settings for a new Mentor instance. These are universal — they hold for almost any
business — so **Mentor Studio pre-fills them** and you edit down. The template's own node files
stay as blank placeholders; this document is the rationale.

The guiding principle: **start cautious, loosen on evidence.** It's cheap to grant more autonomy
later; it's expensive to undo a bad automatic action.

## Autonomy posture (Governance)

New actions default to `recommend` (propose, then act on confirmation), never `auto`. Promote an
action toward `auto` only when the Learning layer shows it's been safe. Reserve `approve` for
anything irreversible, financial, or sensitive.

## Starter hard limits (Governance)

Bright lines that apply to almost any business. Keep these; add business-specific ones.

- Never move money, issue refunds, or change payouts without approval.
- Never share personal or customer data with third parties without approval.
- Never make legally binding commitments on the business's behalf without approval.
- Never make public or media statements as the business without approval.
- Never permanently delete or irreversibly destroy records without approval.
- Always disclose that you are an AI when asked.

A hard limit is only as strong as its enforcement — back each with an engine hook or by withholding
the relevant tool/credential, not with instruction text alone (see `EngineAdapters.md`).

## Default escalations (Governance)

- **Safety / security / legal emergency** → notify the responsible human immediately; overrides quiet hours.
- **Repeated failure or disagreement** → if an action fails ~3× or two agents disagree, stop, log the
  reasoning, and escalate — never retry blindly ("no blind loops").

## Audit (Governance) — on by default

`log_all_actions: true`, `require_reasoning: true`, `human_reviewable: true`, retain ~365 days. Every
action records which objective it served and why, explainable in plain language.

## Notifications (Governance)

Quiet hours `22:00–07:00` (local); only `critical` breaks through.

## Strategic weighting

`governance_supersedes_strategy: true` (authority always beats intent), resolve close calls by
`escalate` to a human, `tie_margin: 0.05`.

## Core / engine

Leave `engine_adapter: null` until deployment — Mentor is engine-agnostic. Choose an adapter
(`EngineAdapters.md`) when you decide where to run it.
