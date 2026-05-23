# Spec Format

How every node in this tree is written, and how it's validated.

## The folder convention

- **A folder is a node.** Its node file is named after the folder; the numbered top-level
  layers drop the number prefix on the file
  (`1_StrategicLayer/StrategicLayer.md`, `1_StrategicLayer/Objective1/Objective1.md`).
- **Each node file** = YAML frontmatter (canonical, machine-checkable) + a Markdown body
  (prose + light tables) that mirrors it. Frontmatter wins if they disagree.
- **Layer overviews** live in the layer folder's own node file. **Components** are sub-folders.
- Ids are `lowercase_snake_case`; folder names are `PascalCase`.

## Node frontmatter by type

A node declares its type with either `mentor_layer` (a layer overview), `mentor_node` (a
component), or `mentor: structure` (`_meta/Structure.md`).

**Layer overview** (`mentor_layer: <id>`): `index`, `status` (`defined|draft|planned`), plus
layer-specific fields — strategic carries `weighting` + `mission`; governance carries
`autonomy_tiers`.

**Objective** (`mentor_node: objective`): `id`, `label`, `weight` (0..1), `targets`
(`metric`/`operator`/`value`/`unit`), `guidance`. Weights across a layer's objective folders
sum to the layer's `weighting.weights_sum_to` (~1.0).

**Action** (`mentor_node: action`): `id`, `description`, `tier` (`auto|recommend|approve`),
`domains`, `serves` (objective ids), `conditions`, optional `limits`, `approver` (required when
tier is `approve`), optional `escalates_to` (another action id).

**Approver** (`mentor_node: approver`): `id`, `name`, `role`, `channels`, `can_approve`.

**Other governance nodes**: `hard_limits` (list), `escalation` (list), `notifications`,
`audit` (`log_all_actions` and `require_reasoning` must be true).

**Operator** (`mentor_node: operator`, Human layer): `id`, `name`, `role`, `fulfils_approvers`
(a list of Governance approver ids this person is — may be empty for non-approvers like escalation
handlers), `channels`, `handles` (responsibilities), optional `availability`. One sub-folder per
person/role under `7_HumanCollaboration/`.

**Object type** (`mentor_node: object_type`, Objects layer): `id`, `label`, `key` (the stable
identifier field), `fields` (list of `{name, type}`), `relationships` (list of `{type, to}` where
`to` is another object_type id in this layer), optional `states` (lifecycle), `history:
append_only`. One sub-folder per type under `6_OperationalObjects/`.

**Domain** (`mentor_node: domain`, Domain layer): `id`, `status`, optional `focus`. A grouping
that contains agent sub-folders.

**Agent** (`mentor_node: agent`, Domain layer): `id`, optional `name` (a friendly persona, e.g. "Ana", shown in the map and the compiled skill), `domain` (the domain id it sits in),
`purpose`, `allowed_actions` (a subset of Governance action ids), `objects` (object_type ids it
reads/writes). One sub-folder per agent, nested inside its domain folder.

**Pattern** (`mentor_node: pattern`, Learning layer): `id`, `detects`, `watches` (object_type ids
whose history reveals it), `suggests` (the improvement to propose).

**Prediction** (`mentor_node: prediction`, Learning layer): `id`, `predicts` (metric/outcome),
`horizon`, `informs` (objective ids it helps protect).

**Simulation** (`mentor_node: simulation`, Learning layer): `id`, `scenario`, `compares` (options),
`scores_against` (objective ids), `affects_actions` (action ids the scenario would change).

**Core** (`4_CoreLayer/`) has no authored content — it's the engine, set via an adapter
(`_meta/EngineAdapters.md`). All seven layers now have a defined format.

## Validation invariants

- **Strategic**: objective weights sum to `weights_sum_to` (±1e-6); each objective has an id, a
  numeric weight, and ≥1 target with a valid operator (`>=,<=,>,<,==`); ids unique.
- **Governance**: each action `tier` is a defined tier; approve-tier actions name a valid
  approver; `serves` resolves to an objective; `escalates_to` resolves to a known action;
  hard limits and approvers non-empty; `audit.log_all_actions` and `require_reasoning` true.
- **Human**: every id in an operator's `fulfils_approvers` resolves to an approver defined in
  Governance (`2_GovernanceLayer/Approvers/`).
- **Objects**: every `relationships.to` resolves to another object type defined in this layer.
- **Domain**: every agent's `allowed_actions` resolve to Governance actions, its `objects` resolve
  to object types, and its `domain` matches a domain in this layer. *(Advisory, not enforced: an
  action ideally has a single owning agent — the builder warns if one is assigned to more than one
  agent, but allows it for deliberate overlap.)*
- **Learning**: every pattern's `watches` resolves to object types; every prediction's `informs`
  resolves to objectives; every simulation's `scores_against` resolves to objectives and its
  `affects_actions` resolve to Governance actions.
- **Structure** (`_meta/Structure.md`): unique layer ids; contiguous indices 1..N; `inputs_from`
  references a lower index; `outputs_to` a higher index; every `references` namespace is owned by
  exactly one layer; binding targets/modes in vocabulary.

**Validation is built into `app/MissionControl.html`.** Open it, pick a business folder, and a pass/fail
panel above the map reports any broken invariant across the whole tree — weights, tiers, and every
cross-layer reference (serves, approvers, object relationships, agent actions/objects, operator
approvers, learning references, and the structure invariants).
