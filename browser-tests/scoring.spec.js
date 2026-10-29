const {test, expect} = require('@playwright/test');
const key='ibo-scorer-v1';
const archerName='Alexandra Mountain Ridge Longbow';
function fixture(type='vegas') {
  return {archers:[{id:'a',name:archerName},{id:'b',name:'Morgan'}],rounds:[{
    id:'session',type,targets:type==='vegas'?10:3,current:0,status:'in_progress',createdAt:1,
    archerIds:['a','b'],scores:type==='vegas'?{a:Array.from({length:10},()=>[null,null,null]),b:Array.from({length:10},()=>[null,null,null])}:{a:[null,null,null],b:[null,null,null]}
  }]};
}
async function open(page,type='vegas') {
  await page.addInitScript(({key,data})=>{if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(data));},{key,data:fixture(type)});
  await page.goto('/#/round/session');
}
const saved = page=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)).rounds[0],key);
test('group Vegas entry preserves X, numeric ten and miss, corrects the actual slot, and keeps keyboard progression usable',async({page})=>{
  await open(page);
  const alex=page.getByRole('region',{name:archerName,exact:true});
  const morgan=page.getByRole('region',{name:'Morgan',exact:true});
  const next=page.getByRole('button',{name:'Next end',exact:true});
  await expect(next).toBeDisabled();
  await alex.getByRole('button',{name:'X',exact:true}).focus();
  await page.keyboard.press('Enter');
  await expect(alex.getByRole('button',{name:'X',exact:true})).toBeFocused();
  await expect(page.getByRole('status')).toContainText('Arrow 1: X');
  await alex.getByRole('button',{name:'10',exact:true}).click();
  await alex.getByRole('button',{name:'Miss',exact:true}).click();
  expect((await saved(page)).scores.a[0]).toEqual(['X',10,0]);
  await expect(alex).toContainText('1 Xs');
  await expect(alex.getByRole('button',{name:'Arrow 2: 10. Tap to clear',exact:true})).toBeVisible();
  await alex.getByRole('button',{name:'Arrow 2: 10. Tap to clear',exact:true}).focus();
  await page.keyboard.press('Enter');
  await expect(alex.getByRole('button',{name:'X',exact:true})).toBeFocused();
  await alex.getByRole('button',{name:'9',exact:true}).click();
  await expect(alex.getByRole('button',{name:'Arrow 2: 9. Tap to clear',exact:true})).toBeVisible();
  for(const value of ['10','10','Miss'])await morgan.getByRole('button',{name:value,exact:true}).click();
  await expect(next).toBeEnabled();
  await next.focus();await page.keyboard.press('Enter');
  await expect(page.getByRole('heading',{name:/End 2/})).toBeVisible();
  await expect(alex.getByRole('button',{name:'X',exact:true})).toBeFocused();
  await page.getByRole('button',{name:'Previous end',exact:true}).click();
  await page.getByRole('button',{name:'Scorecard',exact:true}).click();
  const standings=page.getByRole('table',{name:'Standings'});
  await expect(standings.getByRole('row').filter({hasText:archerName})).toContainText('19');
  await expect(standings.getByRole('row').filter({hasText:'Morgan'})).toContainText('20');
  await page.reload();
  await expect(standings.getByRole('row').filter({hasText:archerName})).toContainText('19');
});
test('IBO scores retain toggle correction, all values, unrestricted targets and shared standings',async({page})=>{
  await open(page,'ibo');
  const alex=page.getByRole('region',{name:archerName,exact:true}),morgan=page.getByRole('region',{name:'Morgan',exact:true});
  await alex.getByRole('button',{name:'11',exact:true}).focus();await page.keyboard.press('Enter');
  await expect(alex.getByRole('button',{name:'11',exact:true})).toBeFocused();
  await page.keyboard.press('Enter');
  expect((await saved(page)).scores.a[0]).toBeNull();
  for(const value of ['8','5','Miss','10']) await alex.getByRole('button',{name:value,exact:true}).click();
  await morgan.getByRole('button',{name:'10',exact:true}).click();
  await page.getByRole('button',{name:'Next target',exact:true}).click();
  await page.getByRole('button',{name:'Next target',exact:true}).click();
  await expect(page.getByRole('heading',{name:/Target 3/})).toBeVisible();
  await page.getByRole('button',{name:'+ Add target',exact:true}).click();
  await expect(page.getByRole('heading',{name:/Target 4/})).toBeVisible();
  await page.getByRole('button',{name:'− Target',exact:true}).click();
  await page.getByRole('button',{name:'Scorecard',exact:true}).click();
  const standings=page.getByRole('table',{name:'Standings'});
  for(const name of [archerName,'Morgan']) await expect(standings.getByRole('row').filter({hasText:name}).getByRole('cell').first()).toHaveText('1');
  expect((await saved(page)).scores).toEqual({a:[10,null,null],b:[10,null,null]});
});
test('plotting selects the real group archer, preserves measured positions and clears only the corrected arrow',async({page})=>{
  await open(page);
  await page.getByRole('button',{name:'Plot arrows on the target',exact:true}).click();
  const morgan=page.getByRole('button',{name:'Morgan',exact:true});
  await morgan.click();
  await expect(morgan).toHaveAttribute('aria-pressed','true');
  const target=page.getByRole('img',{name:'Target face for Morgan, end 1',exact:true});
  const bounds=await target.boundingBox();
  await target.click({position:{x:bounds.width/2,y:bounds.height/2}});
  await expect(page.getByRole('region',{name:'Morgan',exact:true}).getByRole('button',{name:'Arrow 1: X. Tap to clear',exact:true})).toBeVisible();
  let round=await saved(page);expect(round.scores.b[0]).toEqual(['X',null,null]);
  expect(round.plots.b[0][0].x).toBeCloseTo(0,1);expect(round.plots.b[0][0].y).toBeCloseTo(0,1);
  await page.reload();
  await expect(morgan).toHaveAttribute('aria-pressed','true');
  await page.getByRole('region',{name:'Morgan',exact:true}).getByRole('button',{name:'10',exact:true}).click();
  round=await saved(page);expect(round.plots.b[0][0]).not.toBeNull();expect(round.plots.b[0][1]).toBeNull();
  await page.getByRole('region',{name:'Morgan',exact:true}).getByRole('button',{name:'Arrow 1: X. Tap to clear',exact:true}).click();
  round=await saved(page);expect(round.scores.b[0]).toEqual([null,10,null]);expect(round.plots.b[0][0]).toBeNull();
});
for(const reducedMotion of ['no-preference','reduce']) test('rapid scores and interrupted entry remain saved with '+reducedMotion+' motion',async({page})=>{
  await page.emulateMedia({reducedMotion});await open(page);
  const alex=page.getByRole('region',{name:archerName,exact:true});
  for(const value of ['X','10','Miss'])await alex.getByRole('button',{name:value,exact:true}).click();
  await alex.getByRole('button',{name:'Arrow 1: X. Tap to clear',exact:true}).click();
  await alex.getByRole('button',{name:'9',exact:true}).click();
  await page.emulateMedia({reducedMotion:reducedMotion==='reduce'?'no-preference':'reduce'});
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:false});document.dispatchEvent(new Event('visibilitychange'));});
  await page.getByRole('button',{name:'Scorecard',exact:true}).click();
  await expect(page.getByRole('status')).toHaveText('');
  await page.getByRole('button',{name:'Back to scoring',exact:true}).click();
  await expect(alex.getByRole('button',{name:'Arrow 1: 9. Tap to clear',exact:true})).toBeVisible();
  expect((await saved(page)).scores.a[0]).toEqual([9,10,0]);
  await page.reload();
  await expect(alex).toContainText('0 Xs');
  expect((await saved(page)).scores.a[0]).toEqual([9,10,0]);
});
test('a failed score save gives recovery feedback without claiming the value was saved',async({page})=>{
  await open(page);
  await page.evaluate(()=>{Storage.prototype.setItem=()=>{throw new Error('full');};});
  page.once('dialog',dialog=>dialog.accept());
  await page.getByRole('region',{name:archerName,exact:true}).getByRole('button',{name:'X',exact:true}).click();
  await expect(page.getByRole('status')).toContainText('could not save');
  expect((await saved(page)).scores.a[0]).toEqual([null,null,null]);
});
test('scoring a lower group archer keeps their entry controls in view',async({page})=>{
  await page.setViewportSize({width:320,height:568});
  await open(page);
  const key=page.getByRole('region',{name:'Morgan',exact:true}).getByRole('button',{name:'X',exact:true});
  await key.click();
  const box=await key.boundingBox();
  expect(box.y).toBeGreaterThanOrEqual(0);expect(box.y+box.height).toBeLessThanOrEqual(568);
});
test('enlarged short-screen completion keeps standings and the scorecard exit reachable',async({page})=>{
  await page.setViewportSize({width:320,height:568});await page.emulateMedia({reducedMotion:'reduce'});
  const data=fixture();for(const [i,name]of ['Jordan McAllister','Taylor West','Jamie'].entries())data.archers.push({id:'c'+i,name});const round=data.rounds[0];round.current=9;round.archerIds=data.archers.map(a=>a.id);
  for(const aid of round.archerIds)round.scores[aid]=Array.from({length:10},()=>[10,9,'X']);
  await page.addInitScript(({key,data})=>localStorage.setItem(key,JSON.stringify(data)),{key,data});await page.goto('/#/round/session');
  await page.evaluate(()=>{document.documentElement.style.fontSize='34px';document.body.style.fontSize='34px';});
  await page.getByRole('button',{name:'Finish round',exact:true}).click();
  await page.getByRole('dialog').getByRole('button',{name:'Finish',exact:true}).click();
  const completion=page.getByRole('dialog',{name:'Vegas 300 round complete'});
  await expect(completion.getByRole('table')).toContainText('Morgan');
  await completion.getByRole('button',{name:'See scorecard',exact:true}).click({timeout:3000});
  await expect(page.getByRole('heading',{name:'Scorecard',exact:true})).toBeVisible();
});
