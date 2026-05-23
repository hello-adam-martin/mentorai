---
mentor_node: escalation
layer: governance
escalation:
  - { id: escalation_1, trigger: "Safety, security, or legal emergency", priority: critical, action: "Notify the responsible human immediately", overrides_quiet_hours: true }
  - { id: escalation_2, trigger: "An action fails repeatedly (~3x) or two agents disagree", priority: medium, action: "Stop, log the reasoning, and escalate — do not retry blindly", overrides_quiet_hours: false }
  - { id: escalation_3, trigger: "Food-safety incident (allergen exposure or contamination)", priority: critical, action: "Notify the owner immediately and pause affected items", overrides_quiet_hours: true }
---

# Escalation

Triggers that override normal tiers to pull a human in fast.

| trigger | priority | breaks quiet hours |
| --- | --- | --- |
| Safety, security, or legal emergency | critical | yes |
| An action fails repeatedly (~3x) or two agents disagree | medium | no |
| Food-safety incident (allergen exposure or contamination) | critical | yes |
