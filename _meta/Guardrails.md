# Guardrails — Enforcing Governance

The Governance layer *states* what the system may do, what needs sign-off, and the lines it
must never cross. **Guardrails are what make those statements true at runtime.** This is the
detail behind Playbook Phase 6, step 5 ("wire the guardrails") — and it's the single most
important piece of deployment, because it's the difference between a rule that's *described*
and a rule that's *guaranteed*.

> **The principle, stated once:** a stated rule is guidance; an enforced rule is a guarantee.
> A hard limit is only as strong as its enforcement. Bright lines are "absolute" only if
> something other than the model's good intentions makes them so.

This document is engine-agnostic in its principles and uses **Hermes Agent** as the worked
example. Engine-specific mechanics live in `_meta/EngineAdapters.md`.

---

## Why stated rules aren't enough

The launch prompt (`AGENTS.md`) makes the engine *intend* to obey — it bakes in the tiers,
the hard limits, and the escalation rules, and a good model will follow them most of the time.
But "most of the time" is not the bar for moving money or sharing customer data. An LLM-driven
agent can be wrong, get confused by an edge case, be talked out of a rule by a clever message,
or simply hallucinate a tool call. Instruction text is a strong prior, **not a wall**.

So you design against two failure modes:

1. **The system acts when it shouldn't** — it crosses a hard limit (issues a refund, emails a
   third party, deletes a record) it was told never to cross.
2. **The system acts without the required sign-off** — it performs an `approve`-tier action
   without the named human actually approving.

Guardrails are the mechanisms that catch both, regardless of what the model "decided".

## What you are enforcing

- **Autonomy tiers** — chiefly `approve` (a named human must sign off before the action runs)
  and `recommend` (the system must propose and wait for a yes). `auto` actions still need their
  *conditions* and *limits* honoured.
- **Hard limits** — the short list of absolute prohibitions.
- **Audit** — explainability and reviewability. This is the enforcement of the "every action
  records which objective it served and why" promise; it's how you *catch* a guardrail that has
  silently stopped working.

## The four mechanisms (defence in depth)

Prefer the strongest mechanism available for each rule, and layer them. They run roughly
strongest → weakest:

1. **Withhold the capability (strongest).** Don't give the agent the tool or credential at all.
   The strongest limit is a capability the agent simply does not have: an agent with no payments
   API key cannot move money, no matter what it reasons. Make this your default — grant
   capabilities deliberately, not by reflex.
2. **Gate the action behind approval.** Route the action through a real human confirmation step
   *before the tool actually executes* — the agent proposes, a named person confirms in a
   channel, and only then does the call go through. This is how every `approve`-tier action
   should run.
3. **Hook / interceptor.** A programmatic check that runs immediately before a tool call and can
   block it, or force it to escalate, based on rules — an amount threshold, a recipient
   allow-list, message content. This is how you enforce *conditional* limits ("refunds over $50
   need approval", "never email outside our domain").
4. **Audit log (detective, not preventive).** Record every action, its reasoning, and the
   objective it served. This doesn't *stop* a bad action, but it makes one visible and reversible
   — and it's what lets you trust (and later promote) an action at all.

Instruction text in the launch prompt is the layer-zero behind all of these: necessary, never
sufficient on its own.

## Map each rule to a mechanism

Some limits are best enforced by the *absence of a capability*, some by *interception*, and a
few behavioural ones can only be backed by prompt + audit. Work down your Governance layer and
assign each one:

| Rule (Governance) | Primary enforcement |
| --- | --- |
| Never move money / change payouts without approval | **Withhold** the payments credential; **gate** any payout tool behind approval |
| Never share personal/customer data with third parties | **Withhold/scope** data-export tools; **hook** to block external recipients |
| Never permanently/irreversibly delete records | **Withhold** destructive scope (read/write only); soft-delete only |
| Never make public/media statements as the business | **Withhold** posting credentials for public channels; **gate** if granted |
| Always disclose you are an AI when asked | Behaviour — can't be withheld; **prompt + audit spot-check**, optional outbound-message **hook** |
| An `approve`-tier action (e.g. `issue_refund_or_comp`) | **Gate** behind the named approver + **hook** to enforce its `limits` (e.g. max $50) |

Notice the pattern: most hard limits collapse to "don't give it that capability" plus a hook for
the conditional cases. The behavioural rules (like disclosure) are the ones you genuinely can
only nudge in text and verify in audit.

## Prefer prevention; withhold by default

Start the pilot agent with the **minimum** tools and **read-only** data against the system of
record. Grant write or destructive capability only when a specific action needs it, and gate it
when you do. "It can't do the wrong thing because it has no way to" beats "it knows not to" every
time. This also keeps your blast radius small while you build trust.

## Test your guardrails — don't assume

A guardrail you haven't tried to break is a guardrail you don't have. Before the pilot goes live:

- **Red-team each hard limit.** Explicitly instruct the agent to do the forbidden thing and
  confirm it's *blocked* — not merely that it politely declines. A decline is the prompt working;
  a block is the guardrail working.
- **Round-trip the approval path.** Trigger an `approve`-tier action and confirm it actually
  pauses and reaches the named approver's channel, and that it does nothing until they confirm.
- **Check the conditional hooks.** Push an amount or recipient just over a threshold and confirm
  the hook stops or escalates it.
- **Confirm audit captures reasoning.** Do an action and verify the log records the objective
  served and a plain-language reason.

## How the automatic logging works

Audit is the guardrail you'll interact with constantly, so it's worth understanding exactly how it
operates. It comes in two parts: what the model *declares*, and what the engine *does*.

**The model declares the policy.** A single node in Governance — `mentor_node: audit` — sets it:

```yaml
mentor_node: audit
log_all_actions: true
require_reasoning: true
retain_days: 365
human_reviewable: true
```

That's a policy, not a running logger. It says every action must be recorded, every action must
carry its reasoning (which objective it served and *why*), keep the record ~365 days, and keep it
in a form a person can actually read.

**The engine does the logging at runtime, in two moves.** Nothing logs until the model is bound to
an engine; then:

1. **It generates the reasoning as it acts.** The launch prompt instructs the engine, for every
   action, to record which objective it served and its reasoning in plain language — *"if you
   can't explain it simply, don't do it."* The log entry is produced *as part of* deciding, not
   bolted on afterwards. An entry reads like a decision-feed line: *"proposed a $120 refund for a
   hot-water outage → served `guest_experience` → awaiting owner approval."*
2. **It persists the record** using its own memory — a binding/adapter concern (`knowledge_store`).
   On Hermes Agent that's the SQLite session store (with full-text search) plus memory, surfaced as
   the decision feed.

**It's detective, not preventive.** Logging doesn't *stop* a bad action — it makes one visible and
reversible. That's exactly why it pairs with the preventive mechanisms above rather than replacing
them, and why "I can't see *why* it did that" is a guardrail gap, not a quirk.

**Guidance vs guarantee, again.** A prompt instruction to log makes logging very likely; for
logging you can *rely* on, back it with the engine's native action logging so it can't be skipped,
and confirm it's on at deploy (Playbook Phase 6 step 5 ends with exactly this check).

**The spec hardens one half of it.** The validator refuses to pass a model unless `log_all_actions`
and `require_reasoning` are both `true` — you can't accidentally ship with audit off. That
guarantees the *policy* is on; the engine guarantees the *behaviour*.

**Why it earns its keep.** That log is the evidence base for everything downstream: it's how you
justify promoting an action `recommend → auto` ("right every time, here's the trail"), it's the raw
material the Learning layer mines for patterns, and it's the early warning that a guardrail has
quietly stopped working.

---

## Worked example: Hermes Agent

Hermes Agent provides command approval, user authorization/pairing, hooks, and tool/credential
gating. **Important caveat:** its *native* approval targets dangerous shell commands, **not
business rules** — so do not rely on it to stop "issue a refund". Enforce business hard limits
through hooks and tool-gating, not instruction text alone.

How the four mechanisms map onto Hermes:

- **Withhold the capability** — simply don't wire the tool, or don't put the credential in
  `~/.hermes/config.yaml`. Engine-independent and the strongest option.
- **Gate behind approval** — wrap the action's tool so it posts a confirmation request to the
  messaging gateway (Telegram is quickest) addressed to the approver, and blocks until they
  reply. The agent proposes; the human taps confirm; only then does the tool run.
- **Hook / interceptor** — use a pre-tool hook that inspects the call's arguments (amount,
  recipient, content) and rejects or escalates when they breach a limit.
- **Audit** — keep action logging on; pair it with the session store / `MEMORY.md` so decisions
  and their reasoning are reviewable.

**Concrete: the café's `issue_refund_or_comp`** (`tier: approve`, `limits.max_cost: $50`,
`approver: owner`):

1. **Withhold** any auto-refund/payment capability from the agent entirely.
2. The only refund tool is **wrapped to post a Telegram approval request to `owner`** and wait —
   nothing happens until the owner confirms.
3. A **pre-tool hook rejects any amount over $50** outright (the Governance `limits`), so even an
   approved refund can't exceed the cap.
4. **Audit** logs the proposal, the objective it served (`customer_experience`), and the owner's
   decision.

On a Windows/WSL pilot, `_meta/EngineAdapters.md` step 6 ("wire the guardrails") shows where this
sits in the full deployment sequence, and the kill switch (pull the credential → the agent
instantly can't perform that action) is your always-safe fallback.

---

## Guardrail checklist (before go-live)

- [ ] Every `approve`-tier action routed through real human approval in a channel
- [ ] Every hard limit backed by a **withheld capability or a hook** — never instruction text alone
- [ ] Pilot agent has the **minimum** tools and **read-only** data only
- [ ] Conditional limits (amounts, recipients) enforced by hooks, not prompt wording
- [ ] Audit on: `log_all_actions`, `require_reasoning`, `human_reviewable`
- [ ] **Red-teamed** each hard limit and confirmed it's blocked, not just declined
- [ ] Approval path round-trips to the named approver's channel and waits
- [ ] Kill switch known: pulling a tool/credential instantly disables that action
