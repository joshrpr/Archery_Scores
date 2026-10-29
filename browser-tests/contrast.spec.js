const {test,expect}=require('@playwright/test');
// Contrast is measured from rendered foregrounds and their visible backdrops.
async function contrast(locator){return locator.evaluate(el=>{const rgb=s=>(s.match(/[\d.]+/g)||[]).map(Number);const lum=a=>a.slice(0,3).map(x=>x/255).map(x=>x<=.04045?x/12.92:((x+.055)/1.055)**2.4).reduce((n,x,i)=>n+x*[.2126,.7152,.0722][i],0);let bg,at=el;while(at){bg=rgb(getComputedStyle(at).backgroundColor);if(bg.length<4||bg[3]===1)break;at=at.parentElement;}const a=lum(rgb(getComputedStyle(el).color)),b=lum(bg);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);});}
test('saved notes and plotted gold, red, blue and miss scores remain readable on their actual surfaces',async({page})=>{
  const rounds=[{id:'past',type:'ibo',status:'finished',targets:1,current:0,createdAt:1,finishedAt:2,archerIds:['a'],scores:{a:[11]},note:'Practice note'},{id:'plot',type:'vegas',status:'in_progress',targets:10,current:0,createdAt:2,archerIds:['a'],scores:{a:[[10,8,6],...Array.from({length:9},()=>[null,null,null])]},plots:{a:[[{x:0,y:0},{x:4,y:0},{x:8,y:0}],...Array.from({length:9},()=>[null,null,null])]}}];
  await page.addInitScript(db=>localStorage.setItem('ibo-scorer-v1',JSON.stringify(db)),{archers:[{id:'a',name:'Riley',createdAt:1}],rounds});
  await page.goto('/');
  const note=page.getByText('Practice note',{exact:true});await expect(note).toBeVisible();expect(await contrast(note)).toBeGreaterThanOrEqual(4.5);
  await page.getByRole('button',{name:/Resume Vegas 300/}).click();
  await page.getByRole('button',{name:'Plot arrows on the target',exact:true}).click();
  const end=page.getByLabel('Riley, end 1: 10, 8, 6',{exact:true});
  for(const value of ['10','8','6'])expect(await contrast(end.getByText(value,{exact:true}))).toBeGreaterThanOrEqual(4.5);
  expect(await contrast(page.getByRole('button',{name:'Undo arrow 3, 6'}).getByText('6',{exact:true}))).toBeGreaterThanOrEqual(4.5);
  await page.getByRole('button',{name:'Next end',exact:true}).click();
  await page.getByRole('button',{name:'Miss',exact:true}).click();
  expect(await contrast(page.getByLabel(/^Riley, end 2:/).getByText('M',{exact:true}))).toBeGreaterThanOrEqual(4.5);
});
test('native update action meets touch size and remains readable while hovered and pressed',async({page})=>{
  await page.addInitScript(()=>{window.Capacitor={isNativePlatform:()=>true,Plugins:{App:{getInfo:async()=>({build:'1'}),addListener:async()=>({remove(){}})}}};});
  await page.route('https://api.github.com/repos/joshrpr/Archery_Scores/releases/latest',route=>route.fulfill({contentType:'application/json',body:JSON.stringify({tag_name:'android-99999'})}));
  await page.goto('/');
  const update=page.getByRole('link',{name:'Get it',exact:true});await expect(update).toBeVisible();
  expect((await update.boundingBox()).height).toBeGreaterThanOrEqual(44);
  expect(await contrast(update)).toBeGreaterThanOrEqual(4.5);
  await update.hover();expect(await contrast(update)).toBeGreaterThanOrEqual(4.5);
  await page.mouse.down();expect(await contrast(update)).toBeGreaterThanOrEqual(4.5);
  await page.mouse.move(0,0);await page.mouse.up();
});
