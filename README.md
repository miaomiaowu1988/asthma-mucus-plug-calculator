# High Mucus Plug Burden Research Calculator

Estimates concurrent probability of an **18-segment mucus plug score >=4** in adults hospitalized with asthma. This is not a future-risk model.

Developed and internally evaluated in a single-center retrospective cohort (458 records). No independent external validation. Research use only; probabilities must not replace clinically indicated CT or determine treatment. No manuscript DOI is asserted.

## Models and inputs

- Clinical: prior 365-day asthma-related ED patient-days, history of nasal polyps, recorded GINA treatment step, sex, heart rate, and current smoking.
- Clinical + MMEF: the same six variables plus post-bronchodilator MMEF, % predicted.
- ED is entered as a raw nonnegative integer and transformed with `log1p` internally.
- Female=1, male=0. Current smoking=1, all other categories=0 (including never, former, and indeterminate in development data).
- GINA uses recorded ordinal values 0-5. Category 0 is a dataset code, not a proposed guideline treatment step.
- Heart rate is positive bpm. MMEF is nonnegative % predicted. Blank MMEF is missing, not zero; only the clinical model is calculated. Other inputs are required. No user-input imputation, clipping, or clinical threshold is implemented.

## Reproducibility

Internal evaluation (Clinical / Clinical + MMEF): AUROC 0.770 / 0.833; PR-AUC 0.496 / 0.599; Brier 0.144 / 0.126, from the frozen Table 3. These are internal estimates, not external-validation results. The page places performance and full equations in a collapsed About section. No clinical action thresholds are provided.

`model_parameters_final.json` is the sole numeric parameter source. All coefficients are original-scale full precision: heart rate per 1 bpm, MMEF per 1 percentage point. The build embeds the JSON and source scripts into identical root and `docs/index.html` files; no network fetch is needed for calculation. Equation display is generated from the same parameters.

```text
python source/build_site.py
python tests/generate_cases.py
node tests/test_heart_rate.js
node tests/browser_qa.mjs
```

Browser tests require Playwright and Chrome. Set NODE_PATH if using an external package runtime. The Python reference reads the same canonical JSON independently. Browser QA fills the real form, clicks Calculate, and compares unrounded DOM probability data against 20 Python reference cases (tolerance <1e-10). Reports and screenshots go to ignored `test_artifacts/`.

Open `index.html` or `docs/index.html`, not the source template. GitHub Pages serves the configured publication directory.

## Privacy

All calculations run locally in the browser. No API calls, analytics, cookies, browser storage, or patient-data transmission. Tests contain only synthetic inputs. Public parameters contain no patient records.

[Calculator](https://research-jay.github.io/asthma-mucus-plug-calculator/) | [Source](https://github.com/research-jay/asthma-mucus-plug-calculator)
