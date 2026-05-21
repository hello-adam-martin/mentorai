---
mentor_node: autonomy_tiers
layer: governance
tiers:
  auto:      "Agent acts immediately and logs it."
  recommend: "Agent proposes; acts only on human confirmation."
  approve:   "Agent may not act until a named approver signs off."
---

# Autonomy Tiers

Every action policy is pinned to exactly one tier. This is the human-in-the-loop dial.

| tier | meaning |
| --- | --- |
| `auto` | act immediately, log it (low-risk, reversible, known) |
| `recommend` | propose and wait for confirmation |
| `approve` | no action until a named approver signs off (high-risk / irreversible) |

Design intent: actions migrate *toward* `auto` over time as they earn trust through evidence
(the Learning layer's job). Nothing starts trusted by default.
