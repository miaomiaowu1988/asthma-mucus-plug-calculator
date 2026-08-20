"""Frozen high mucus-plug burden probability models."""

from __future__ import annotations

import math


def _validate_integer(name: str, value: int, minimum: int, maximum: int) -> None:
    if isinstance(value, bool) or not isinstance(value, int) or not minimum <= value <= maximum:
        raise ValueError(f"{name} must be an integer from {minimum} to {maximum}")


def _validate_binary(name: str, value: int) -> None:
    if isinstance(value, bool) or value not in (0, 1):
        raise ValueError(f"{name} must be 0 or 1")


def _validate_clinical_inputs(
    ed_patient_days: int,
    nasal_polyps: int,
    gina_step: int,
    female: int,
    breathing_pattern_disorder: int,
    current_smoking: int,
) -> None:
    _validate_integer("ed_patient_days", ed_patient_days, 0, 365)
    _validate_integer("gina_step", gina_step, 1, 5)
    _validate_binary("nasal_polyps", nasal_polyps)
    _validate_binary("female", female)
    _validate_binary("breathing_pattern_disorder", breathing_pattern_disorder)
    _validate_binary("current_smoking", current_smoking)


def logistic(linear_predictor: float) -> float:
    """Return a numerically stable logistic transform."""
    if linear_predictor >= 0:
        return 1.0 / (1.0 + math.exp(-linear_predictor))
    exp_lp = math.exp(linear_predictor)
    return exp_lp / (1.0 + exp_lp)


def clinical_linear_predictor(
    ed_patient_days: int,
    nasal_polyps: int,
    gina_step: int,
    female: int,
    breathing_pattern_disorder: int,
    current_smoking: int,
) -> float:
    _validate_clinical_inputs(
        ed_patient_days,
        nasal_polyps,
        gina_step,
        female,
        breathing_pattern_disorder,
        current_smoking,
    )
    return (
        -2.960
        + 1.161 * math.log1p(ed_patient_days)
        + 1.132 * nasal_polyps
        + 0.315 * gina_step
        - 0.565 * female
        + 0.624 * breathing_pattern_disorder
        + 0.836 * current_smoking
    )


def clinical_probability(
    ed_patient_days: int,
    nasal_polyps: int,
    gina_step: int,
    female: int,
    breathing_pattern_disorder: int,
    current_smoking: int,
) -> float:
    return logistic(
        clinical_linear_predictor(
            ed_patient_days,
            nasal_polyps,
            gina_step,
            female,
            breathing_pattern_disorder,
            current_smoking,
        )
    )


def mmef_linear_predictor(
    ed_patient_days: int,
    nasal_polyps: int,
    gina_step: int,
    female: int,
    breathing_pattern_disorder: int,
    current_smoking: int,
    mmef_percent_predicted: float,
) -> float:
    _validate_clinical_inputs(
        ed_patient_days,
        nasal_polyps,
        gina_step,
        female,
        breathing_pattern_disorder,
        current_smoking,
    )
    if not isinstance(mmef_percent_predicted, (int, float)) or not math.isfinite(mmef_percent_predicted) or mmef_percent_predicted <= 0:
        raise ValueError("mmef_percent_predicted must be a finite number greater than 0")
    return (
        -0.411
        + 1.292 * math.log1p(ed_patient_days)
        + 1.256 * nasal_polyps
        + 0.175 * gina_step
        - 0.764 * female
        + 0.441 * breathing_pattern_disorder
        + 0.681 * current_smoking
        - 0.401 * (mmef_percent_predicted / 10.0)
    )


def mmef_probability(
    ed_patient_days: int,
    nasal_polyps: int,
    gina_step: int,
    female: int,
    breathing_pattern_disorder: int,
    current_smoking: int,
    mmef_percent_predicted: float,
) -> float:
    return logistic(
        mmef_linear_predictor(
            ed_patient_days,
            nasal_polyps,
            gina_step,
            female,
            breathing_pattern_disorder,
            current_smoking,
            mmef_percent_predicted,
        )
    )
