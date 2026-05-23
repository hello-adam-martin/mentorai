---
mentor_layer: core
index: 4
status: defined
owns: [routing]
binding: [{ target: engine, mode: at_startup }]
---

# Core Layer

The reasoning engine. Core is **configured, not authored** — it maps to the engine itself (see
`_meta/EngineAdapters.md`). It builds context from the layers above, scores options against the
Strategic objectives, routes work to Domain agents within Governance's authority, and escalates
to Humans when required.

There is no content to fill in here beyond choosing the engine adapter for the business.
