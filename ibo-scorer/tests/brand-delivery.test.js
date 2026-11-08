const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const root = path.resolve(__dirname, '../..');
// Read shipped PNG pixels without requiring a native image tool in CI.
function png(file) {
  const b = fs.readFileSync(path.join(root, file));
  const width=b.readUInt32BE(16),height=b.readUInt32BE(20),channels=b[25]===6?4:3;
  assert.equal(b[24],8,'8-bit exported PNG');
  assert.ok([2,6].includes(b[25]),'RGB or RGBA exported PNG');
  const chunks=[];
  for(let p=8;p<b.length;){const n=b.readUInt32BE(p);if(b.toString('ascii',p+4,p+8)==='IDAT')chunks.push(b.subarray(p+8,p+8+n));p+=n+12;}
  const raw=zlib.inflateSync(Buffer.concat(chunks)),stride=width*channels,pixels=Buffer.alloc(height*stride);
  const paeth=(a,b,c)=>{const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);return pa<=pb&&pa<=pc?a:pb<=pc?b:c;};
  for(let y=0;y<height;y++){const filter=raw[y*(stride+1)];for(let x=0;x<stride;x++){const a=x>=channels?pixels[y*stride+x-channels]:0,b=y?pixels[(y-1)*stride+x]:0,c=y&&x>=channels?pixels[(y-1)*stride+x-channels]:0;pixels[y*stride+x]=(raw[y*(stride+1)+1+x]+([0,a,b,Math.floor((a+b)/2),paeth(a,b,c)][filter]))&255;}}
  return {width,height,channels,pixels};
}
test('native adaptive launcher retains the orange arrow and actual aerial inside the Android guaranteed safe circle',()=>{
  const image=png('android/app/src/main/res/mipmap-mdpi/ic_launcher_foreground.png');
  assert.deepEqual([image.width,image.height],[108,108]);
  const background=png('android/app/src/main/res/mipmap-mdpi/ic_launcher_background.png');
  let arrow=0,aerial=new Set();
  for(let y=0;y<108;y++)for(let x=0;x<108;x++){
    const p=(y*108+x)*image.channels,[r,g,b,a=255]=image.pixels.subarray(p,p+image.channels);
    if(a>240 && r>210 && g>65 && g<145 && b<65){arrow++;assert.ok(Math.hypot(x+0.5-54,y+0.5-54)<33,'orange arrow survives native 66dp safe circle');}
    if(y>=52&&y<=78&&x>=32&&x<=76){const q=(y*108+x)*background.channels;const [pr,pg,pb]=background.pixels.subarray(q,q+3);aerial.add(`${pr>>3},${pg>>3},${pb>>3}`);}
  }
  assert.ok(arrow>50,'orange arrow remains visible at mdpi');
  assert.ok(aerial.size>70,'recognizable source aerial retains photographic detail below the horizon');
});
test('published web manifest and native startup resolve the selected Ranch Horizon delivery assets',()=>{
  const read=file=>fs.readFileSync(path.join(root,file),'utf8');
  const manifest=JSON.parse(read('ibo-scorer/manifest.webmanifest'));
  assert.equal(manifest.theme_color,'#4b5320');
  assert.equal(manifest.background_color,'#f3eedf');
  for(const icon of manifest.icons){
    const image=png('ibo-scorer/'+icon.src);
    assert.equal(`${image.width}x${image.height}`,icon.sizes);
    assert.ok(image.pixels.length>10000);
  }
  for(const [density,size] of Object.entries({ldpi:36,mdpi:48,hdpi:72,xhdpi:96,xxhdpi:144,xxxhdpi:192})){
    for(const name of ['ic_launcher','ic_launcher_round']){const p=png(`android/app/src/main/res/mipmap-${density}/${name}.png`);assert.deepEqual([p.width,p.height],[size,size]);}
    const p=png(`android/app/src/main/res/mipmap-${density}/ic_launcher_foreground.png`);assert.deepEqual([p.width,p.height],[size*2.25,size*2.25]);
  }
  for(const launcher of ['ic_launcher','ic_launcher_round']){
    const xml=read(`android/app/src/main/res/mipmap-anydpi-v26/${launcher}.xml`);
    assert.match(xml,/<background android:drawable="@mipmap\/ic_launcher_background"\s*\/>/);
    assert.match(xml,/<foreground android:drawable="@mipmap\/ic_launcher_foreground"\s*\/>/);
    assert.doesNotMatch(xml,/<inset/,'108dp foreground already includes native safe-region placement');
  }
  const styles=read('android/app/src/main/res/values/styles.xml');
  assert.match(styles,/<item name="windowSplashScreenAnimatedIcon">@drawable\/ranch_horizon_splash<\/item>/);
  const config=JSON.parse(read('capacitor.config.json'));
  assert.equal(config.appId,'com.ropersarchery.scorecard','updates retain installed application identity');
  assert.equal(config.backgroundColor,'#f3eedf');
});

test('Android web build bundles the same offline identity and fonts as the published app without prototype pages',()=>{
  const {spawnSync}=require('node:child_process');
  const build=spawnSync(process.execPath,['scripts/build-web.mjs'],{cwd:root,encoding:'utf8'});
  assert.equal(build.status,0,build.stderr);
  const source=fs.readFileSync(path.join(root,'ibo-scorer/sw.js'),'utf8');
  const assets=[...source.match(/const ASSETS = \[([\s\S]*?)\];/)[1].matchAll(/'\.\/(.*?)'/g)].map(m=>m[1]||'index.html');
  for(const asset of assets){
    assert.deepEqual(fs.readFileSync(path.join(root,'www',asset)),fs.readFileSync(path.join(root,'ibo-scorer',asset)),`identical bundled offline asset: ${asset}`);
  }
  const index=fs.readFileSync(path.join(root,'www/index.html'),'utf8');
  for(const [,url] of index.matchAll(/(?:src|href)="([^"]+)"/g))assert.ok(assets.includes(url),`HTML dependency is precached: ${url}`);
  assert.ok(assets.includes('fonts/Newsreader.ttf')&&assets.includes('fonts/Newsreader-Italic.ttf'));
  assert.ok(!fs.existsSync(path.join(root,'www/sw.js')),'native bundle uses APK updates');
  assert.ok(!fs.existsSync(path.join(root,'www/prototypes')),'prototype comparison boards stay out of installed app');
});
