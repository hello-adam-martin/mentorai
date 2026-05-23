---
mentor_layer: human
index: 7
status: defined
owns: [operators]
references: [approvers]
---

# Human Collaboration Layer

The people in the loop — approvers, supervisors, experts, and escalation handlers. Each person
or role is a sub-folder (an **operator** node). An operator may *fulfil* one or more of the
approvers named in `2_GovernanceLayer/Approvers/` — that is, they are who actually signs off
approve-tier actions — and lists the channels they're reached on and what they're responsible for.

| operator (folder) | role | fulfils approver | reached on |
| --- | --- | --- | --- |
| `Operator1` | `<role>` | `approver_1` | `<channel>` |
| `Operator2` | `<role>` | — | `<channel>` |

Add a person by copying an `Operator{n}/` folder and editing its node file. Every id in an
operator's `fulfils_approvers` must match an approver defined in Governance.
