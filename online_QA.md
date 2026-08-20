# Online QA

Completed August 20, 2026 against:

<https://miaomiaowu1988.github.io/asthma-mucus-plug-calculator/>

The live page was tested in Google Chrome and Microsoft Edge. Five fixed cases were entered through the visible form in each browser and compared with Python gold-standard probabilities rounded to the displayed precision.

| Case | Clinical model | Clinical + MMEF |
| --- | ---: | ---: |
| Baseline | 6.6% | 6.6% |
| ED patient-days = 10 | 68.3% | 31.0% |
| All binary indicators = 1 | 65.5% | 88.9% |
| Mixed case A | 94.5% | 97.0% |
| Mixed case B | 42.3% | 24.4% |

All 10 browser-case comparisons matched the Python gold standard exactly at one decimal percent.

Final result: `PASS_ONLINE_FIXED_CASE_QA`.
