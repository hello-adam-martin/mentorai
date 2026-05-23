# Deploy a Mentor business on Hermes Agent — runbook

Takes a compiled Mentor model from "validated folder" to a **running pilot on Hermes Agent**
with the guardrails actually enforced. It's the concrete version of Playbook Phase 6 and the
worked example behind `_meta/Guardrails.md`.

This adapter is **business-neutral** and reads your rules **live from the model's Governance
layer** — you just copy it next to your model; there's nothing to tune for the rules.
(`example/deploy/hermes/` is this adapter copied for Riverside Café — with no rules file,
because it reads the café's own Governance.)

| Mechanism (from Guardrails.md) | Where it lives here |
| --- | --- |
| **Withhold the capability** (strongest) | `config.yaml` → `agent.disabled_toolsets`, and not wiring a tool/credential |
| **Gate behind approval** | native `approvals.mode: manual` (shell commands) + the plugin's `pre_tool_call` (business actions) |
| **Hook / interceptor** | the plugin's `pre_tool_call` (`{"action":"block",...}`) |
| **Audit** | the plugin's `post_tool_call` → `~/.hermes/logs/mentor-audit.jsonl`, plus Hermes' session store |

> Start cautious. One agent, one channel (Telegram), everything proposed, nothing irreversible.
> Widen only on evidence.

---

## 0 · Copy this adapter next to your model

```bash
cp -r adapters/hermes  <your-business-folder>/deploy/hermes
```

There's nothing to tune for the rules — the plugin reads your `2_GovernanceLayer/HardLimits` +
`Actions` live. Sanity-check what's enforceable on Hermes:

```bash
python3 deploy/hermes/check_coverage.py  <your-business-folder>
```

It lists which hard limits / approve-tier actions a detector can spot, and which can't
(behavioural rules like "disclose you're an AI" are expected to be uncovered). If a rule you
care about shows as uncovered, add a keyword/pattern to `plugins/mentor-guardrails/detectors.json`
(that's the only file you ever edit here — and it's about Hermes detection, not business rules).

## 1 · Install Hermes Agent

```bash
curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash
hermes setup            # choose provider + model, paste your API key
hermes config set model anthropic/claude-opus-4   # or your chosen provider/model
```

Confirm it replies to a plain chat before going further.

## 2 · Apply the config

```bash
cp deploy/hermes/config.yaml   ~/.hermes/config.yaml
cp deploy/hermes/.env.example  ~/.hermes/.env        # then edit ~/.hermes/.env
```

`config.yaml` sets `approvals.mode: manual`, requires DM pairing, and lists `disabled_toolsets`
— edit that to withhold anything this agent shouldn't have.

## 3 · Load the model

The launch prompt is auto-detected from the working directory — Hermes loads the first of
`.hermes.md` → `AGENTS.md` → `CLAUDE.md`. Your compiled folder has `AGENTS.md`, so start Hermes
**inside the business folder**:

```bash
cd <your-business-folder>            # the one with AGENTS.md + the 1_…7_ layers
cp -r skills/* ~/.hermes/skills/     # the compiled per-agent skills
```

**Test:** ask *"what are you optimising for?"* — it should answer as Mentor with your objectives.

## 4 · Connect Telegram

Create a bot with **@BotFather**, put the token in `TELEGRAM_BOT_TOKEN` in `~/.hermes/.env`, and
your numeric Telegram id (from **@userinfobot**) in `TELEGRAM_ALLOWED_USERS` — your approver
allow-list. Confirm a round-trip. (Exact gateway keys: Hermes docs → *Messaging → Telegram*.)

## 5 · Install + enable the guardrails plugin

```bash
cp -r deploy/hermes/plugins/mentor-guardrails ~/.hermes/plugins/
hermes plugins enable mentor-guardrails
hermes plugins list                      # confirm it's enabled
```

The plugin finds your model's Governance by walking up from the working directory you start
Hermes in (step 3). If you run it from elsewhere (cron, subagents), set `MENTOR_MODEL_DIR` in
`~/.hermes/.env`. The business-neutral `detectors.json` travels inside the plugin.

## 6 · Give it hands (minimum, read-only first)

Wire only the tools the pilot agent needs, read-only against the system of record first. Anything
that moves money, exports customer data, or posts publicly should be **withheld** (don't wire it)
or only reachable through approval — the plugin backs this up if a tool slips through.

## 7 · Red-team the guardrails

A guardrail you haven't tried to break is one you don't have. Ask the agent to do each forbidden
thing and confirm the guardrail fires (refund → *gated*; `rm -rf` / `DROP TABLE` → *blocked*;
email a customer list out → *gated*; a normal read → *allowed*). Watch the trail:

```bash
tail -f ~/.hermes/logs/mentor-audit.jsonl
```

You should see `allowed` / `gated` / `blocked` / `executed` events with the rule id and tool.

## 8 · Pilot

One objective, one agent, one channel, a slice of real data, **everything at `recommend`** — it
proposes, you confirm by hand. Agree success criteria + a review window, and watch the feed and
the audit log. Promote `recommend → auto` only on the evidence in that log.

## Kill switch (always safe)

- **Pause:** stop the gateway, or `hermes plugins disable mentor-guardrails` to drop just the guardrails.
- **Pull a capability:** remove a tool/credential or add its toolset to `disabled_toolsets`.
- **Roll back:** revert the Markdown model → re-compile → reload.
