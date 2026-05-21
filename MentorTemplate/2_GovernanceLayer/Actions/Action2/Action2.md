---
mentor_node: action
layer: governance
id: action_2
description: "<what this action is>"     # replace
tier: recommend
domains: ["<domain>"]
serves: [objective_2]
conditions: "<when the agent should propose rather than act>"
escalates_to: action_3
---

# Action2

`<What this action does; the agent proposes it and acts only on confirmation.>` Past a threshold
it escalates to `Action3`.

| field | value |
| --- | --- |
| tier | recommend |
| serves | objective_2 |
| escalates to | action_3 |
