"""Freeze 20 synthetic deterministic cases covering every category."""
import csv
from pathlib import Path
from reference_model import predict
rows=[]
for i in range(20):
    x=dict(ed_patient_days=[0,1,3,10,25][i%5],nasal_polyps=i%2,gina_step=i%6,
           female=(i//2)%2,heart_rate_bpm=[45,60,82,110,155][i%5],current_smoking=(i//3)%2,
           mmef_percent_predicted=[0,10,35,75,150][(i//4)%5])
    rows.append(dict(case_id=i+1,**x,python_clinical_probability=predict(x),python_clinical_mmef_probability=predict(x,True)))
with (Path(__file__).parent/'calculator_test_cases.csv').open('w',newline='',encoding='utf-8') as f:
    writer=csv.DictWriter(f,fieldnames=rows[0]);writer.writeheader();writer.writerows(rows)
print('20 deterministic cases generated')
