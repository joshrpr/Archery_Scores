const {test,expect}=require('@playwright/test');
const {createServer}=require('node:http');
const {readFile}=require('node:fs/promises');
const {resolve,extname,sep}=require('node:path');
const {createHash}=require('node:crypto');
const fs=require('node:fs');
test.use({baseURL:'http://127.0.0.1:4184',serviceWorkers:'allow'});
const root=resolve(__dirname,'../ibo-scorer');
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml','.ttf':'font/ttf','.webmanifest':'application/manifest+json'};
let server,revision=0,failDownload=false,failedRequests=0,revisionResponses=0;
test.beforeAll(async()=>{
  // HTTP fixture changes responses, never the production files or app internals.
  server=createServer(async(req,res)=>{
    try{
      const url=new URL(req.url,'http://127.0.0.1:4184');
      const file=resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));
      if(!file.startsWith(root+sep)){res.writeHead(403).end();return;}
      if(failDownload&&url.pathname==='/icons/maskable-512.png'){failedRequests++;res.writeHead(503).end('Temporary download failure');return;}
      let bytes=await readFile(file);
      if(extname(file)==='.css')bytes=Buffer.concat([bytes,Buffer.from(`\n/* delivery revision ${revision} */\n`)]);
      if(revision===1)revisionResponses++;
      res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream','Cache-Control':'no-store'}).end(bytes);
    }catch{res.writeHead(404).end('Not found');}
  });
  await new Promise(resolve=>server.listen(4184,'127.0.0.1',resolve));
});
test.afterAll(async()=>{await new Promise(resolve=>server.close(resolve));});
test.beforeEach(()=>{revision=0;failDownload=false;failedRequests=0;revisionResponses=0;});
async function controlled(page){
  await page.goto('/');
  await page.evaluate(()=>navigator.serviceWorker.ready);
  await expect.poll(()=>page.evaluate(()=>!!navigator.serviceWorker.controller)).toBe(true);
  await page.reload();
}
async function style(page){return page.evaluate(()=>fetch('velocity-base.css').then(r=>r.text()));}
async function checkUpdate(page){await page.evaluate(()=>window.dispatchEvent(new Event('online')));}

test('offline reload keeps Ranch Horizon, local display fonts, navigation and saved round data available',async({page,context})=>{
  const db={archers:[{id:'range',name:'Ranch archer',createdAt:1}],rounds:[{id:'offline',type:'ibo',status:'in_progress',targets:3,current:1,createdAt:1,archerIds:['range'],scores:{range:[11,null,null]}}]};
  await page.addInitScript(db=>{if(!localStorage.getItem('ibo-scorer-v1'))localStorage.setItem('ibo-scorer-v1',JSON.stringify(db));},db);
  await controlled(page);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('button',{name:/Resume IBO 3D/})).toContainText('11 points');
  expect(await page.evaluate(()=>{const image=document.querySelector('img[src="icons/ranch-horizon.svg"]');return image&&image.complete&&image.naturalWidth>0;})).toBe(true);
  expect(await page.evaluate(async()=>{await document.fonts.load('italic 500 32px Newsreader');return document.fonts.check('italic 500 32px Newsreader');})).toBe(true);
  expect(await page.getByRole('img',{name:'The ranch aerial',exact:true}).evaluate(image=>image.complete&&image.naturalWidth>0)).toBe(true);
  for(const asset of ['icons/ranch-aerial.svg','icons/favicon-32.png','icons/icon-192.png','icons/maskable-512.png','fonts/Newsreader.ttf','fonts/Newsreader-Italic.ttf']){
    const actual=await page.evaluate(async asset=>{const r=await fetch(asset);if(!r.ok)throw new Error(asset+' offline unavailable');return [...new Uint8Array(await crypto.subtle.digest('SHA-256',await r.arrayBuffer()))].map(b=>b.toString(16).padStart(2,'0')).join('');},asset);
    expect(actual).toBe(createHash('sha256').update(fs.readFileSync(resolve(root,asset))).digest('hex'));
  }
  for (const asset of ['surface-transition.js','surface-transition.css']) {
    const actual=await page.evaluate(async asset=>{const r=await fetch(asset);if(!r.ok)throw new Error(asset+' unavailable offline');return r.text();},asset);
    expect(actual).toBe(fs.readFileSync(resolve(root,asset),'utf8') + (asset.endsWith('.css') ? '\n/* delivery revision 0 */\n' : ''));
  }
  await page.getByRole('button',{name:/Resume IBO 3D/}).click();
  await expect(page).toHaveURL(/#\/round\/offline$/);
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('ibo-scorer-v1')))).toEqual(db);
});

test('failed downloads preserve the complete cached version and a later update waits for the active celebration',async({page})=>{
  const db={archers:[{id:'a',name:'Ranch archer',createdAt:1}],rounds:[{id:'finish',type:'vegas',status:'in_progress',targets:10,current:9,createdAt:1,archerIds:['a'],scores:{a:Array.from({length:10},()=>[10,9,'X'])}}]};
  await page.addInitScript(db=>{if(!localStorage.getItem('ibo-scorer-v1'))localStorage.setItem('ibo-scorer-v1',JSON.stringify(db));},db);
  await controlled(page);
  expect(await style(page)).toContain('delivery revision 0');
  revision=1;failDownload=true;
  await checkUpdate(page);
  await expect.poll(()=>failedRequests).toBeGreaterThan(0);
  await expect.poll(()=>revisionResponses).toBeGreaterThan(20);
  expect(await style(page)).toContain('delivery revision 0');
  await page.getByRole('button',{name:/Resume Vegas 300/}).click();
  await page.getByRole('button',{name:'Finish round',exact:true}).click();
  await page.getByRole('dialog').getByRole('button',{name:'Finish',exact:true}).click();
  const celebration=page.getByRole('dialog',{name:'Vegas 300 round complete'});
  await expect(celebration).toBeVisible();
  let reloads=0;page.on('request',request=>{if(request.isNavigationRequest()&&request.frame()===page.mainFrame())reloads++;});
  failDownload=false;
  await checkUpdate(page);
  await expect.poll(()=>style(page)).toContain('delivery revision 1');
  await expect(celebration).toBeVisible();
  expect(reloads).toBe(0);
  await page.getByRole('button',{name:'See scorecard',exact:true}).click();
  await expect.poll(()=>reloads).toBe(1);
  await expect(page.getByRole('heading',{name:'Scorecard',exact:true})).toBeVisible();
  expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('ibo-scorer-v1')).rounds[0].status)).toBe('finished');
  expect(await style(page)).toContain('delivery revision 1');
});
