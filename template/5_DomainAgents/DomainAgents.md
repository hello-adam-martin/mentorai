---
mentor_layer: domain
index: 5
status: defined
owns: [domains, agents]
references: [actions, object_types]
---

# Domain Agents Layer

The specialised agents that do the work, grouped into **domains**. Each domain is a sub-folder;
each **agent** inside it is a node declaring its purpose, which Governance actions it may perform
(a subset of `2_GovernanceLayer/Actions/`), and which operational object types it touches
(`6_OperationalObjects/`). This is where intent and authority turn into actual work.

| domain (folder) | focus | example agent |
| --- | --- | --- |
| `Operations` | workflows, tasks, incidents, scheduling | `Agent1` |
| `Intelligence` | memory, patterns, forecasting, optimisation | `Agent3` |
| `Communication` | messaging and notifications across channels | `Agent2` |

Add an agent by copying an `Agent{n}/` folder into a domain. An agent may only use actions defined
in Governance and object types defined in Operational Objects. (Operations / Intelligence /
Communication are Mentor's reference domains — rename or add domains to fit the business.)
