"""Independent Python probability reference; no fitting or imputation."""
import json, math
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
PARAMETERS=json.loads((ROOT/'model_parameters_final.json').read_text(encoding='utf-8'))
def predict(values, extended=False):
    ed=values['ed_patient_days']; gina=values['gina_step']; hr=values['heart_rate_bpm']
    if not isinstance(ed,int) or isinstance(ed,bool) or not 0<=ed<=2**53-1: raise ValueError('ED integer')
    if not isinstance(gina,int) or not 0<=gina<=5: raise ValueError('GINA 0-5')
    if not isinstance(hr,(int,float)) or not math.isfinite(hr) or hr<=0: raise ValueError('HR positive')
    for k in ['nasal_polyps','female','current_smoking']:
        if values[k] not in (0,1): raise ValueError(k)
    mmef=values.get('mmef_percent_predicted')
    if extended and (not isinstance(mmef,(int,float)) or not math.isfinite(mmef) or mmef<0): raise ValueError('MMEF nonnegative')
    x=dict(pre365_ed_log1p=math.log1p(ed),nasal_polyps=values['nasal_polyps'],gina_step=gina,
           sex_female=values['female'],Heart_rate_bpm=hr,smoking_current=values['current_smoking'],mmef_percent_pred=mmef)
    m=PARAMETERS['models']['Clinical + MMEF' if extended else 'Clinical']
    lp=m['intercept']
    for k,beta in m['coefficients'].items(): lp+=beta*x[k]
    if not math.isfinite(lp): raise ValueError('Numeric limits')
    return 1/(1+math.exp(-lp)) if lp>=0 else math.exp(lp)/(1+math.exp(lp))
def predict_clinical(**values): return predict(values)
def predict_clinical_mmef(**values): return predict(values,True)
