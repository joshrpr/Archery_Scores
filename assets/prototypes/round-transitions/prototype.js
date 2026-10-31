const $=s=>document.querySelector(s);
const variants=[{key:'surface',name:'Surface continuity',description:'The tapped surface becomes the olive scoring header. The rest of the score sheet unfolds below it. Closest to the reel’s connected-card idea.',duration:520},{key:'slide',name:'Field of view',description:'Home retreats slightly as the score sheet moves in from the right. Back retraces the same path. Faster and quieter for everyday use.',duration:380}];
let variant=variants.findIndex(v=>v.key===new URLSearchParams(location.search).get('variant'));if(variant<0)variant=0;
let scoring=false,busy=false,lastAnchor=null;
const home=$('#home'),round=$('#round'),phone=$('.phone'),morph=$('#morph');
const views=await fetch('views.json').then(r=>r.json());
home.innerHTML=views.home;round.innerHTML=views.round;
for(const image of home.querySelectorAll('img'))image.src='/app/'+image.getAttribute('src');
function showVariant(){const v=variants[variant];$('#concept').textContent=v.name;$('#description').textContent=v.description;$('#variant-label').textContent=`${variant+1} / 2 · ${v.name}`;const url=new URL(location);url.searchParams.set('variant',v.key);history.replaceState(null,'',url);}
function setBusy(on){busy=on;for(const id of ['play','return','previous','next'])$('#'+id).disabled=on;}
function animate(el,frames,options){return el.animate(frames,{fill:'both',easing:'cubic-bezier(.22,1,.36,1)',...options});}
async function move(forward,origin){if(busy||forward===scoring)return;setBusy(true);
  if(forward)lastAnchor=origin||home.querySelector('.home-new');
  const v=variants[variant],slow=$('#slow').checked?2.5:1,reduced=matchMedia('(prefers-reduced-motion: reduce)').matches||new URLSearchParams(location.search).get('motion')==='reduced';
  const duration=reduced?120:v.duration*slow;const effects=[];
  const outgoing=forward?home:round,incoming=forward?round:home;
  incoming.hidden=false;incoming.inert=true;outgoing.inert=true;
  if(forward)round.scrollTop=0;
  $('#status').textContent=forward?'Home → scoring':'Scoring → Home';
  if(reduced){effects.push(animate(incoming,[{opacity:0},{opacity:1}],{duration}));}
  else if(v.key==='surface'){
    const anchor=lastAnchor||home.querySelector('.home-new'),p=phone.getBoundingClientRect();
    let start=anchor.getBoundingClientRect();
    if(start.bottom<p.top||start.top>p.bottom){home.scrollTop=0;start=home.querySelector('.home-new').getBoundingClientRect();}
    const header=round.querySelector('.round-top').getBoundingClientRect();
    const a={left:start.left-p.left,top:start.top-p.top,width:start.width,height:start.height};
    const b={left:0,top:0,width:p.width,height:header.height};
    const first=forward?a:b,last=forward?b:a;
    Object.assign(morph.style,{display:'block',left:last.left+'px',top:last.top+'px',width:last.width+'px',height:last.height+'px',background:'var(--od)',borderRadius:forward?'0 0 28px 0':'12px'});
    const sourceColor=getComputedStyle(anchor).backgroundColor;
    effects.push(animate(morph,[{transform:`translate(${first.left-last.left}px,${first.top-last.top}px) scale(${first.width/last.width},${first.height/last.height})`,transformOrigin:'0 0',backgroundColor:forward?sourceColor:'rgb(75,83,32)',borderRadius:forward?'12px':'0 0 28px 0',opacity:1},{transform:'none',transformOrigin:'0 0',backgroundColor:forward?'rgb(75,83,32)':sourceColor,borderRadius:forward?'0 0 28px 0':'12px',opacity:1}],{duration:duration*.82}));
    effects.push(animate(morph,[{opacity:1},{opacity:0}],{duration:duration*.25,delay:duration*.7}));
    // Keep the round identity travelling through the change, as in the reference card.
    const title=document.createElement('span');title.className='shared-title';title.textContent='Vegas 300';title.setAttribute('aria-hidden','true');phone.append(title);
    const label=round.querySelector('.round-toolbar>span').getBoundingClientRect();
    const from={x:a.left+24,y:a.top+22,scale:anchor.matches('.home-resume')?2.8:1.1};
    const to={x:label.left-p.left,y:label.top-p.top,scale:1};
    const frames=[from,to].map(pt=>({transform:`translate(${pt.x}px,${pt.y}px) scale(${pt.scale})`,opacity:1}));
    effects.push(animate(title,forward?frames:frames.slice().reverse(),{duration:duration*.82}));
    effects.push(animate(title,forward?[{opacity:0},{opacity:1,offset:.25},{opacity:1,offset:.7},{opacity:0}]:[{opacity:0},{opacity:1,offset:.2},{opacity:0}],{duration}));
    effects.push(animate(outgoing,[{opacity:1},{opacity:0}],{duration:duration*.35}));
    effects.push(animate(incoming,[{opacity:0},{opacity:1}],{duration:duration*.4,delay:duration*.5}));
    if(forward){const body=round.querySelector('.scoring-main');effects.push(animate(body,[{transform:'translateY(44px)',opacity:0},{transform:'none',opacity:1}],{duration:duration*.68,delay:duration*.26}));}
  }else{
    home.style.zIndex='1';round.style.zIndex='2';
    effects.push(animate(home,forward?[{transform:'none',opacity:1,borderRadius:'0'},{transform:'translateX(-12%) scale(.94)',opacity:.6,borderRadius:'24px'}]:[{transform:'translateX(-12%) scale(.94)',opacity:.6,borderRadius:'24px'},{transform:'none',opacity:1,borderRadius:'0'}],{duration}));
    effects.push(animate(round,forward?[{transform:'translateX(100%)',borderRadius:'24px 0 0 24px'},{transform:'none',borderRadius:'0'}]:[{transform:'none',borderRadius:'0'},{transform:'translateX(100%)',borderRadius:'24px 0 0 24px'}],{duration}));
  }
  await Promise.all(effects.map(a=>a.finished));outgoing.hidden=true;outgoing.inert=true;incoming.inert=false;effects.forEach(a=>a.cancel());phone.querySelector('.shared-title')?.remove();morph.style.display='none';scoring=forward;setBusy(false);
  $('#status').textContent=(scoring?'Scoring':'Home')+' · ready';
  if(scoring){const title=round.querySelector('h1');title.tabIndex=-1;title.focus({preventScroll:true});}else (origin||home.querySelector('.home-new')).focus({preventScroll:true});
}
function switchVariant(d){if(busy)return;variant=(variant+d+2)%2;scoring=false;home.hidden=false;home.inert=false;round.hidden=true;round.inert=true;home.scrollTop=0;$('#status').textContent='Home · ready';showVariant();}
home.addEventListener('click',e=>{const b=e.target.closest('.home-new,.home-resume');if(b)move(true,b);});
round.querySelector('.back').addEventListener('click',()=>move(false));
$('#play').onclick=()=>{if(scoring)move(false);else move(true);};$('#return').onclick=()=>move(false);
$('#previous').onclick=()=>switchVariant(-1);$('#next').onclick=()=>switchVariant(1);
document.addEventListener('keydown',e=>{if(e.target.matches('input,textarea,[contenteditable]'))return;if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();switchVariant(e.key==='ArrowLeft'?-1:1);}if(e.key==='Escape')move(false);});
showVariant();
