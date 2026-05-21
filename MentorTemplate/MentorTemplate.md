---
mentor: business
name: "<Business Name>"          # example — replace
engine_adapter: null             # e.g. hermes_agent; see _meta/EngineAdapters.md
template_version: 0.3
---

# Mentor — <Business Name>

This folder is a complete Mentor operating model for one business. **The folder tree is the
structure.** Each folder is a node; the markdown file named after the folder explains that node.
To zoom in, open a folder and read its node file.

## How to use this template

1. Copy the whole `MentorTemplate/` folder and rename it to your business.
2. Set `name` (and optionally `engine_adapter`) in the frontmatter above.
3. Work top-down: edit each layer's node file, then add/edit the component nodes inside it.
4. Replace every value marked `# example — replace`.
5. Validate — see `_meta/SpecFormat.md`.
6. Open `MissionControl.html` and choose this folder (or drag it onto the page) to see a live
   hierarchy map generated from these files — re-pick after edits to refresh.
7. New here? `_meta/Playbook.md` is the complete guide — from understanding Mentor, through defining
   and validating your model, to compiling and running it. (It uses `_meta/LaunchPrompt.md`, the
   bootstrap prompt that makes an engine operate as Mentor.)

## Layers

| Layer | Folder | Status |
| --- | --- | --- |
| 1 Strategic | `1_StrategicLayer/` | defined (skeleton) |
| 2 Governance | `2_GovernanceLayer/` | defined (skeleton) |
| 3 Learning & Simulation | `3_LearningLayer/` | planned |
| 4 Core | `4_CoreLayer/` | engine (configured) |
| 5 Domain agents | `5_DomainAgents/` | planned |
| 6 Operational objects | `6_OperationalObjects/` | planned |
| 7 Human collaboration | `7_HumanCollaboration/` | planned |

## Conventions

- **A folder is a node.** Its node file is named after the folder; for the numbered
  top-level layers the file drops the number prefix (e.g.
  `1_StrategicLayer/StrategicLayer.md`, `1_StrategicLayer/Objective1/Objective1.md`).
- **Each node file** = YAML frontmatter (the canonical, machine-checkable data) + a Markdown
  body (prose + light tables) that mirrors it. If they ever disagree, the frontmatter wins.
- **Authority and intent flow down** the layers; **state and outcomes flow up**.
- **Engine-agnostic.** Nothing here names a specific engine. `_meta/EngineAdapters.md` maps the
  abstract capabilities to a real engine; swap the adapter to change engine.
- See `_meta/Structure.md` for how the layers wire together, `_meta/SpecFormat.md` for the
  frontmatter fields and validation rules, and `_meta/Defaults.md` for recommended safe defaults.
