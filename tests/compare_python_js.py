from __future__ import annotations

import argparse
import json
import random
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "source"))

from model import (  # noqa: E402
    clinical_linear_predictor,
    clinical_probability,
    mmef_linear_predictor,
    mmef_probability,
)


def generate_cases(count: int, seed: int) -> list[dict[str, int | float]]:
    randomizer = random.Random(seed)
    return [
        {
            "ed_patient_days": randomizer.randint(0, 365),
            "nasal_polyps": randomizer.randint(0, 1),
            "gina_step": randomizer.randint(1, 5),
            "female": randomizer.randint(0, 1),
            "breathing_pattern_disorder": randomizer.randint(0, 1),
            "current_smoking": randomizer.randint(0, 1),
            "mmef_percent_predicted": randomizer.uniform(0, 250),
        }
        for _ in range(count)
    ]


def python_results(cases: list[dict[str, int | float]]) -> list[dict[str, float]]:
    results = []
    for case in cases:
        clinical_values = {
            "ed_patient_days": case["ed_patient_days"],
            "nasal_polyps": case["nasal_polyps"],
            "gina_step": case["gina_step"],
            "female": case["female"],
            "breathing_pattern_disorder": case["breathing_pattern_disorder"],
            "current_smoking": case["current_smoking"],
        }
        results.append(
            {
                "clinical_probability": clinical_probability(**clinical_values),
                "mmef_probability": mmef_probability(
                    **clinical_values,
                    mmef_percent_predicted=case["mmef_percent_predicted"],
                ),
                "clinical_linear_predictor": clinical_linear_predictor(**clinical_values),
                "mmef_linear_predictor": mmef_linear_predictor(
                    **clinical_values,
                    mmef_percent_predicted=case["mmef_percent_predicted"],
                ),
            }
        )
    return results


def javascript_results(cases: list[dict[str, int | float]]) -> list[dict[str, float]]:
    process = subprocess.run(
        ["node", str(ROOT / "tests" / "js_batch_runner.js")],
        input=json.dumps(cases),
        text=True,
        capture_output=True,
        check=False,
    )
    if process.returncode != 0:
        raise RuntimeError(f"JavaScript runner failed:\n{process.stderr}")
    return json.loads(process.stdout)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--cases", type=int, default=1000)
    parser.add_argument("--seed", type=int, default=20260820)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()

    cases = generate_cases(args.cases, args.seed)
    expected = python_results(cases)
    observed = javascript_results(cases)
    fields = tuple(expected[0])
    maximum_difference = max(
        abs(python_row[field] - javascript_row[field])
        for python_row, javascript_row in zip(expected, observed, strict=True)
        for field in fields
    )

    scaling_case = cases[0] | {"mmef_percent_predicted": 30.0}
    scaling_case_40 = scaling_case | {"mmef_percent_predicted": 40.0}
    scaling_results = javascript_results([scaling_case, scaling_case_40])
    mmef_lp_change = scaling_results[1]["mmef_linear_predictor"] - scaling_results[0]["mmef_linear_predictor"]

    summary = {
        "case_count": args.cases,
        "seed": args.seed,
        "compared_fields": list(fields),
        "maximum_absolute_difference": maximum_difference,
        "required_maximum_difference": 1e-10,
        "mmef_30_to_40_lp_change": mmef_lp_change,
        "required_mmef_lp_change": -0.401,
        "pass": maximum_difference < 1e-10 and abs(mmef_lp_change + 0.401) < 1e-12,
    }
    if args.output:
        args.output.write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(json.dumps(summary, indent=2))
    return 0 if summary["pass"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
