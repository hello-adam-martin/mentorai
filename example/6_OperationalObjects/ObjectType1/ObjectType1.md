---
mentor_node: object_type
layer: objects
id: customer
label: "Customer"
key: "customer_id"
fields:
  - { name: "full_name", type: "text" }
  - { name: "email", type: "text" }
  - { name: "loyalty_points", type: "number" }
  - { name: "visits", type: "number" }
relationships:
  - { type: has_many, to: order }
states: [new, regular, lapsed]
history: append_only
---

# Customer

Key: `customer_id`. Append-only history; live instances live in the engine's knowledge store.
