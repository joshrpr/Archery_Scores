// Throwaway motion study. npm run prototype:transitions; no stored user data.
import {createServer} from 'node:http';
import {readFile, writeFile} from 'node:fs/promises';
import {resolve, extname, sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
const root=fileURLToPath(new URL('../../../',import.meta.url));
const here=fileURLToPath(new URL('./',import.meta.url));
// Render the actual app views with an in-memory sample, without booting its storage or actions.
const noop=()=>{};
const element={setAttribute:noop,appendChild:noop};
const context=vm.createContext({document:{getElementById:()=>element,createElement:()=>element,body:element,addEventListener:noop},window:{addEventListener:noop},navigator:{},localStorage:{getItem:()=>null},matchMedia:()=>({addEventListener:noop}),ResizeObserver:class{},Native:{isApp:false},console});
const source=await readFile(resolve(root,'ibo-scorer/app.js'),'utf8');
vm.runInContext(source.slice(0,source.indexOf('const currentRound =')),context);
const views=vm.runInContext(`
db={archers:[{id:'sample',name:'Sample archer'}],rounds:[{id:'demo',type:'vegas',status:'open',targets:10,current:0,createdAt:new Date('2026-10-30T12:00:00').getTime(),archerIds:['sample'],scores:{sample:Array.from({length:10},()=>[null,null,null])},note:'Sample round'}]};
JSON.stringify({home:viewHome()+mainNavigation(''),round:viewRound('demo')});`,context);
await writeFile(resolve(here,'views.json'),views);
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.ttf':'font/ttf'};
createServer(async(req,res)=>{
  const path=new URL(req.url,'http://localhost').pathname;
  const base=path.startsWith('/app/')?resolve(root,'ibo-scorer'):resolve(here);
  const file=resolve(base,'.'+decodeURIComponent(path.startsWith('/app/')?path.slice(4):path==='/'?'/index.html':path));
  if(!file.startsWith(base+sep)){res.writeHead(403).end();return;}
  try{const body=await readFile(file);res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream','Cache-Control':'no-store'}).end(body);}catch{res.writeHead(404).end('Not found');}
}).listen(4191,'127.0.0.1',()=>console.log('Motion prototypes: http://127.0.0.1:4191/'));
