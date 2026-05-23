---
mentor: structure
schema_version: 0.3
engine_adapter: hermes_agent
layers:
  - id: strategic
    index: 1
    role: Express intent as weighted objectives + a trade-off policy
    kind: definition
    status: defined
    inputs_from: []
    outputs_to:
      - layer: governance
        contract: objective ids that action policies may serve
      - layer: core
        contract: objective weights + trade-off policy
    spec: 1_StrategicLayer/StrategicLayer.md
    owns:
      - mission
      - weighting
      - objectives
    references: []
    binding:
      - target: durable_context
        mode: at_startup
  - id: governance
    index: 2
    role: 'Authority: tiers, action policies, hard limits, escalation'
    kind: definition
    status: defined
    inputs_from:
      - strategic
    outputs_to:
      - layer: core
        contract: permitted actions + tiers
      - layer: domain
        contract: the action policies each agent may perform
    spec: 2_GovernanceLayer/GovernanceLayer.md
    owns:
      - autonomy_tiers
      - actions
      - hard_limits
      - approvers
      - escalation
    references:
      - objectives
    binding:
      - target: durable_context
        mode: at_startup
      - target: enforcement
        mode: event
  - id: learning
    index: 3
    role: Detect patterns, predict, simulate, propose improvements
    kind: definition
    status: defined
    inputs_from:
      - strategic
      - governance
    outputs_to:
      - layer: core
        contract: recommendations, predicted impacts, autonomy-promotion evidence
    spec: 3_LearningLayer/LearningLayer.md
    owns:
      - patterns
      - predictions
      - simulations
    references:
      - objectives
      - actions
      - object_types
    binding:
      - target: knowledge_store
        mode: on_demand
      - target: procedure
        mode: on_demand
      - target: schedule
        mode: scheduled
  - id: core
    index: 4
    role: 'Orchestrate: score against intent, route within authority'
    kind: engine
    status: defined
    inputs_from:
      - strategic
      - governance
      - learning
    outputs_to:
      - layer: domain
        contract: tasked, tier-bounded work assignments
    spec: 4_CoreLayer/CoreLayer.md
    owns:
      - routing
    references:
      - objectives
      - actions
      - agents
    binding:
      - target: engine
        mode: at_startup
  - id: domain
    index: 5
    role: Specialised agents that do the work
    kind: operating
    status: defined
    inputs_from:
      - governance
      - core
    outputs_to:
      - layer: objects
        contract: reads/writes to operational object state
    spec: 5_DomainAgents/DomainAgents.md
    owns:
      - domains
      - agents
    references:
      - actions
      - object_types
    binding:
      - target: agent
        mode: on_demand
      - target: procedure
        mode: on_demand
  - id: objects
    index: 6
    role: Real-world entities as living nodes with history
    kind: data
    status: defined
    inputs_from:
      - domain
    outputs_to:
      - layer: human
        contract: surfaced state, pressure, history
    spec: 6_OperationalObjects/OperationalObjects.md
    owns:
      - object_types
    references: []
    binding:
      - target: knowledge_store
        mode: on_demand
      - target: fact_memory
        mode: at_startup
  - id: human
    index: 7
    role: Approvers, supervisors, escalation handlers
    kind: interface
    status: defined
    inputs_from:
      - governance
      - objects
    outputs_to: []
    spec: 7_HumanCollaboration/HumanCollaboration.md
    owns:
      - operators
    references:
      - approvers
    binding:
      - target: channel
        mode: on_demand
      - target: enforcement
        mode: event
      - target: schedule
        mode: scheduled
---

# Structure

The seven-layer descriptor set for this business (the frontmatter is the source of truth).

| # | layer | status |
| - | --- | --- |
| 1 | strategic | defined |
| 2 | governance | defined |
| 3 | learning | defined |
| 4 | core | defined |
| 5 | domain | defined |
| 6 | objects | defined |
| 7 | human | defined |
