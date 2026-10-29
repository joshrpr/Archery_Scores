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
