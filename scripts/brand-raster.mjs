// Optional maintainer export. Requires the project's Playwright Chromium installation.
// Every output starts at the maintained SVG + frozen original artwork, never another export.
import { chromium } from '@playwright/test';
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { mark, sourceSha256, sha256 as sha, normalizedTextSha256 as shaText } from './brand-source.mjs';
import './brand-web.mjs';
const root = new URL('../', import.meta.url);
const browser = await chromium.launch({headless:true});
const outputs = {};
try {
  const page = await browser.newPage();
  await page.setContent('<!doctype html><canvas></canvas>');
  await page.evaluate(async svg=>{
    const load=async text=>{const image=new Image();image.src='data:image/svg+xml;base64,'+btoa(text);await image.decode();return image;};
    window.brand=await load(svg);
    const layer=new DOMParser().parseFromString(svg,'image/svg+xml');
    const background=layer.documentElement.cloneNode(true);
    for(const child of [...background.children])if(['g','path'].includes(child.localName))child.remove();
    window.brandBackground=await load(new XMLSerializer().serializeToString(background));
    const foreground=layer.documentElement.cloneNode(true);
    for(const child of [...foreground.children])if(['rect','svg','defs'].includes(child.localName))child.remove();
    window.brandForeground=await load(new XMLSerializer().serializeToString(foreground));
  }, mark);
  async function output(path,width,height,{mode='full',format='png'}={}) {
    const url=await page.evaluate(({width,height,mode,format})=>{
      const c=document.querySelector('canvas');c.width=width;c.height=height;
      const ctx=c.getContext('2d');
      if(mode==='round'){ctx.beginPath();ctx.arc(width/2,height/2,width/2,0,Math.PI*2);ctx.clip();}
      if(mode!=='foreground'){ctx.fillStyle='#4b5320';ctx.fillRect(0,0,width,height);}
      if(['background','maskable','round'].includes(mode))ctx.drawImage(window.brandBackground,0,0,width,height);
      if(mode==='background')return c.toDataURL('image/'+format);
      const side=Math.min(width,height)*(mode==='foreground'?64/108:mode==='maskable'?0.8:mode==='round'?1:mode==='splash'?0.28:1);
      ctx.drawImage(['foreground','maskable','round'].includes(mode)?window.brandForeground:window.brand,(width-side)/2,(height-side)/2,side,side);
      return c.toDataURL('image/'+format,0.95);
    },{width,height,mode,format});
    const bytes=Buffer.from(url.split(',')[1],'base64');
    writeFileSync(new URL(path,root),bytes);
    outputs[path]=sha(bytes);
  }
  mkdirSync(new URL('android/app/src/main/res/drawable-nodpi/',root),{recursive:true});
  await output('android/app/src/main/res/drawable-nodpi/ranch_horizon_splash.png',432,432,{mode:'maskable'});
  await output('ibo-scorer/icons/icon-192.png',192,192);
  await output('ibo-scorer/icons/icon-512.png',512,512);
  await output('ibo-scorer/icons/maskable-512.png',512,512,{mode:'maskable'});
  await output('ibo-scorer/icons/favicon-32.png',32,32);
  await output('ibo-scorer/icons/logo.webp',512,512,{format:'webp'});
  for(const [density,scale] of Object.entries({ldpi:0.75,mdpi:1,hdpi:1.5,xhdpi:2,xxhdpi:3,xxxhdpi:4})){
    const dir=`android/app/src/main/res/mipmap-${density}/`;
    await output(dir+'ic_launcher.png',48*scale,48*scale);
    await output(dir+'ic_launcher_round.png',48*scale,48*scale,{mode:'round'});
    await output(dir+'ic_launcher_foreground.png',108*scale,108*scale,{mode:'foreground'});
    await output(dir+'ic_launcher_background.png',108*scale,108*scale,{mode:'background'});
  }
  // Keep the existing legacy portrait/landscape density sizes, with the same static mark.
  for(const dir of readdirSync(new URL('android/app/src/main/res/',root)).filter(x=>x.startsWith('drawable'))){
    const path=`android/app/src/main/res/${dir}/splash.png`;
    try {const b=readFileSync(new URL(path,root));await output(path,b.readUInt32BE(16),b.readUInt32BE(20),{mode:'splash'});}
    catch(error){if(error.code!=='ENOENT')throw error;}
  }
  for(const [name,mode,size] of [['icon-only.png','full',1024],['icon-foreground.png','foreground',1024],['icon-background.png','background',1024],['splash.png','splash',2732],['splash-dark.png','splash',2732]]) await output('assets/'+name,size,size,{mode});
  writeFileSync(new URL('assets/brand/exports.json',root),JSON.stringify({sourceSha256,masterSha256:shaText(readFileSync(new URL('assets/brand/ranch-horizon.svg',root))),generatorSha256:shaText(readFileSync(new URL('scripts/brand-raster.mjs',root))),renderer:'Playwright Chromium '+browser.version(),outputs},null,2)+'\n');
  console.log(`Exported Ranch Horizon web, launcher and static startup PNGs. Frozen source: ${sourceSha256}`);
} finally {await browser.close();}
