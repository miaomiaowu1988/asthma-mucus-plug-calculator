(function (root) {
  'use strict';
  const parameters = typeof module !== 'undefined' && module.exports
    ? require('../model_parameters_final.json') : root.ModelParameters;
  function validate(x) {
    if (!Number.isSafeInteger(x.ed_patient_days) || x.ed_patient_days < 0) throw new RangeError('ED must be a nonnegative integer');
    if (!Number.isInteger(x.gina_step) || x.gina_step < 0 || x.gina_step > 5) throw new RangeError('GINA must be 0-5');
    for (const k of ['nasal_polyps','female','current_smoking']) {
      if (x[k] !== 0 && x[k] !== 1) throw new RangeError(k + ' must be 0 or 1');
    }
    if (!Number.isFinite(x.heart_rate_bpm) || x.heart_rate_bpm <= 0) throw new RangeError('Heart rate must be positive');
  }
  function linearPredictor(x, extended) {
    validate(x);
    if (extended && (!Number.isFinite(x.mmef_percent_predicted) || x.mmef_percent_predicted < 0)) throw new RangeError('MMEF must be nonnegative');
    const values = {
      pre365_ed_log1p: Math.log1p(x.ed_patient_days), nasal_polyps:x.nasal_polyps,
      gina_step:x.gina_step, sex_female:x.female, Heart_rate_bpm:x.heart_rate_bpm,
      smoking_current:x.current_smoking, mmef_percent_pred:x.mmef_percent_predicted
    };
    const model = parameters.models[extended ? 'Clinical + MMEF' : 'Clinical'];
    let lp = model.intercept;
    for (const [key,beta] of Object.entries(model.coefficients)) lp += beta * values[key];
    if (!Number.isFinite(lp)) throw new RangeError('Input magnitude exceeds numeric limits');
    return lp;
  }
  function logistic(lp) {
    if (lp >= 0) return 1 / (1 + Math.exp(-lp));
    const e = Math.exp(lp); return e / (1 + e);
  }
  const api = Object.freeze({clinicalLinearPredictor:x=>linearPredictor(x,false),mmefLinearPredictor:x=>linearPredictor(x,true),
    clinicalProbability:x=>logistic(linearPredictor(x,false)),mmefProbability:x=>logistic(linearPredictor(x,true))});
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.MucusPlugModel = api;
})(globalThis);
