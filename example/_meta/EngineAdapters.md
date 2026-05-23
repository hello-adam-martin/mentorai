# Engine Adapters

Mentor's core is engine-agnostic. A layer's `binding` names abstract capabilities; an **adapter**
maps each to a real feature of a specific engine. To support a new engine, add a section here —
the layer folders and node files never change.

## Abstract capability vocabulary

| target | What the engine must provide |
| --- | --- |
| `durable_context` | persistent instructions present in reasoning every session |
| `identity` | the agent's standing voice / disposition |
| `fact_memory` | small, always-on facts in working context |
| `knowledge_store` | larger queryable memory of entities, history, relationships |
| `procedure` | a reusable, loadable unit of know-how |
| `agent` | an addressable worker that can be delegated to and coordinated |
| `schedule` | time- or event-triggered autonomous runs |
| `enforcement` | ability to gate, require approval for, or block an action |
| `channel` | a path to reach and be reached by humans |
| `engine` | the reasoning loop that consumes the above and decides |

`mode` ∈ `at_startup, on_demand, scheduled, event`. Because Mentor is Markdown, most binding is
**placement** — which loader a node's `.md` is fed into — not a format conversion.

## Adapter: Hermes Agent

[Nous Research Hermes Agent](https://hermes-agent.nousresearch.com/) — one supported engine.

| target | Hermes Agent feature |
| --- | --- |
| durable_context | `.hermes.md` / `AGENTS.md` (system prompt at startup; ~20k-char cap) |
| identity | `SOUL.md` (global) |
| fact_memory | `MEMORY.md` + `USER.md` (~2,200 / ~1,375 chars) |
| knowledge_store | external memory provider (Honcho/Mem0/…) + SQLite session store |
| procedure | `SKILL.md` skills in `~/.hermes/skills/` (slash commands) |
| agent | `delegate_task` subagents / profiles (`hermes -p`); Kanban board |
| schedule | cron jobs (`jobs.json`, natural-language schedules) |
| enforcement | command approval + authorization + hooks + tool/credential gating |
| channel | messaging gateway (20+ platforms) |
| engine | AIAgent loop + prompt builder (= Core) |

**Caveats** (absorbed by the adapter, not the spec): enforcement is only partly native — approval
targets dangerous shell commands, so back hard limits with a hook or by withholding a
tool/credential; always-on budgets are small — keep Strategic/Governance node files concise and
push detail to procedures or the knowledge store.

## Runnable adapter kit

A copyable realisation of this adapter lives at **`adapters/hermes/`**: a Hermes `config.yaml`, a
`.env` template, a `mentor-guardrails` plugin (a `pre_tool_call` hook that **blocks** hard-limit
violations and **gates** approve-tier actions, plus a `post_tool_call` **audit** log), a
`check_coverage.py`, and a `RUNBOOK.md`. It's business-neutral and **reads the rules live from the
model's Governance layer** at runtime (`2_GovernanceLayer/HardLimits` + `Actions`) — there's no
per-business rules file to drift; edit the Markdown and enforcement follows. The only adapter-side
data is `detectors.json`: a business-neutral library of how to *recognise* a category of tool call
in Hermes (the engine-specific bit that can't live in an engine-neutral model), attached to a
Governance rule by keywords in the rule's text. Copy the kit next to your compiled model and run
`check_coverage.py` to see what's enforceable. `example/deploy/hermes/` is the kit copied for
Riverside Café — and it carries no rules file, because it reads the café's own Governance. See
`_meta/Guardrails.md` for the enforcement model behind it.

## Deploying: Hermes Agent on WSL (a complete worked play)

This is the concrete, follow-along recipe for running a Mentor pilot on a Windows machine via
**WSL2** (Windows Subsystem for Linux). It's the most engine- and host-specific guidance there is, so
it lives here in the adapter, not in the (engine-agnostic) Playbook. It assumes you've already
generated and validated a business folder and compiled a bundle (Playbook phases 1–5).

**Why WSL.** WSL2 runs a real Linux kernel, so Hermes installs and behaves exactly as it would on a
server — free, local, full visibility into the decision feed. It's an excellent place for a *pilot at
`recommend`*. The one thing it does **not** give you for free is *always-on*: WSL pauses on sleep and
stops on shutdown. So pilot here, and graduate to a small always-on VPS when you promote actions to
`auto` (same bundle, different host — see the note at the end).

**Before you start:** a validated model + fresh compiled bundle; Windows 10 (22H2+) or 11; a
model-provider API key; a Telegram account (quickest channel); and read access to the one system your
pilot agent will touch. Do everything for **one agent's scope only**.

### 0 · Install WSL2 (one-time, in Windows)

In an **admin PowerShell**:

```powershell
wsl --install              # installs WSL2 + Ubuntu by default; reboot when asked
wsl --set-default-version 2
wsl -l -v                  # confirm your distro shows VERSION 2
```

Open the **Ubuntu** app once to create your Linux username/password.

### 1 · Prep the distro

```bash
sudo apt update && sudo apt upgrade -y
```

Enable **systemd** so services and cron survive (needed for always-on and Learning jobs). Edit
`/etc/wsl.conf`:

```ini
[boot]
systemd=true
```

Then from **PowerShell**: `wsl --shutdown`, reopen Ubuntu, and check `systemctl is-system-running`.

### 2 · Stand up the engine

Install Hermes Agent and run setup (commands track the engine's own docs):

```bash
curl -fsSL https://raw.githubusercontent.com/NousResearch/hermes-agent/main/scripts/install.sh | bash
hermes setup        # choose provider + model, paste your API key
```

Confirm it replies to a plain chat before going further. *(Maps to Core — the engine's own reasoning
loop, configured not authored.)*

### 3 · Load the Mentor model

Keep the business folder **inside the WSL filesystem** (ext4), not under `/mnt/c/...` — the cross-OS
bridge is slow and breaks file-watching/permissions:

```bash
mkdir -p ~/mentor && cd ~/mentor
# unzip your compiled bundle + business folder here, e.g. ~/mentor/<business>/
cp <business>/AGENTS.md ~/mentor/AGENTS.md          # durable_context (Strategic + Governance)
cp -r <business>/_compiled/skills/* ~/.hermes/skills/  # one SKILL.md per domain agent (procedure)
# seed a few always-on facts into MEMORY.md (fact_memory)
```

You edit these from Windows any time via `\\wsl$\Ubuntu\home\<you>\mentor` or VS Code's Remote-WSL.

**Test:** start Hermes in that directory and ask *"what are you optimising for?"* — it should answer
as Mentor, with your objectives and weights.

### 4 · Connect one channel (Telegram)

Telegram is ideal on WSL because the bot **polls outbound** — it works from behind WSL's NAT with no
port forwarding or tunnel. Create a bot with **@BotFather**, copy the token, and add it to the Hermes
messaging gateway config. Send yourself a test message and reply — confirm the round-trip. *(channel
→ approvals and escalations now reach your phone.)*

> Only if you ever need *inbound* webhooks would you add a tunnel (`cloudflared`/`ngrok`). Telegram
> avoids that entirely.

### 5 · Give it hands (minimum tools + read-only data)

Wire only what the **one pilot agent** needs: the tools for its allowed actions, and the in-scope
object data **read-only against the system of record first**. Don't connect everything. Running
locally makes this easy — the agent can reach a local DB/file export while you watch.

### 6 · Wire the guardrails

- Route every `approve`-tier action through real approval (Telegram confirmation).
- Back each **hard limit** with a hook **or by withholding the tool/credential entirely** — the
  strongest limit is a capability the agent simply doesn't have. (Hermes approval natively targets
  dangerous shell commands; everything else is hook-or-withhold.)
- Confirm **audit** logging is on.
- Full detail, a per-limit enforcement map, a red-team testing protocol, and a pre-go-live
  checklist: **`_meta/Guardrails.md`**.

### 7 · Keep it running (the WSL-specific part)

For a pilot you can just leave the terminal open. To make it survive logoffs/reboots:

- Run the Hermes gateway as a **systemd service** (a unit in `/etc/systemd/system/`, `enable`d) so it
  starts with the distro and a live process keeps the WSL VM up.
- In **Windows power settings**, set the machine to never sleep while plugged in (a sleeping laptop =
  a paused agent).
- Add a **Task Scheduler** task "At log on / At startup" running
  `wsl -d Ubuntu` so the distro (and your systemd service) comes back after a reboot.

Learning reviews and briefings then run via the engine's **cron** (`schedule`), which works because
systemd keeps the distro alive.

### 8 · Pilot

One objective, one agent, one channel, a slice of real data, **everything at `recommend`** — it
proposes, you confirm by hand in Telegram. Agree success criteria and a review window up front, and
watch the decision feed. This is exactly Playbook phase 6 — WSL is just the host.

### Kill switch on WSL (even simpler)

- **Pause:** stop the systemd service, or `wsl --shutdown` from PowerShell — halts everything instantly.
- **Pull a capability:** remove a tool/credential — the agent immediately can't do that thing.
- **Roll back:** revert the Markdown → re-compile → reload.

### When to leave WSL

When a pilot has earned `auto` on an action and you want true 24/7 autonomy, move the **same bundle**
to a small always-on VPS: repeat steps 2–6 there (no systemd-on-WSL fuss, no sleep risk), keep the
folder as the single source of truth, and continue the *edit Markdown → validate → re-compile →
reload* loop. Nothing about the model changes — only the host.

## Adding a new engine

```markdown
## Adapter: <Engine Name>
| target | <Engine> feature |
| durable_context | ? |
| ... | ... |
Caveats: ...
```

An instance binds cleanly when the adapter maps every binding `target` any layer uses.
