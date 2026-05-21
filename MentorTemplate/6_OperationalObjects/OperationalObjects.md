---
mentor_layer: objects
index: 6
status: defined
owns: [object_types]
references: []
---

# Operational Objects Layer

The real-world things the business coordinates — its **object types**. Each type is a sub-folder
describing the fields it carries, its stable `key`, the lifecycle `states` it moves through, and
its `relationships` to other types. Every instance keeps an append-only history. Live instances
live in the engine's knowledge store (queried on demand), not in this spec.

| object type (folder) | key | relationships |
| --- | --- | --- |
| `ObjectType1` | `<key>` | has_many → `object_type_2` |
| `ObjectType2` | `<key>` | belongs_to → `object_type_1` |

Add a type by copying an `ObjectType{n}/` folder. Every relationship `to` must match another
object type defined in this layer.
