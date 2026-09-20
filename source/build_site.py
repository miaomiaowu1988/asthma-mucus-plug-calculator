"""Generate identical offline-capable root and Pages entry points."""
from pathlib import Path
import json
ROOT = Path(__file__).resolve().parents[1]
def build():
    html = (ROOT/'source/index.template.html').read_text(encoding='utf-8')
    params = json.loads((ROOT/'model_parameters_final.json').read_text(encoding='utf-8'))
    parts = {'/*__MODEL_PARAMETERS__*/':'globalThis.ModelParameters = '+json.dumps(params)+';',
             '/*__MODEL_ENGINE__*/':(ROOT/'source/model_engine.js').read_text(encoding='utf-8'),
             '/*__CALCULATOR_UI__*/':(ROOT/'source/calculator_ui.js').read_text(encoding='utf-8')}
    for marker,value in parts.items():
        assert html.count(marker)==1, marker
        html=html.replace(marker,value)
    for path in [ROOT/'index.html',ROOT/'docs/index.html']:
        path.parent.mkdir(exist_ok=True)
        path.write_text(html,encoding='utf-8',newline='\n')
    return ROOT/'docs/index.html'
if __name__=='__main__': print(build())
