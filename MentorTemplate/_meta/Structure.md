---
mentor: structure
schema_version: 0.3
engine_adapter: null
layers:
  - id: strategic
    index: 1
    role: Express intent as weighted objectives + a trade-off policy
    kind: definition
    status: defined
    inputs_from: []
    outputs_to:
      - { layer: governance, contract: objective ids that action policies may serve }
      - { layer: core, contract: objective weights + trade-off policy for decision scoring }
    spec: 1_StrategicLayer/StrategicLayer.md
    owns: [mission, weighting, objectives]
    references: []
    binding:
      - { target: durable_context, mode: at_startup }
  - id: governance
    index: 2
    role: "Authority: tiers, action policies, hard limits, escalation"
    kind: definition
    status: defined
    inputs_from: [strategic]
    outputs_to:
      - { layer: core, contract: permitted actions + tiers that bound routing }
      - { layer: domain, contract: the action policies each agent may perform }
    spec: 2_GovernanceLayer/GovernanceLayer.md
    owns: [autonomy_tiers, actions, hard_limits, approvers, escalation]
    references: [objectives]
    binding:
      - { target: durable_context, mode: at_startup }
      - { target: enforcement, mode: event }
  - id: learning
    index: 3
    role: Detect patterns, predict, simulate, propose improvements
    kind: definition
    status: defined
    inputs_from: [strategic, governance]
    outputs_to:
      - { layer: core, contract: recommendations, predicted impacts, autonomy-promotion evidence }
    spec: 3_LearningLayer/LearningLayer.md
    owns: [patterns, predictions, simulations]
    references: [objectives, actions, object_types]
    binding:
      - { target: knowledge_store, mode: on_demand }
      - { target: procedure, mode: on_demand }
      - { target: schedule, mode: scheduled }
  - id: core
    index: 4
    role: "Orchestrate: score against intent, route within authority"
    kind: engine
    status: defined
    inputs_from: [strategic, governance, learning]
    outputs_to:
      - { layer: domain, contract: tasked, tier-bounded work assignments }
    spec: 4_CoreLayer/CoreLayer.md
    owns: [routing]
    references: [objectives, actions, agents]
    binding:
      - { target: engine, mode: at_startup }
  - id: domain
    index: 5
    role: Specialised agents that do the work
    kind: operating
    status: defined
    inputs_from: [governance, core]
    outputs_to:
      - { layer: objects, contract: reads/writes to operational object state }
    spec: 5_DomainAgents/DomainAgents.md
    owns: [domains, agents]
    references: [actions, object_types]
    binding:
      - { target: agent, mode: on_demand }
      - { target: procedure, mode: on_demand }
  - id: objects
    index: 6
    role: Real-world entities as living nodes with history
    kind: data
    status: defined
    inputs_from: [domain]
    outputs_to:
      - { layer: human, contract: surfaced state, pressure, and history for review }
    spec: 6_OperationalObjects/OperationalObjects.md
    owns: [object_types]
    references: []
    binding:
      - { target: knowledge_store, mode: on_demand }
      - { target: fact_memory, mode: at_startup }
  - id: human
    index: 7
    role: Approvers, supervisors, escalation handlers
    kind: interface
    status: defined
    inputs_from: [governance, objects]
    outputs_to: []
    spec: 7_HumanCollaboration/HumanCollaboration.md
    owns: [operators]
    references: [approvers]
    binding:
      - { target: channel, mode: on_demand }
      - { target: enforcement, mode: event }
      - { target: schedule, mode: scheduled }
---

# Structure

How the layer folders wire together. The frontmatter above is the canonical source of truth; the
table below is its human view. Each `spec` points to the layer's node file. Intent/authority flow
**down** (lower index → higher); state/outcomes flow **up**.

| # | layer | folder | status | consumes | hands down | binding |
| - | ----- | ------ | ------ | -------- | ---------- | ------- |
| 1 | strategic | `1_StrategicLayer/` | defined | — | governance, core | durable_context |
| 2 | governance | `2_GovernanceLayer/` | defined | strategic | core, domain | durable_context, enforcement |
| 3 | learning | `3_LearningLayer/` | defined | strategic, governance | core | knowledge_store, procedure, schedule |
| 4 | core | `4_CoreLayer/` | defined | strategic, governance, learning | domain | engine |
| 5 | domain | `5_DomainAgents/` | defined | governance, core | objects | agent, procedure |
| 6 | objects | `6_OperationalObjects/` | defined | domain | human | knowledge_store, fact_memory |
| 7 | human | `7_HumanCollaboration/` | defined | governance, objects | — | channel, enforcement, schedule |

Set `engine_adapter` (e.g. `hermes_agent`) to bind this structure to an engine; see
`EngineAdapters.md`.
