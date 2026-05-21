---
mentor_node: notifications
layer: governance
default_channels: [email]
quiet_hours: { window: "22:00-07:00", timezone: "UTC", only_priority_at_or_above: critical }   # example — replace
---

# Notifications

How humans are kept informed.

| setting | value |
| --- | --- |
| default channels | email |
| quiet hours | 22:00–07:00 UTC |
| breaks through quiet hours | critical only |
