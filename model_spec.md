# Frozen Model Specification

## Population and outcome

- Population: adults hospitalized with asthma
- Development cohort: 458 adults
- Outcome: concurrent high mucus plug burden
- Outcome definition: 18-segment mucus plug score >=4
- Model family: ridge logistic regression
- Version: 1.0
- Frozen: August 20, 2026

## Clinical model

```text
LP = -2.960
  + 1.161 * ln(1 + ED)
  + 1.132 * NasalPolyps
  + 0.315 * GINA
  - 0.565 * Female
  + 0.624 * BPD
  + 0.836 * CurrentSmoking
```

## Clinical model with MMEF

```text
LP = -0.411
  + 1.292 * ln(1 + ED)
  + 1.256 * NasalPolyps
  + 0.175 * GINA
  - 0.764 * Female
  + 0.441 * BPD
  + 0.681 * CurrentSmoking
  - 0.401 * (MMEF / 10)
```

For both models:

```text
Probability = 1 / (1 + exp(-LP))
```

## Input coding

| Predictor | Coding |
| --- | --- |
| ED patient-days | Integer 0-365; transformed as ln(1+x) |
| History of nasal polyps | No=0, Yes=1 |
| GINA treatment step | Integer 1-5 |
| Sex | Male=0, Female=1 |
| Clinician-diagnosed breathing pattern disorder | No=0, Yes=1 |
| Smoking status | Current=1; Never, Former, Indeterminate=0 |
| Post-bronchodilator MMEF, % predicted | Nonnegative continuous value; coefficient per 10 percentage points |

No input imputation is performed by the calculator.

## Development-cohort performance

| Metric | Clinical | Clinical + MMEF |
| --- | ---: | ---: |
| AUROC | 0.770 | 0.832 |
| PR-AUC | 0.496 | 0.598 |
| Brier score | 0.144 | 0.126 |

These estimates were obtained using repeated out-of-fold evaluation in the development cohort. They are not independent external-validation estimates.
