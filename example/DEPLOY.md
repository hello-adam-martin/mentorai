# Deploy — cafe

This folder is **self-contained and ready to run** — the launch prompt (`AGENTS.md`) sits right here with the seven layer folders.

## 1 · Start your engine inside this folder
Open a terminal in this folder and start your engine here. It loads `AGENTS.md` from the working directory automatically, and reads the layer files on demand. With Hermes Agent:

```
cd cafe
hermes
```

Sanity check — ask it *"what are you optimising for?"*; it should answer as Mentor with your objectives.

## 2 · Install the agent skills
Copy the contents of `skills/` into your engine's skills directory (e.g. `~/.hermes/skills/`):
- `skills/guest_relations_agent/SKILL.md`
- `skills/insights_agent/SKILL.md`
- `skills/front_of_house_agent/SKILL.md`

## 3 · Wire it up
Follow `SETUP.md` to connect tools, live data, and channels, and to enforce the hard limits. Start every action at `recommend`; promote to `auto` only on evidence.
