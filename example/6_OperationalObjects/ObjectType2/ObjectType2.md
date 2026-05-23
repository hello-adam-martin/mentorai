---
mentor_node: object_type
layer: objects
id: order
label: "Order"
key: "order_id"
fields:
  - { name: "total", type: "number" }
  - { name: "channel", type: "enum" }
  - { name: "placed_at", type: "date" }
  - { name: "status", type: "enum" }
relationships:
  - { type: belongs_to, to: customer }
states: [received, preparing, served, paid]
history: append_only
---

# Order

Key: `order_id`. Append-only history; live instances live in the engine's knowledge store.
