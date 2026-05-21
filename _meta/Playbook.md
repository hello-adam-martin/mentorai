# Mentor — Playbook

The complete path, from never having heard of Mentor to a running operation. Work through the phases
in order; each builds on the last. Detailed references are linked where you need them.

> **The golden rule, repeated everywhere:** start tiny and earn trust. Define a small model, deploy
> one agent at `recommend`, watch it, and widen only on evidence. Everything here is reversible
> because the model is just Markdown.

The journey: **understand → set up → define → validate → compile → deploy → run.**

---

## Phase 1 — Understand what you're building

Mentor is an operational layer that sits across a business — less like software you operate, more
like an operations lead that works inside your rules. It coordinates the routine, escalates what
matters, learns over time, and keeps people in control.

It's organised as **seven layers**:

1. **Strategy** — what the business is trying to achieve, and what matters most.
2. **Governance** — what the system may do alone, what needs sign-off, and the lines it never crosses.
3. **Learning** — how it improves: patterns, predictions, simulations.
4. **Core** — the engine that reasons and decides (configured, not authored).
5. **Domain agents** — the specialists that do the work.
6. **Operational objects** — your real things (customers, jobs…) as living records.
7. **Human collaboration** — the people who approve, oversee, and step in.

Three ideas keep it safe and make it different: it's built around **intent** (not forms), autonomy is
**earned** (start cautious, loosen on evidence), and **humans stay in the loop**. It's engine-agnostic
and entirely Markdown, so there's no lock-in and no compiler magic.

*Go deeper:* open `index.html` (the overview), `mentor_overview.md` (the vision), and
`mentor_architecture.md` (how the layers and binding work).

## Phase 2 — Set up your workspace

You don't copy anything by hand — the **Setup Wizard generates a complete business folder for you**
(every layer, the reference docs, and Mission Control all inside it). For now, just meet the tools
(all run in the browser, nothing uploaded):

- **Setup Wizard** (`SetupWizard.html`) — asks the questions and produces your complete business folder.
- **Mission Control** — maps a business folder and validates it (validation is built in).
- **Model Dashboard** — an at-a-glance health check.
- **Compiler** (`Compiler.html`) — turns a finished folder into engine config (the launch prompt + bundle).
- **This Playbook** — the path that ties them together.

The one convention to remember: **a folder is a node, everything is Markdown, and the YAML
frontmatter is the source of truth** (`_meta/SpecFormat.md` has the field details).

## Phase 3 — Define your operating model (the heart of the work)

This is where you do the real thinking. The **Setup Wizard** asks the questions and pre-fills safe
defaults; this section gives you the judgment behind each layer. You don't have to do every layer at
once — Strategy + Governance + one agent is a complete first pass.

**3.1 Strategy.** Choose **3–5 objectives** that genuinely compete with each other (if they never
trade off, you don't need weights). Weight them so the total is 1.0 — the weights decide who wins a
close call. Give each a **measurable target** so you can later tell if it's working. Resist a long
list; a handful you actually mean beats fifteen you don't.

**3.2 Governance.** Start cautious. For each thing the system might do, decide the tier: **auto**
(reversible, low-risk, known), **recommend** (propose and wait), **approve** (money, irreversible,
sensitive). Name your **approvers**. Set the **hard limits** — keep the recommended starter set (no
moving money / sharing data / public statements / irreversible deletes without approval; always
disclose it's an AI) and add your own. Define **escalations** (a safety/legal emergency reaches a
human immediately; repeated failure stops and escalates). Leave **audit** on. (`_meta/Defaults.md`.)

**3.3 Operational objects.** Model only the few entities the business revolves around (Customer, Job,
Asset…). Give each a stable **key**, the **fields** that matter, and **relationships** to other types.
You're defining the *types*, not loading records — that comes at deployment.

**3.4 Domain agents.** Define the specialists, grouped into domains (Operations / Intelligence /
Communication). Each agent gets only the **actions** it needs (a subset of Governance) and the
**object types** it touches. **Start with one** — you can add more later.

**3.5 Human collaboration.** Map the real people/roles to the approvers you named, with the channels
they're reached on. This is what closes the loop between "needs approval" and an actual person.

**3.6 Learning.** Optional at first. As you notice recurring problems, add **patterns** (what to watch
for), **predictions** (risks to get ahead of), and **simulations** (what-ifs to test before changing
how an action is used).

When you finish, the wizard hands you a **complete business folder** as a ZIP — unzip it and that's
your business, with the docs and Mission Control already inside. No template to copy.

## Phase 4 — Map & validate

- Open **Mission Control**, pick your business folder, and read the **validation panel**: weights must
  sum to 1, every cross-layer reference must resolve, governance pieces present. Fix anything red.
- Open the **Model Dashboard** for a sanity check — autonomy posture (are you appropriately cautious?),
  weight balance, coverage.

Do not move on until validation is green. A model with dangling references will misbehave when it runs.

## Phase 5 — Compile

Open the **Compiler**, pick your folder, and it assembles:
- the **launch prompt** (`.hermes.md`) with your mission, objectives, approvers, hard limits, and
  escalations baked in;
- a **skill** per domain agent;
- a **`SETUP.md`** checklist of what to wire up.

Download the engine bundle (ZIP). This is what makes an engine *behave* as Mentor.

## Phase 6 — Deploy (go live)

This is where the agents stop being descriptions and start existing. It's software/integration work —
do it for **one agent's scope only**. Worked example: **Hermes Agent** (for another engine, use
`_meta/EngineAdapters.md`; for exact commands, the engine's docs). Running it locally on a Windows
machine? `_meta/EngineAdapters.md` has a complete step-by-step **"Hermes Agent on WSL" play**.

**Prerequisites:** a validated model + fresh bundle; somewhere to run it (a small VPS or serverless);
an engine + model-provider API key; credentials for one channel (Telegram is quickest) and read access
to the one system your pilot agent will touch.

1. **Stand up the engine.** Install it (Hermes Agent: `curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash`, then `hermes setup`), configure provider/model/key, and confirm it replies to a chat.
2. **Load the model.** Put the launch prompt in as the context file (`.hermes.md` / `AGENTS.md`) with
   the operating-model folder beside it; drop the agent skills into the engine's skills directory; seed
   a few always-on facts into memory. **Test:** ask *"what are you optimising for?"* — it should answer
   as Mentor with your objectives.
3. **Connect one channel** so approvals/escalations reach you and you can talk to it. Verify a round-trip.
4. **Give it hands** — connect the minimum **tools** the pilot agent needs, and the in-scope **object
   data** (read-only against the system of record first). Don't wire everything.
5. **Wire the guardrails** — route `approve`-tier actions through real approval; back each **hard
   limit** with a hook *or by withholding the tool/credential entirely* (the strongest limit is a
   capability the agent doesn't have); confirm audit logging.
6. **Pilot.** One objective, one agent, one channel, a slice of real data, **everything at
   `recommend`** — it proposes, you confirm by hand. Watch the decision feed. Agree success criteria
   and a review window up front.

## Phase 7 — Run, promote, maintain

- **Observe** the decision log against your objectives — is it advancing them and explaining itself?
- **Promote** on evidence: when an action has been consistently right, move it `recommend → auto` —
  edit the Governance Markdown, re-validate in Mission Control, re-compile, reload the engine. (This is
  the autonomy migration Governance + Learning were built for.)
- **Widen one step at a time** — the next agent, objective, or data source. Never two at once.
- **Maintain:** schedule Learning reviews and briefings (engine cron); whenever you change anything,
  always go *edit Markdown → validate → re-compile → reload*. The folder stays the single source of truth.

## Kill switch (always safe)

Pausing breaks nothing — the model is just files.
- **Pause:** stop the engine's gateway / disable the agent.
- **Pull a capability:** remove the tool or credential — the agent instantly can't do that thing.
- **Roll back:** revert the Markdown, re-compile, reload.

Make sure whoever operates this knows these three moves before go-live.

---

## Layer → engine mapping (recap)

| Mentor layer | In the engine |
| --- | --- |
| Strategic + Governance | the `.hermes.md` launch prompt (loaded every session) |
| Domain agents | skills / subagents / profiles, scoped to allowed actions |
| Operational objects | a knowledge store + connections to your live records |
| Human collaboration | the messaging gateway (your channel) + approvals |
| Learning | scheduled cron jobs + the engine's memory/skill improvement |
| Core | the engine's own reasoning loop — configured, not built |
| Hard limits / approvals | approval gating, hooks, and withheld tools/credentials |

---

## Master checklist (the whole journey)

**Understand & set up**
- [ ] Read the overview; understand the seven layers and the start-cautious principle
- [ ] Generated your complete business folder with the Setup Wizard

**Define**
- [ ] Strategy: 3–5 weighted objectives (sum 1.0), each with a measurable target
- [ ] Governance: tiers chosen, approvers named, hard limits set, escalations defined, audit on
- [ ] One or more object types defined (key, fields, relationships)
- [ ] At least one domain agent (scoped to its actions + objects)
- [ ] Human collaboration mapped to approvers + channels
- [ ] (Optional) Learning patterns/predictions/simulations

**Validate & compile**
- [ ] Mission Control validation is green
- [ ] Dashboard sanity-checked
- [ ] Compiled a fresh engine bundle

**Deploy**
- [ ] Engine installed; provider + key set; responds to a chat
- [ ] Launch prompt loaded; "what are you optimising for?" answers correctly
- [ ] One channel connected and round-trips
- [ ] Pilot agent's tools + read-only data connected
- [ ] Approve-tier gated; hard limits enforced by hook or withheld capability; audit confirmed

**Pilot & run**
- [ ] Everything at `recommend`; success criteria + review window agreed
- [ ] Kill switch known and tested
- [ ] Pilot launched 🎉
- [ ] Reviewing the log; promoting to `auto` only on evidence; widening one step at a time
