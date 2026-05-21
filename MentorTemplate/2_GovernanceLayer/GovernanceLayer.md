---
mentor_layer: governance
index: 2
status: defined
autonomy_tiers: [auto, recommend, approve]
---

# Governance Layer

The safety model: what an agent may do on its own, what it must propose, what needs sign-off,
and the lines it must never cross. Each part is a sub-folder.

| component (folder) | what it holds |
| --- | --- |
| `AutonomyTiers` | the three independence levels: auto / recommend / approve |
| `Approvers` | who can authorise what (one sub-folder per approver) |
| `Actions` | action policies, each pinned to a tier (one sub-folder per action) |
| `HardLimits` | inviolable prohibitions |
| `Escalation` | triggers that pull a human in fast |
| `Notifications` | channels and quiet hours |
| `Audit` | logging and explainability requirements |

Governance always supersedes strategy: a strategic weight can influence *which permitted* option
an agent prefers, but never authorises something a hard limit forbids.
