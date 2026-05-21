---
mentor_node: object_type
layer: objects
id: object_type_2
label: "<Object Type 2 name>"        # replace, e.g. Job
key: "<unique id field>"
fields:
  - { name: "<field>", type: "<text|number|date|enum|ref>" }
relationships:
  - { type: belongs_to, to: object_type_1 }   # resolves to ObjectType1
states: ["<state_1>", "<state_2>"]
history: append_only
---

# Object Type 2

`<What this entity is.>` Belongs to an `object_type_1`. Keeps a stable `key` and an append-only
history.

| property | value |
| --- | --- |
| key | `<unique id field>` |
| relationships | belongs_to → `object_type_1` |
| states | `<state_1>` → `<state_2>` |
