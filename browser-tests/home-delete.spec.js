const {test,expect}=require('@playwright/test');
const key='ibo-scorer-v1';
const db={archers:[{id:'a',name:'Avery',createdAt:1},{id:'b',name:'Morgan',createdAt:1}],rounds:[
  {id:'v',type:'vegas',createdAt:3,status:'in_progress',targets:10,current:1,archerIds:['a'],scores:{a:[[10,'X',9],...Array.from({length:9},()=>[null,null,null])]}},
  {id:'g',type:'ibo',createdAt:2,status:'in_progress',targets:3,current:1,archerIds:['a','b'],scores:{a:[11,null,null],b:[8,null,null]}},
  {id:'f',type:'ibo',createdAt:1,status:'finished',targets:1,current:0,archerIds:['a'],scores:{a:[10]}}
]};
test.beforeEach(async({page})=>{
  await page.addInitScript(({key,db})=>{if(!localStorage.getItem(key))localStorage.setItem(key,JSON.stringify(db));},{key,db});
  await page.goto('/');
});
const stored=page=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
test('Home options identify the unfinished group, cancel safely, and delete only that round durably',async({page})=>{
  await expect(page.getByRole('button',{name:/Options for/})).toHaveCount(2);
  await page.getByRole('button',{name:/Options for IBO 3D/}).click();
  const dialog=page.getByRole('dialog',{name:'Delete unfinished round?',exact:true});
  await expect(dialog).toContainText('Avery, Morgan');
  await expect(dialog).toContainText('every archer');
  await expect(dialog.getByRole('button',{name:'Cancel',exact:true})).toBeFocused();
  await page.keyboard.press('Escape');
  expect(await stored(page)).toEqual(db);
  await page.getByRole('button',{name:/Options for IBO 3D/}).click();
  await dialog.getByRole('button',{name:'Delete round',exact:true}).click();
  await expect(page.getByRole('button',{name:/Resume IBO 3D/})).toHaveCount(0);
  expect((await stored(page)).rounds).toEqual(db.rounds.filter(r=>r.id!=='g'));
  await page.reload();
  await expect(page.getByRole('button',{name:/Resume Vegas 300/})).toBeVisible();
  await expect(page.getByRole('region',{name:'Recent rounds'})).toContainText('10');
  await expect(page.getByRole('button',{name:/Resume IBO 3D/})).toHaveCount(0);
  await page.getByRole('button',{name:/Options for Vegas 300/}).click();
  await page.getByRole('dialog').getByRole('button',{name:'Delete round',exact:true}).click();
  await expect(page.getByRole('heading',{name:'Make your next round count.',exact:true})).toBeFocused();
  await expect(page.getByRole('button',{name:/Options for/})).toHaveCount(0);
  expect(await stored(page)).toEqual({...db,rounds:[db.rounds[2]]});
});
test('long press opens one confirmation without resuming; moving the pointer cancels the gesture',async({page})=>{
  const card=page.getByRole('button',{name:/Resume Vegas 300/});
  await card.scrollIntoViewIfNeeded();
  let box=await card.boundingBox();
  await page.mouse.move(box.x+40,box.y+40);await page.mouse.down();
  await page.waitForTimeout(650);
  await expect(page.getByRole('dialog',{name:'Delete unfinished round?',exact:true})).toHaveCount(1);
  await page.mouse.up();
  await expect(page.locator('#app')).toHaveAttribute('data-page','home');
  await page.getByRole('button',{name:'Cancel',exact:true}).click();
  expect(await stored(page)).toEqual(db);
  await card.scrollIntoViewIfNeeded();box=await card.boundingBox();
  await page.mouse.move(box.x+40,box.y+40);await page.mouse.down();
  await page.mouse.move(box.x+40,box.y+80);
  await page.waitForTimeout(650);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.mouse.up();
  await expect(page.locator('#app')).toHaveAttribute('data-page','round');
});
test('failed deletion retains the round and its scores in memory and storage',async({page})=>{
  await page.getByRole('button',{name:/Options for Vegas 300/}).click();
  await page.evaluate(()=>{Storage.prototype.setItem=()=>{throw new DOMException('Full','QuotaExceededError');};});
  page.once('dialog',dialog=>dialog.dismiss());
  await page.getByRole('dialog').getByRole('button',{name:'Delete round',exact:true}).click();
  await expect(page.getByRole('button',{name:/Resume Vegas 300/})).toContainText('29 points');
  expect(await stored(page)).toEqual(db);
  await page.getByRole('button',{name:/Resume Vegas 300/}).click();
  await expect(page.locator('.running-total')).toContainText('29');
});
test('keyboard options and Android-style context menu remain usable at enlarged text',async({page})=>{
  await page.evaluate(()=>document.documentElement.style.fontSize='200%');
  const options=page.getByRole('button',{name:/Options for Vegas 300/});
  await options.focus();await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog',{name:'Delete unfinished round?',exact:true})).toBeVisible();
  await page.keyboard.press('Escape');await expect(options).toBeFocused();
  await page.getByRole('button',{name:/Resume Vegas 300/}).click({button:'right'});
  await expect(page.getByRole('dialog',{name:'Delete unfinished round?',exact:true})).toHaveCount(1);
  await page.getByRole('button',{name:'Cancel',exact:true}).click();
  expect(await stored(page)).toEqual(db);
});
