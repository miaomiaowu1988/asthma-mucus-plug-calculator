# Online QA

Completed August 20, 2026 against:

<https://miaomiaowu1988.github.io/asthma-mucus-plug-calculator/>

The live page was tested in Google Chrome and Microsoft Edge. Five fixed cases were entered through the visible form in each browser and compared with Python gold-standard probabilities rounded to the displayed precision.

| Case | Clinical model | Clinical + MMEF |
| --- | ---: | ---: |
| Baseline | 6.6% | 6.6% |
| ED patient-days = 10 | 68.3% | 31.0% |
| All binary indicators = 1; MMEF = 30 | 65.5% | 70.6% |
| Mixed case A | 94.5% | 97.0% |
| Mixed case B | 42.3% | 24.4% |

All 10 browser-case comparisons matched the Python gold standard exactly at one decimal percent. Input-validation checks also confirmed that blank MMEF leaves the extended model unavailable, MMEF equal to 0 is rejected without suppressing the clinical-model result, a positive value is calculated, and values above 200% predicted receive a non-blocking verification warning.

Final result: `PASS_ONLINE_FIXED_CASE_QA`.
