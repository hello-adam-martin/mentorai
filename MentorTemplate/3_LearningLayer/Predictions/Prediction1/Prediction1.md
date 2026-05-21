---
mentor_node: prediction
layer: learning
id: prediction_1
predicts: "<metric or outcome>"     # replace, e.g. review_risk
horizon: "<time window>"            # e.g. next 7 days
informs: [objective_1]              # objective(s) this forecast helps protect — each must resolve
---

# Prediction 1

`<What this forecasts and how it's used.>` Lets the system act ahead of time to protect the
objective(s) it informs.

| field | value |
| --- | --- |
| predicts | `<metric>` |
| horizon | `<time window>` |
| informs | `objective_1` |
