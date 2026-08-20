from __future__ import annotations

import json
import math
import sys
from pathlib import Path

import pytest


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "source"))

from model import (  # noqa: E402
    clinical_linear_predictor,
    clinical_probability,
    mmef_linear_predictor,
    mmef_probability,
)


def clinical_kwargs(**overrides):
    values = {
        "ed_patient_days": 0,
        "nasal_polyps": 0,
        "gina_step": 1,
        "female": 0,
        "breathing_pattern_disorder": 0,
        "current_smoking": 0,
    }
    values.update(overrides)
    return values


def test_frozen_spec_matches_table_2_coefficients():
    spec = json.loads((ROOT / "model_spec.json").read_text(encoding="utf-8"))
    assert spec["clinical"] == {
        "intercept": -2.960,
        "ed_log1p": 1.161,
        "nasal_polyps": 1.132,
        "gina_step": 0.315,
        "female": -0.565,
        "breathing_pattern_disorder": 0.624,
        "current_smoking": 0.836,
    }
    assert spec["clinical_mmef"] == {
        "intercept": -0.411,
        "ed_log1p": 1.292,
        "nasal_polyps": 1.256,
        "gina_step": 0.175,
        "female": -0.764,
        "breathing_pattern_disorder": 0.441,
        "current_smoking": 0.681,
        "mmef_per_10_percent_predicted": -0.401,
    }


@pytest.mark.parametrize("ed", [0, 1, 10, 365])
def test_clinical_linear_predictor_uses_log1p_ed(ed):
    observed = clinical_linear_predictor(**clinical_kwargs(ed_patient_days=ed))
    expected = -2.960 + 1.161 * math.log1p(ed) + 0.315
    assert observed == pytest.approx(expected, abs=1e-14)


@pytest.mark.parametrize("gina", [1, 3, 5])
def test_gina_is_entered_as_the_selected_step(gina):
    observed = clinical_linear_predictor(**clinical_kwargs(gina_step=gina))
    assert observed == pytest.approx(-2.960 + 0.315 * gina, abs=1e-14)


def test_binary_coefficients_are_applied_once():
    observed = clinical_linear_predictor(
        **clinical_kwargs(
            nasal_polyps=1,
            female=1,
            breathing_pattern_disorder=1,
            current_smoking=1,
        )
    )
    expected = -2.960 + 0.315 + 1.132 - 0.565 + 0.624 + 0.836
    assert observed == pytest.approx(expected, abs=1e-14)


def test_mixed_clinical_case_matches_frozen_formula():
    kwargs = clinical_kwargs(
        ed_patient_days=10,
        nasal_polyps=1,
        gina_step=4,
        female=0,
        breathing_pattern_disorder=1,
        current_smoking=0,
    )
    expected = -2.960 + 1.161 * math.log1p(10) + 1.132 + 0.315 * 4 + 0.624
    assert clinical_linear_predictor(**kwargs) == pytest.approx(expected, abs=1e-14)


def test_mmef_30_to_40_changes_linear_predictor_by_minus_0_401():
    kwargs = clinical_kwargs(ed_patient_days=1, gina_step=3)
    lp_30 = mmef_linear_predictor(**kwargs, mmef_percent_predicted=30)
    lp_40 = mmef_linear_predictor(**kwargs, mmef_percent_predicted=40)
    assert lp_40 - lp_30 == pytest.approx(-0.401, abs=1e-14)


@pytest.mark.parametrize("mmef", [0.1, 30, 60, 100, 150])
def test_mmef_values_use_per_10_percentage_point_scaling(mmef):
    kwargs = clinical_kwargs()
    observed = mmef_linear_predictor(**kwargs, mmef_percent_predicted=mmef)
    expected = -0.411 + 0.175 - 0.401 * (mmef / 10)
    assert observed == pytest.approx(expected, abs=1e-14)


def test_mmef_above_200_remains_calculable():
    probability = mmef_probability(**clinical_kwargs(), mmef_percent_predicted=201)
    assert 0.0 < probability < 1.0


def test_probability_is_logistic_transform_of_linear_predictor():
    kwargs = clinical_kwargs(ed_patient_days=10, nasal_polyps=1, gina_step=5, current_smoking=1)
    lp = clinical_linear_predictor(**kwargs)
    expected = 1.0 / (1.0 + math.exp(-lp))
    assert clinical_probability(**kwargs) == pytest.approx(expected, abs=1e-15)


@pytest.mark.parametrize(
    ("field", "value"),
    [
        ("ed_patient_days", -1),
        ("ed_patient_days", 366),
        ("ed_patient_days", 1.5),
        ("gina_step", 0),
        ("gina_step", 6),
        ("nasal_polyps", 2),
        ("female", -1),
        ("breathing_pattern_disorder", 3),
        ("current_smoking", 2),
    ],
)
def test_invalid_clinical_input_is_rejected(field, value):
    with pytest.raises(ValueError):
        clinical_probability(**clinical_kwargs(**{field: value}))


@pytest.mark.parametrize("value", [0, -1, float("nan"), float("inf")])
def test_invalid_mmef_is_rejected(value):
    with pytest.raises(ValueError):
        mmef_probability(**clinical_kwargs(), mmef_percent_predicted=value)
