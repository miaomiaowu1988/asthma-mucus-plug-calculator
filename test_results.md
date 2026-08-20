# Test Results

Tested August 20, 2026.

## Model tests

- Python unit tests: 32 passed
- Frozen coefficient check: passed
- ED `ln(1+x)` transformation: passed
- MMEF 30 to 40 linear-predictor change: -0.401, passed
- Input-boundary tests: passed

## Cross-language parity

- Random test cases: 1,000
- Compared: both probabilities and both linear predictors
- Maximum absolute Python-JavaScript difference: 3.552713678800501e-15
- Required maximum: 1e-10
- Result: passed

## Browser and layout checks

- Google Chrome: passed
- Microsoft Edge: passed
- Desktop: 1920x1080 and 1366x768, passed
- Mobile: 390x844, passed
- Horizontal overflow: none
- External or subresource requests: none

## Privacy and security scan

- External API calls: 0
- Analytics: 0
- Browser storage: 0
- Hidden tracking: 0
- External fonts/CDNs: 0

Online GitHub Pages verification is recorded separately in `online_QA.md` after deployment.
