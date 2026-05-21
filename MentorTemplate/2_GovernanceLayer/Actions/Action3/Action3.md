---
mentor_node: action
layer: governance
id: action_3
description: "<what this high-stakes action is>"   # replace
tier: approve
approver: approver_1
domains: ["<domain>"]
serves: [objective_3]
limits: { max_value: { amount: 0, currency: "<CCY>" } }   # replace or remove
conditions: "<the high-risk / irreversible case that needs sign-off>"
---

# Action3

`<A high-risk or irreversible action that needs a named approver's sign-off.>`

| field | value |
| --- | --- |
| tier | approve |
| approver | approver_1 |
| serves | objective_3 |

Note: enforce approve-tier actions with an engine mechanism (a hook, or withholding the tool),
not instruction text alone — see `../../../_meta/EngineAdapters.md`.
