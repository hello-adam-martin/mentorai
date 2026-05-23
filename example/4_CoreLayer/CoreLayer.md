---
mentor_layer: core
index: 4
status: defined
owns: [routing]
binding: [{ target: engine, mode: at_startup }]
---

# Core Layer

The reasoning engine. Configured, not authored — choose an engine via _meta/EngineAdapters.md. It reads the layers above, scores options against your objectives, and routes work within Governance.
