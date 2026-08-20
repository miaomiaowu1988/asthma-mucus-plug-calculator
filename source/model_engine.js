(function attachMucusPlugModel(root, factory) {
  "use strict";
  const api = factory();
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  if (root) {
    root.MucusPlugModel = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function createMucusPlugModel() {
  "use strict";

  function requireInteger(name, value, minimum, maximum) {
    if (!Number.isInteger(value) || value < minimum || value > maximum) {
      throw new RangeError(`${name} must be an integer from ${minimum} to ${maximum}`);
    }
  }

  function requireBinary(name, value) {
    if (value !== 0 && value !== 1) {
      throw new RangeError(`${name} must be 0 or 1`);
    }
  }

  function validateClinicalInputs(values) {
    requireInteger("ed_patient_days", values.ed_patient_days, 0, 365);
    requireInteger("gina_step", values.gina_step, 1, 5);
    requireBinary("nasal_polyps", values.nasal_polyps);
    requireBinary("female", values.female);
    requireBinary("breathing_pattern_disorder", values.breathing_pattern_disorder);
    requireBinary("current_smoking", values.current_smoking);
  }

  function logistic(linearPredictor) {
    if (linearPredictor >= 0) {
      return 1 / (1 + Math.exp(-linearPredictor));
    }
    const exponent = Math.exp(linearPredictor);
    return exponent / (1 + exponent);
  }

  function clinicalLinearPredictor(values) {
    validateClinicalInputs(values);
    return (
      -2.960
      + 1.161 * Math.log1p(values.ed_patient_days)
      + 1.132 * values.nasal_polyps
      + 0.315 * values.gina_step
      - 0.565 * values.female
      + 0.624 * values.breathing_pattern_disorder
      + 0.836 * values.current_smoking
    );
  }

  function clinicalProbability(values) {
    return logistic(clinicalLinearPredictor(values));
  }

  function mmefLinearPredictor(values) {
    validateClinicalInputs(values);
    if (!Number.isFinite(values.mmef_percent_predicted) || values.mmef_percent_predicted < 0) {
      throw new RangeError("mmef_percent_predicted must be a finite nonnegative number");
    }
    return (
      -0.411
      + 1.292 * Math.log1p(values.ed_patient_days)
      + 1.256 * values.nasal_polyps
      + 0.175 * values.gina_step
      - 0.764 * values.female
      + 0.441 * values.breathing_pattern_disorder
      + 0.681 * values.current_smoking
      - 0.401 * (values.mmef_percent_predicted / 10)
    );
  }

  function mmefProbability(values) {
    return logistic(mmefLinearPredictor(values));
  }

  return Object.freeze({
    logistic,
    clinicalLinearPredictor,
    clinicalProbability,
    mmefLinearPredictor,
    mmefProbability,
  });
});
