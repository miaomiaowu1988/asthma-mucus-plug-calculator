(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  const form = $('calculator-form');
  const clinical = $('clinical-probability'), extended = $('mmef-probability');
  const missingNote = 'Enter post-bronchodilator MMEF to calculate this model.';
  function clearResults() {
    for (const el of [clinical,extended]) { el.textContent='—'; delete el.dataset.probability; }
    $('mmef-result-note').textContent=missingNote;
  }
  function numeric(id) {
    const input=$(id), raw=input.value.trim();
    return raw === '' && !input.validity.badInput ? null : Number(raw || 'NaN');
  }
  function show(el,p) { el.textContent=(p*100).toFixed(1)+'%'; el.dataset.probability=String(p); }
  function calculate() {
    clearResults(); $('calculation-error').hidden=true;
    const x={ed_patient_days:numeric('ed-days'),gina_step:numeric('gina-step'),heart_rate_bpm:numeric('heart-rate'),
      current_smoking:numeric('smoking-status'),mmef_percent_predicted:numeric('mmef')};
    for (const [key,name] of [['nasal_polyps','nasal_polyps'],['female','female']]) {
      const radio=form.querySelector(`input[name="${name}"]:checked`); x[key]=radio ? Number(radio.value) : null;
    }
    const valid = {
      'ed-days':Number.isSafeInteger(x.ed_patient_days)&&x.ed_patient_days>=0,
      'gina-step':Number.isInteger(x.gina_step)&&x.gina_step>=0&&x.gina_step<=5,
      'heart-rate':Number.isFinite(x.heart_rate_bpm)&&x.heart_rate_bpm>0,
      'smoking-status':[0,1].includes(x.current_smoking),'nasal-polyps':[0,1].includes(x.nasal_polyps),'sex':[0,1].includes(x.female)};
    for (const [id,ok] of Object.entries(valid)) {
      $(id+'-error').hidden=ok;
      const control=$(id)||$(id+'-group'); control.setAttribute('aria-invalid',String(!ok));
    }
    const mmefValid=x.mmef_percent_predicted===null || (Number.isFinite(x.mmef_percent_predicted)&&x.mmef_percent_predicted>=0);
    $('mmef-error').hidden=mmefValid; $('mmef').setAttribute('aria-invalid',String(!mmefValid));
    $('form-summary-error').hidden=Object.values(valid).every(Boolean);
    if (!$('form-summary-error').hidden) return;
    try {
      show(clinical,globalThis.MucusPlugModel.clinicalProbability(x));
      if (mmefValid && x.mmef_percent_predicted!==null) {
        show(extended,globalThis.MucusPlugModel.mmefProbability(x)); $('mmef-result-note').textContent='Includes post-bronchodilator MMEF.';
      } else if (!mmefValid) $('mmef-result-note').textContent='Enter a valid nonnegative MMEF value.';
    } catch (_) { clearResults(); $('calculation-error').hidden=false; }
  }
  $('calculate-button').addEventListener('click',event=>{event.preventDefault();calculate();});
  form.addEventListener('submit',event=>{event.preventDefault();calculate();});
  form.addEventListener('input',clearResults); form.addEventListener('change',clearResults);
  form.addEventListener('reset',()=>{
    clearResults(); document.querySelectorAll('.field-error,.form-summary-error').forEach(el=>el.hidden=true);
    document.querySelectorAll('[aria-invalid]').forEach(el=>el.setAttribute('aria-invalid','false'));
  });
  const container=$('equations-content');
  for (const [name,model] of Object.entries(globalThis.ModelParameters?.models || {})) {
    const heading=document.createElement('strong'); heading.textContent=name;
    const equation=document.createElement('code'); equation.className='equation';
    equation.textContent='LP = '+model.intercept+Object.entries(model.coefficients).map(([k,b])=>' '+(b<0?'-':'+')+' '+Math.abs(b)+' × '+k).join('');
    container.append(heading,equation);
  }
})();
