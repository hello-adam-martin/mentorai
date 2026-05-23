---
mentor_node: object_type
layer: objects
id: menuitem
label: "MenuItem"
key: "sku"
fields:
  - { name: "name", type: "text" }
  - { name: "category", type: "enum" }
  - { name: "price", type: "number" }
  - { name: "allergens", type: "text" }
relationships:
  []
states: [active, seasonal, retired]
history: append_only
---

# MenuItem

Key: `sku`. Append-only history; live instances live in the engine's knowledge store.
