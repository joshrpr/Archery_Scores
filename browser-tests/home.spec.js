const { test, expect } = require('@playwright/test');
const key = 'ibo-scorer-v1';
const db = {
  archers: [{id:'a',name:'Avery Ridge',createdAt:1},{id:'b',name:'Morgan Longbow',createdAt:1}],
  rounds: [
    {id:'vegas',type:'vegas',createdAt:1793145600000,status:'in_progress',targets:10,current:1,archerIds:['a'],scores:{a:[[10,'X',9],...Array.from({length:9},()=>[null,null,null])]}},
    {id:'ibo',type:'ibo',createdAt:1793059200000,status:'in_progress',targets:3,current:1,archerIds:['a','b'],scores:{a:[11,null,null],b:[8,null,null]}},
    {id:'past',type:'ibo',createdAt:1792972800000,finishedAt:1792976400000,status:'finished',targets:3,current:2,archerIds:['b'],scores:{b:[11,10,8]}}
  ]
};
test('Home exposes real unfinished groups and recent totals through the main navigation without changing saved scores', async ({page}) => {
  await page.addInitScript(({key,db})=>localStorage.setItem(key,JSON.stringify(db)), {key,db});
  await page.goto('/');
  const open = page.getByRole('region',{name:'Unfinished rounds'});
  await expect(open.getByRole('button',{name:/Resume Vegas 300/})).toContainText('29 points');
  await expect(open.getByRole('button',{name:/Resume Vegas 300/})).toContainText('1 Xs');
  await expect(open.getByRole('button',{name:/Resume IBO 3D/})).toContainText('Morgan Longbow');
  await expect(open.getByRole('button',{name:/Resume IBO 3D/})).toContainText('8 points');
  const recent = page.getByRole('region',{name:'Recent rounds'});
  await expect(recent.getByRole('button',{name:/IBO 3D/})).toContainText('29');
  await open.getByRole('button',{name:/Resume IBO 3D/}).click();
  await expect(page).toHaveURL(/#\/round\/ibo$/);
  await page.getByRole('button',{name:'Back',exact:true}).click();
  await page.getByRole('navigation',{name:'Main navigation'}).getByRole('button',{name:'History',exact:true}).click();
  await expect(page).toHaveURL(/#\/history$/);
  await expect(page.getByRole('navigation',{name:'Main navigation'}).getByRole('button',{name:'History',exact:true})).toHaveAttribute('aria-current','page');
  await page.getByRole('navigation',{name:'Main navigation'}).getByRole('button',{name:'Analytics',exact:true}).click();
  await expect(page).toHaveURL(/#\/stats$/);
  await page.getByRole('navigation',{name:'Main navigation'}).getByRole('button',{name:'Archers',exact:true}).click();
  await expect(page).toHaveURL(/#\/archers$/);
  await page.getByRole('navigation',{name:'Main navigation'}).getByRole('button',{name:'Home',exact:true}).click();
  await page.getByRole('button',{name:'Backup and export',exact:true}).first().click();
  await expect(page.getByRole('button',{name:'Save backup file',exact:true})).toBeVisible();
  await expect(page.getByText('Restore from backup file',{exact:true})).toBeVisible();
  expect(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key)).toEqual(db);
});

test('empty Home starts a real round and recent history opens the stored scorecard', async ({page}) => {
  await page.goto('/');
  await expect(page.getByText('Finished rounds will appear here.',{exact:false})).toBeVisible();
  await expect(page.getByRole('region',{name:'Unfinished rounds'})).toHaveCount(0);
  await page.getByRole('button',{name:'Start new round',exact:true}).click();
  await expect(page.getByRole('heading',{name:'New round',exact:true})).toBeVisible();
  await expect(page.getByRole('navigation',{name:'Main navigation'})).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Start round',exact:true})).toBeDisabled();
  await page.getByRole('textbox',{name:'New archer name',exact:true}).fill('First Archer');
  await page.getByRole('button',{name:'Add',exact:true}).click();
  await expect(page.getByRole('button',{name:/First Archer/})).toHaveAttribute('aria-pressed','true');
  await expect(page.getByRole('button',{name:'Start round with 1 archer',exact:true})).toBeEnabled();
  await page.getByRole('button',{name:'Back',exact:true}).click();
  await page.evaluate(({key,db})=>localStorage.setItem(key,JSON.stringify(db)),{key,db});
  await page.reload();
  await page.getByRole('region',{name:'Recent rounds'}).getByRole('button',{name:/View IBO 3D/}).click();
  await expect(page).toHaveURL(/#\/card\/past$/);
  await expect(page.getByRole('heading',{name:'Scorecard',exact:true})).toBeVisible();
  await expect(page.getByRole('navigation',{name:'Main navigation'}).getByRole('button',{name:'History',exact:true})).toHaveAttribute('aria-current','page');
});

test('keyboard main navigation places focus at the destination heading', async ({page}) => {
  await page.goto('/');
  await page.getByRole('navigation',{name:'Main navigation'}).getByRole('button',{name:'History',exact:true}).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading',{name:'History',exact:true})).toBeFocused();
});

for (const format of ['IBO 3D', 'Vegas 300']) test(`new ${format} rounds start with the first listed active archer already selected`, async ({page}) => {
  const archers = [
    {id:'z',name:'Zoe Ridge',createdAt:1},
    {id:'gone',name:'Aaron Retired',createdAt:2,deleted:true},
    {id:'a',name:'Avery Ridge',createdAt:3}
  ];
  await page.addInitScript(({key,archers})=>localStorage.setItem(key,JSON.stringify({archers,rounds:[]})), {key,archers});
  await page.goto('/');
  await page.getByRole('button',{name:'Start new round',exact:true}).click();
  await expect(page.getByRole('heading',{name:'New round',exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:/Avery Ridge/})).toHaveAttribute('aria-pressed','true');
  await expect(page.getByRole('button',{name:/Zoe Ridge/})).toHaveAttribute('aria-pressed','false');
  await expect(page.getByRole('button',{name:/Aaron Retired/})).toHaveCount(0);
  await page.getByRole('radio',{name:new RegExp(format)}).click();
  await page.getByRole('button',{name:'Start round with 1 archer',exact:true}).click();
  await expect(page).toHaveURL(/#\/round\//);
  const stored = await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
  expect(stored.rounds[0].archerIds).toEqual(['a']);
  expect(stored.rounds[0].type).toBe(format === 'Vegas 300' ? 'vegas' : 'ibo');
});

test('the default archer can be deselected or replaced without being reselected on form updates', async ({page}) => {
  await page.addInitScript(({key,db})=>localStorage.setItem(key,JSON.stringify(db)), {key,db});
  await page.goto('/');
  await page.getByRole('button',{name:'Start new round',exact:true}).click();
  await expect(page.getByRole('heading',{name:'New round',exact:true})).toBeVisible();
  const avery = page.getByRole('button',{name:/Avery Ridge/});
  await expect(avery).toHaveAttribute('aria-pressed','true');
  await avery.click();
  await page.getByRole('radio',{name:/Vegas 300/}).click();
  await expect(avery).toHaveAttribute('aria-pressed','false');
  await expect(page.getByRole('button',{name:'Start round',exact:true})).toBeDisabled();
  await page.getByRole('button',{name:/Morgan Longbow/}).click();
  await page.getByRole('radio',{name:/IBO 3D/}).click();
  await expect(avery).toHaveAttribute('aria-pressed','false');
  await page.getByRole('button',{name:'Start round with 1 archer',exact:true}).click();
  const stored = await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
  expect(stored.rounds.at(-1).archerIds).toEqual(['b']);
  await page.getByRole('button',{name:'Back',exact:true}).click();
  await page.getByRole('button',{name:'Start new round',exact:true}).click();
  await expect(page.getByRole('heading',{name:'New round',exact:true})).toBeVisible();
  await expect(avery).toHaveAttribute('aria-pressed','true');
  await expect(page.getByRole('button',{name:/Morgan Longbow/})).toHaveAttribute('aria-pressed','false');
});
