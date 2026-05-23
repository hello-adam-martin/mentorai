---
mentor_node: simulation
layer: learning
id: simulation_1
scenario: "<the what-if to test>"          # replace, e.g. let the agent auto-approve small cases
compares: ["<option A>", "<option B>"]
scores_against: [objective_1, objective_2] # objectives the options are scored against — each must resolve
affects_actions: [action_1]                # actions whose use or tier the scenario would change — each must resolve
---

# Simulation 1

`<The what-if and why it's worth testing.>` Compares the options by their weighted impact on the
objectives below, before any change is recommended.

| field | value |
| --- | --- |
| scores against | `objective_1`, `objective_2` |
| affects | `action_1` |
