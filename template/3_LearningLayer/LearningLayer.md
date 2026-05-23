---
mentor_layer: learning
index: 3
status: defined
owns: [patterns, predictions, simulations]
references: [objectives, actions, object_types]
---

# Learning & Simulation Layer

How Mentor improves over time. It watches the operational objects and outcomes, then produces
three kinds of node, each a sub-folder:

| group (folder) | what it captures | references |
| --- | --- | --- |
| `Patterns` | recurring issues / bottlenecks worth acting on | object types it `watches` |
| `Predictions` | forecasts of a metric over a horizon | objectives they `inform` |
| `Simulations` | what-if comparisons scored before acting | objectives + actions |

Outputs flow up to Core as recommendations, predicted impacts, and the evidence that lets
Governance migrate an action toward more autonomy. Add items by copying the `*1/` folders.
