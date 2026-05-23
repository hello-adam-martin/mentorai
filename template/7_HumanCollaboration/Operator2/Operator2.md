---
mentor_node: operator
layer: human
id: operator_2
name: "<person or role name>"        # replace
role: "<supervisor | on-call | expert>"
fulfils_approvers: []                # not an approver — supports / handles escalations only
channels: ["<channel>"]
handles: ["<e.g. after-hours escalations, specialist advice>"]
availability: "<when reachable>"
---

# Operator 2

`<Who this is.>` Not an approver — handles escalations and provides expertise the agents can pull
in. Wire this person to the relevant triggers in `2_GovernanceLayer/Escalation/`.

| field | value |
| --- | --- |
| role | `<role>` |
| fulfils approver | — |
| reached on | `<channel>` |
| handles | `<responsibility>` |
