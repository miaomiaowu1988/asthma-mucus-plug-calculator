import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
const {chromium}=require('playwright');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const url=process.argv[2] || pathToFileURL(path.join(root,'docs/index.html')).href;
const online=url.startsWith('http');
const out=path.join(root,'test_artifacts',online?'online':'local'); fs.mkdirSync(out,{recursive:true});
const lines=fs.readFileSync(path.join(root,'tests/calculator_test_cases.csv'),'utf8').trim().split(/\r?\n/);
const headers=lines.shift().split(',');
const cases=lines.map(line=>Object.fromEntries(line.split(',').map((v,i)=>[headers[i],Number(v)])));
const browser=await chromium.launch({channel:'chrome',headless:true});
const errors=[],requests=[],results=[],edges=[];
const context=await browser.newContext({viewport:{width:1366,height:900}});
const page=await context.newPage();
page.on('pageerror',error=>errors.push(error.message));
page.on('console',msg=>{if(msg.type()==='error') errors.push(msg.text());});
page.on('request',req=>requests.push({url:req.url(),type:req.resourceType()}));
async function fill(x) {
  await page.locator('#ed-days').fill(String(x.ed_patient_days));
  await page.locator('#gina-step').selectOption(String(x.gina_step));
  await page.locator(`input[name="nasal_polyps"][value="${x.nasal_polyps}"]`).check({force:true});
  await page.locator(`input[name="female"][value="${x.female}"]`).check({force:true});
  await page.locator('#heart-rate').fill(String(x.heart_rate_bpm));
  await page.locator('#smoking-status').selectOption(String(x.current_smoking));
  await page.locator('#mmef').fill(x.mmef_percent_predicted===null?'':String(x.mmef_percent_predicted));
}
async function click() {await page.locator('#calculate-button').click();}
async function probabilities() {
  return page.evaluate(()=>['clinical-probability','mmef-probability'].map(id=>{
    const el=document.getElementById(id);return {raw:el.dataset.probability===undefined?null:Number(el.dataset.probability),text:el.textContent};
  }));
}
try {
  await page.goto(url,{waitUntil:'networkidle'});
  assert.equal(await page.locator('h1').textContent(),'Mucus Plug Burden Research Calculator');
  assert.equal(await page.locator('#about-model').count(),1);
  assert.equal(await page.locator('footer p').count(),2);
  assert.equal(await page.locator('#mmef').inputValue(),'');
  await click(); assert.ok(await page.locator('#form-summary-error').isVisible()); edges.push('All missing inputs rejected');
  for(const x of cases) {
    await fill(x); await click(); const [a,b]=await probabilities();
    const error=Math.max(Math.abs(a.raw-x.python_clinical_probability),Math.abs(b.raw-x.python_clinical_mmef_probability));
    assert.ok(a.raw!==null&&b.raw!==null&&error<1e-10,`Case ${x.case_id}: ${error}`);
    for(const p of [a,b]) {assert.ok(p.raw>=0&&p.raw<=1);assert.equal(p.text,(p.raw*100).toFixed(1)+'%');}
    results.push({...x,browser_clinical_probability:a.raw,browser_clinical_mmef_probability:b.raw,absolute_error:error,PASS:true});
  }
  const last=await probabilities();for(let i=0;i<5;i++) await click();assert.deepEqual(await probabilities(),last);edges.push('Repeated clicks stable');
  await fill({...cases[0],mmef_percent_predicted:null});await click();let p=await probabilities();assert.ok(p[0].raw!==null&&p[1].raw===null);edges.push('Missing MMEF: clinical only');
  await page.locator('#mmef').fill('-1');await click();p=await probabilities();assert.ok(p[0].raw!==null&&p[1].raw===null);assert.ok(await page.locator('#mmef-error').isVisible());edges.push('Negative MMEF rejected, clinical available');
  for(const [id,value] of [['ed-days','-1'],['ed-days','1.5'],['heart-rate','0'],['heart-rate','-5'],['heart-rate','']]) {
    await fill(cases[0]);await page.locator('#'+id).fill(value);await click();assert.equal((await probabilities())[0].raw,null);edges.push(id+'='+JSON.stringify(value)+' rejected');
  }
  // Text-type injection verifies JS validation independently of HTML number controls.
  for(const id of ['ed-days','heart-rate','mmef']) {
    await fill(cases[0]);await page.locator('#'+id).evaluate(el=>el.type='text');await page.locator('#'+id).fill('abc');await click();
    p=await probabilities();assert.equal(p[id==='mmef'?1:0].raw,null);await page.locator('#'+id).evaluate(el=>el.type='number');edges.push(id+' nonnumeric rejected');
  }
  await fill({...cases[0],ed_patient_days:1000,mmef_percent_predicted:201});await click();assert.ok((await probabilities())[1].raw!==null);edges.push('Large valid inputs not clipped');
  await page.locator('#reset-button').click();assert.equal((await probabilities())[0].raw,null);assert.equal(await page.locator('#heart-rate').inputValue(),'');edges.push('Reset clears inputs/results');
  await fill(cases[3]);await click();assert.ok((await probabilities())[0].raw!==null);edges.push('Recalculate after Reset');
  await page.reload({waitUntil:'networkidle'});assert.equal((await probabilities())[0].raw,null);assert.equal(await page.locator('#mmef').inputValue(),'');
  await fill(cases[5]);await click();assert.ok(Math.abs((await probabilities())[0].raw-cases[5].python_clinical_probability)<1e-10);edges.push('Refresh clears stale results and calculation still works');
  await page.goto('about:blank');await page.goto(url,{waitUntil:'networkidle'});assert.equal((await probabilities())[0].raw,null);
  await fill(cases[8]);await click();assert.ok(Math.abs((await probabilities())[1].raw-cases[8].python_clinical_mmef_probability)<1e-10);edges.push('Reopen page and calculate');
  const layouts=[];
  for(const viewport of [{width:1366,height:900},{width:390,height:844},{width:320,height:740}]) {
    await page.setViewportSize(viewport);await fill(cases[7]);await click();
    const layout=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,ed:document.getElementById('ed-days').getBoundingClientRect().width}));
    assert.ok(layout.scroll<=layout.width);assert.equal(layout.ed,170);layouts.push(layout);
    await page.screenshot({path:path.join(out,`viewport-${viewport.width}.png`),fullPage:true});
    await page.locator('#about-model summary').click();
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await page.screenshot({path:path.join(out,`about-${viewport.width}.png`),fullPage:true});
    await page.locator('#about-model summary').click();
  }
  assert.equal(await page.locator('#calculation-error').isVisible(),false);
  assert.equal(await page.locator('a[href="https://github.com/research-jay/asthma-mucus-plug-calculator"]').count(),1);
  assert.deepEqual(errors,[]);assert.ok(requests.every(r=>r.type==='document'));
  const head=Object.keys(results[0]);fs.writeFileSync(path.join(out,'browser_validation.csv'),[head.join(','),...results.map(r=>head.map(k=>r[k]).join(','))].join('\n')+'\n');
  const report={url,pass:true,cases:results.length,max_error:Math.max(...results.map(r=>r.absolute_error)),edges,layouts,errors,requests,modelVersion:await page.evaluate(()=>ModelParameters.version)};
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
} finally {await browser.close();}
