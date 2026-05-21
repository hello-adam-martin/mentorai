---
mentor_node: escalation
layer: governance
escalation:
  - { id: escalation_1, trigger: "<an urgent condition that must reach a human fast>", priority: critical, action: "<what to do>", overrides_quiet_hours: true }   # replace
  - { id: escalation_2, trigger: "<a high-priority condition>", priority: high, action: "<what to do>", overrides_quiet_hours: false }
  - { id: escalation_3, trigger: "<repeated failure or agent disagreement>", priority: medium, action: "Stop, log reasoning, escalate — do not retry blindly.", overrides_quiet_hours: false }
---

# Escalation

Triggers that override normal tiers to pull a human in fast.

| trigger | priority | overrides quiet hours |
| --- | --- | --- |
| `<urgent condition>` | critical | yes |
| `<high-priority condition>` | high | no |
| repeated failure / agent disagreement | medium | no |
