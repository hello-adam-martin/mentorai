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

## Adding a new engine

```markdown
## Adapter: <Engine Name>
| target | <Engine> feature |
| durable_context | ? |
| ... | ... |
Caveats: ...
```

An instance binds cleanly when the adapter maps every binding `target` any layer uses.
