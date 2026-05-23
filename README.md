# Mentor

The operational brain for your business — a layered, engine-agnostic "autonomous operations"
model expressed entirely in Markdown. You describe a business as **seven layers** (Strategy →
Governance → Learning → Core → Domain agents → Operational objects → Human collaboration); an AI
engine then runs *inside* those rules.

Open **`index.html`** to start.

## Layout

| Path | What's in it |
| --- | --- |
| `index.html` | The landing page — start here. |
| `app/` | The browser tools: `Studio.html` (build · map · validate · compile · import), `MissionControl.html` (live map + validation), `Dashboard.html` (model health), `OperationalDashboard.html` (live-ops mockup), `Docs.html` (the Docs & Learn hub), `Help.html` (quick start). All run locally, nothing uploaded. |
| `cli/` | The `mentor` command-line pipeline: `mentor.js` + the shared engine `mentor-core.js` (+ `package.json`). `new` · `validate` · `compile` · `ship` · `pack` · `map`. Needs Node + `npm install js-yaml`. |
| `_meta/` | The canonical reference docs: `SpecFormat.md`, `Defaults.md`, `Playbook.md`, `EngineAdapters.md`, `LaunchPrompt.md`, `Guardrails.md`. |
| `docs/` | The narrative docs: `overview.md` (the vision) and `architecture.md` (how it works). |
| `template/` | The empty, copyable operating-model skeleton (seven layer folders + `_meta/`). |
| `adapters/hermes/` | The runnable Hermes Agent adapter — config, a guardrails plugin that reads your Governance live, and a runbook. Engine-specific, business-neutral. |
| `example/` | One complete worked model — Riverside Café — with all seven layers, a compiled bundle (`AGENTS.md` + `skills/`), and a tuned Hermes deploy kit (`deploy/hermes/`). |

## Where to begin

- **Just looking?** Open `index.html`, then `app/Docs.html`.
- **Building a model?** Open `app/Studio.html`, or run `cli/mentor.js new <name>`.
- **Deploying?** See `_meta/Playbook.md` (the full journey), `_meta/Guardrails.md` (enforcement),
  and `adapters/hermes/` (the runnable kit). `example/` shows it all in place.
