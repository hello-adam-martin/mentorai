---
mentor_node: operator
layer: human
id: operator_1
name: "<person or role name>"        # replace
role: "<owner | operator>"
fulfils_approvers: [approver_1]      # which Governance approver(s) this person is — must resolve
channels: ["<channel>"]              # e.g. email, telegram
handles: ["<what they are responsible for>"]   # e.g. refund sign-off, owner updates
availability: "<when reachable>"     # optional, e.g. business hours
---

# Operator 1

`<Who this is.>` Fulfils the `approver_1` role in Governance — they are who signs off approve-tier
actions assigned to that approver.

| field | value |
| --- | --- |
| role | `<role>` |
| fulfils approver | `approver_1` |
| reached on | `<channel>` |
| handles | `<responsibility>` |
