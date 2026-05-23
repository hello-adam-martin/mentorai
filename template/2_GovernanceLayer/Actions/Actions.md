---
mentor_node: actions_index
layer: governance
---

# Actions

Action policies — each names something an agent might do and pins it to an autonomy tier, with
any limits, the objectives it serves, and (for approve-tier) an approver. One sub-folder per
action. The three below are placeholders showing the pattern across all tiers.

| action (folder) | tier | serves | approver |
| --- | --- | --- | --- |
| `Action1` | auto | objective_1 | — |
| `Action2` | recommend | objective_2 | — |
| `Action3` | approve | objective_3 | approver_1 |

Add an action by copying one of these folders and editing its node file. Policies may chain via
`escalates_to` (a safer/cheaper version that escalates to a stricter one past a threshold).
