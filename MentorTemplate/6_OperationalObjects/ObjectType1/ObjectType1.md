---
mentor_node: object_type
layer: objects
id: object_type_1
label: "<Object Type 1 name>"        # replace, e.g. Customer
key: "<unique id field>"             # the stable identifier, e.g. customer_id
fields:
  - { name: "<field>", type: "<text|number|date|enum|ref>" }   # replace; add as many as needed
relationships:
  - { type: has_many, to: object_type_2 }    # 'to' must be another object type id in this layer
states: ["<state_1>", "<state_2>"]   # optional lifecycle the object moves through
history: append_only                 # every instance keeps an append-only event history
---

# Object Type 1

`<What this entity is and why the business tracks it.>` Every instance has a stable `key` and an
append-only history; live instances live in the engine's knowledge store, not here.

| property | value |
| --- | --- |
| key | `<unique id field>` |
| relationships | has_many → `object_type_2` |
| states | `<state_1>` → `<state_2>` |
