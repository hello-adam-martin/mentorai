---
mentor_layer: strategic
index: 1
status: defined
weighting:
  weights_sum_to: 1.0
  tie_breaker: escalate              # or prefer_higher_weight
  tie_margin: 0.05
  governance_supersedes_strategy: true
mission: "<one north-star statement for the business>"   # replace
---

# Strategic Layer

What the business is trying to achieve, as a small set of weighted, measurable **objectives**.
Each objective is a sub-folder whose node file holds its weight and targets. Weights across the
objective folders sum to `1.0`. Rename, add, or remove objective folders to fit the business.

| objective (folder) | weight | about |
| --- | --- | --- |
| `Objective1` | 0.40 | `<what this objective is>` |
| `Objective2` | 0.30 | `<what this objective is>` |
| `Objective3` | 0.30 | `<what this objective is>` |

When objectives conflict, agents score each option by weighted objective impact and prefer the
highest-scoring **permitted** option; ties within `tie_margin` escalate. Governance supersedes
strategy.
