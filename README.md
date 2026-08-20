# High Mucus Plug Burden Calculator

Research calculator for adults hospitalized with asthma.

## Models

- Clinical model
- Clinical model with post-bronchodilator MMEF

## Outcome

Concurrent high mucus plug burden, defined as an 18-segment mucus plug score >=4.

All calculations run locally in the browser. The page sends no patient data, uses no analytics, and stores no entries.

## Use

Open the [calculator](https://miaomiaowu1988.github.io/asthma-mucus-plug-calculator/) and enter all six required clinical variables. Post-bronchodilator MMEF is optional; when entered, the second model is also calculated.

Probabilities are displayed continuously. No risk categories or clinical decision thresholds have been defined.

## Model formulas

```text
Clinical LP = -2.960
  + 1.161 * ln(1 + ED patient-days)
  + 1.132 * NasalPolyps
  + 0.315 * GINA
  - 0.565 * Female
  + 0.624 * BPD
  + 0.836 * CurrentSmoking

Clinical + MMEF LP = -0.411
  + 1.292 * ln(1 + ED patient-days)
  + 1.256 * NasalPolyps
  + 0.175 * GINA
  - 0.764 * Female
  + 0.441 * BPD
  + 0.681 * CurrentSmoking
  - 0.401 * (MMEF % predicted / 10)

Probability = 1 / (1 + exp(-LP))
```

Current smoking is coded 1. Never, former, and indeterminate smoking status are coded 0.

## Validation status

Performance was estimated using repeated out-of-fold evaluation in the development cohort. The models have not undergone independent external validation.

Research use only. The calculator should not replace clinically indicated chest CT.

Version 1.0, August 2026.
