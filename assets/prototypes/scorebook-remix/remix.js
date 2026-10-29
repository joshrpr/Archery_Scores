'use strict';

const icons = {
  arrow:'<path d="M4 12h15m-6-6 6 6-6 6"/>',
  back:'<path d="m14 5-7 7 7 7"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  home:'<path d="m3 10 9-7 9 7v10h-6v-6H9v6H3z"/>',
  history:'<path d="M4 5v5h5M4 10a8 8 0 1 1 0 5m8-9v6l4 2"/>',
  chart:'<path d="M4 4v16h17M8 16v-5m5 5V7m5 9v-7"/>',
  people:'<circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2m1-15a3 3 0 0 1 0 6m2 3a5 5 0 0 1 3 4v2"/>',
  settings:'<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="2"/><circle cx="15" cy="17" r="2"/>'
};
const icon = name => `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name]}</svg>`;
const directions = [
  {id:'heritage',name:'Heritage',description:'The refined one. Editorial lettering, paper and ink, fine rules, and a small orange seal that takes you back to the line.',caption:'Classic · considered · quietly distinctive',colors:['#f3eddf','#342b23','#f2621a']},
  {id:'velocity',name:'Velocity',description:'The modern one. A punchy orange resume panel, crisp controls, and a score that travels directly from your tap into the book.',caption:'Modern · graphic · fluid',colors:['#f2621a','#f6f1e6','#2c2923']},
  {id:'wildcard',name:'Wildcard',description:'The expressive one. Big italic lettering, vermilion and aubergine, a curved paper section, and scores that land with a little attitude.',caption:'Unexpected · playful · unmistakable',colors:['#f2621a','#fff4dc','#3b2034']}
];
const initialRounds = () => [['X',10,'X'],['X',10,9],['X',9,'X'],['X',10,null],...Array.from({length:6},()=>[null,null,null])];
const newState = () => ({screen:'home',end:3,rounds:initialRounds(),message:'',finished:false,past:null});
const states = Object.fromEntries(directions.map(d=>[d.id,newState()]));
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const point = v => v==='X'?10:v||0;
const total = rounds => ({score:rounds.flat().reduce((s,v)=>s+point(v),0),xs:rounds.flat().filter(v=>v==='X').length});
const pastRounds = [
  {date:'Oct 25',rounds:[...Array(12).fill('X'),...Array(4).fill(10),...Array(14).fill(9)]},
  {date:'Oct 22',rounds:[...Array(9).fill('X'),...Array(21).fill(9)]}
].map(r=>({...r,rounds:Array.from({length:10},(_,i)=>r.rounds.slice(i*3,i*3+3))}));
let demoVersion = 0;

const statusbar = `<div class="statusbar"><span>9:41</span><svg viewBox="0 0 49 13" aria-hidden="true"><path d="M0 10h3v3H0zm5-3h3v6H5zm5-3h3v9h-3zm5-4h3v13h-3z"/><rect x="27" y="2" width="18" height="10" rx="2" fill="none" stroke="currentColor"/><rect x="29" y="4" width="14" height="6" rx="1"/><path d="M46 5h2v4h-2z"/></svg></div>`;
const appbar = () => `<header class="appbar"><div class="brand">Ropers<small>Archery Scorecard</small></div><button class="icon-button" data-screen="settings" aria-label="Backup and export">${icon('settings')}</button></header>`;
const nav = active => `<nav class="bottom-nav" aria-label="Main navigation">${[['home','Home'],['history','History'],['chart','Analytics'],['people','Archers']].map(([id,label])=>`<button data-screen="${id}" ${active===id?'aria-current="page"':''}>${icon(id)}<span>${label}</span></button>`).join('')}</nav>`;
const utility = () => `<div class="home-utility"><button data-screen="settings">Backup and export</button><span>Sample rounds</span></div>`;
const recent = () => `<div class="section-heading"><h3>Recent rounds</h3><button class="link-button" data-screen="history">View all</button></div>${pastRounds.map((r,i)=>{const t=total(r.rounds);return `<button class="round-row" data-past="${i}"><span><strong>Vegas 300</strong><small>${r.date} · Josh</small></span><span class="row-result"><b>${t.score}</b><small>${t.xs} Xs</small></span></button>`}).join('')}`;
const newRoundButton = () => `<button class="new-round" data-screen="new"><span>Start new round</span>${icon('plus')}</button>`;
function resume(id,s) {
  const t = total(s.rounds);
  return `<section class="home-resume" aria-label="Round in progress"><div><h2>Vegas ${id==='heritage'?'300':'<span>300</span>'}</h2><p>Josh · End ${s.end+1} of 10${s.finished?' · Finished':''}</p><div class="round-summary"><span><b>${t.score}</b> points</span><span><b>${t.xs}</b> Xs</span></div></div><button class="resume-control" data-screen="${s.finished?'card':'scoring'}" aria-label="${s.finished?'View scorecard':'Resume round'}">${icon('arrow')}</button></section>`;
}
function home(id,s) {
  if(id==='wildcard') return `${appbar()}<div class="workarea home-area"><div class="wild-lead"><h1 class="home-heading"><span>Make your</span><em>mark.</em></h1>${resume(id,s)}</div><div class="wild-history">${recent()}${newRoundButton()}${utility()}</div></div>${nav('home')}`;
  return `${appbar()}<div class="workarea home-area">${id==='heritage'?'<h1 class="home-heading">Back to<br>the <em>range.</em></h1>':'<h1 class="home-heading">Pick up where you left off.</h1>'}${resume(id,s)}${newRoundButton()}${recent()}${utility()}</div>${nav('home')}`;
}
function scoreScreen(id,s) {
  const end = s.rounds[s.end],t=total(s.rounds),full=end.every(v=>v!==null);
  const firstOpen=s.rounds.findIndex(e=>e.some(v=>v===null));
  return `<header class="round-toolbar"><div class="back-label"><button class="icon-button" data-screen="home" aria-label="Back to home">${icon('back')}</button><span>Vegas 300</span></div><button class="link-button" data-screen="card">Scorecard</button></header>
    <div class="score-head"><h1 class="end-title">End ${s.end+1}<span>of 10 · Josh</span></h1><div class="running-total"><span>${t.score}</span><small>${t.xs} Xs · running total</small></div></div>
    <nav class="end-strip" aria-label="Ends">${s.rounds.map((row,i)=>`<button data-end="${i}" aria-label="End ${i+1}" ${i===s.end?'aria-current="step"':''} class="${i===s.end?'current':row.every(v=>v!==null)?'done':''}" ${firstOpen>=0&&i>firstOpen?'disabled':''}>${i+1}</button>`).join('')}</nav>
    <div class="workarea score-workarea"><div class="archer-line"><strong>Josh</strong><span>Three arrows per end</span></div>
    <div class="arrow-slots">${end.map((v,i)=>`<label class="arrow-label">Arrow ${i+1}<button class="arrow-slot ${i===end.indexOf(null)?'next-slot':''}" data-clear="${i}" aria-label="Arrow ${i+1}${v===null?' not scored':': '+(v===0?'Miss':v)+'. Tap to clear'}"><span>${v===null?'—':v===0?'M':v}</span></button></label>`).join('')}</div>
    <div class="entry-caption"><span>${full?'End complete':'Enter arrow '+(end.indexOf(null)+1)}</span><b>End total ${end.reduce((s,v)=>s+point(v),0)}</b></div>
    <div class="keypad" aria-label="Arrow score">${['X',10,9,8,7,6,0].map(v=>`<button class="score-key" data-score="${v}" ${full?'disabled':''}>${v===0?'Miss':v}</button>`).join('')}<button class="score-key undo" data-undo ${end.every(v=>v===null)?'disabled':''}>Undo</button></div>
    <p class="entry-feedback" role="status">${s.message||'Tap a filled arrow to change its score.'}</p><div class="score-links"><button data-screen="plot">Plot arrows</button><button data-screen="card">See scorecard</button></div></div>
    <div class="sample-note">Sample round · not saved</div><div class="score-dock"><button class="icon-button" data-prev aria-label="Previous end" ${s.end===0?'disabled':''}>${icon('back')}</button><button class="main-action" data-next ${full?'':'disabled'}>${s.end===9?'Finish round':'Next end'}${icon('arrow')}</button></div>`;
}
function table(rounds,current=-1) {
  const t=total(rounds);
  return `<table class="data-table"><thead><tr><th>End</th><th>1</th><th>2</th><th>3</th><th>Total</th></tr></thead><tbody>${rounds.map((e,i)=>`<tr class="${i===current?'current-end':''}"><td>${i+1}</td>${e.map(v=>`<td>${v===null?'—':v===0?'M':v}</td>`).join('')}<td>${e.every(v=>v===null)?'—':e.reduce((s,v)=>s+point(v),0)}</td></tr>`).join('')}</tbody><tfoot><tr><td colspan="4">Total · ${t.xs} Xs</td><td>${t.score}</td></tr></tfoot></table>`;
}
function card(s) {
  const past=s.past===null?null:pastRounds[s.past];
  return `${appbar()}<div class="workarea detail-workarea"><div class="page-heading"><h2>${s.finished&&!past?'Round complete':'Scorecard'}</h2><button class="link-button" data-screen="${past?'history':'scoring'}">${past?'History':'Back to scoring'}</button></div><p class="subtle">Josh · Vegas 300${past?' · '+past.date:''}</p>${table(past?past.rounds:s.rounds,past?-1:s.end)}<p class="detail-note">Sample data. These scores are not added to your app.</p></div>${nav('history')}`;
}
function plot(s) {
  const e=s.rounds[s.end];
  const pts={'X':{x:.3,y:.1},10:{x:1.7,y:0},9:{x:3.2,y:0},8:{x:5.2,y:0},7:{x:7.2,y:0},6:{x:9.2,y:0},0:{x:10.7,y:0}};
  const arrows=e.map((v,i)=>v===null?null:{...pts[v],x:pts[v].x*Math.cos(i*2.1),y:pts[v].x*Math.sin(i*2.1),label:i+1,color:'#342b23'}).filter(Boolean);
  return `${appbar()}<div class="workarea detail-workarea"><div class="page-heading"><h2>Arrow positions</h2><button class="link-button" data-screen="scoring">Back to scoring</button></div><p class="subtle">End ${s.end+1} · Josh</p>${Target.faceSvg({arrows,cls:'target-face',ariaLabel:'Vegas 300 scoring spot: gold 10 and 9, red 8 and 7, blue 6'})}<p class="target-legend">Illustrative sample positions</p><p class="detail-note">The target keeps its true Vegas colors in every direction. This preview shows score-consistent positions, not recorded plots.</p><button class="main-action form-action" data-screen="scoring">Continue scoring ${icon('arrow')}</button></div>`;
}
function detail(id,s) {
  if(s.screen==='card')return card(s);
  if(s.screen==='plot')return plot(s);
  if(s.screen==='history')return `${appbar()}<div class="workarea detail-workarea"><h2>History</h2><p class="subtle">Josh · Sample rounds</p>${recent()}<button class="link-button" data-screen="home">Back to home</button></div>${nav('history')}`;
  if(s.screen==='new')return `${appbar()}<form class="workarea detail-workarea" data-new-form="${id}"><div class="page-heading"><h2>New round</h2><button type="button" class="link-button" data-screen="home">Cancel</button></div><label class="form-label" for="format-${id}">Round type</label><select class="mock-input" id="format-${id}"><option>Vegas 300</option></select><label class="form-label" for="archer-${id}">Archer</label><input id="archer-${id}" class="mock-input" value="Josh" readonly><p class="detail-note">Starts an empty sample Vegas round. Nothing is saved to your app.</p><button class="main-action form-action" type="submit">Start sample round ${icon('arrow')}</button></form>${nav('home')}`;
  const title={chart:'Analytics',people:'Archers',settings:'Backup and export'}[s.screen];
  return `${appbar()}<div class="workarea detail-workarea"><div class="page-heading"><h2>${title}</h2><button class="link-button" data-screen="home">Home</button></div>${s.screen==='chart'?`<p class="subtle">Josh · Sample Vegas rounds</p><table class="data-table"><thead><tr><th>Date</th><th>Score</th><th>Xs</th></tr></thead><tbody>${pastRounds.map(r=>`<tr><td>${r.date}</td><td>${total(r.rounds).score}</td><td>${total(r.rounds).xs}</td></tr>`).join('')}</tbody></table>`:s.screen==='people'?'<div class="round-row"><strong>Josh</strong><span class="subtle">Sample archer</span></div>':'<p>Backups and exports keep the same role in all three directions.</p>'}<p class="detail-note">This is a visual prototype. File operations and archer management belong to the production app.</p></div>${nav(s.screen)}`;
}
function render(id,{arrival=false}={}) {
  const phone=document.querySelector(`[data-phone="${id}"]`),s=states[id];
  phone.getAnimations({subtree:true}).forEach(a=>a.cancel());
  phone.querySelectorAll('.ghost-score').forEach(n=>n.remove());
  phone.innerHTML=statusbar+`<div class="screen">${s.screen==='home'?home(id,s):s.screen==='scoring'?scoreScreen(id,s):detail(id,s)}</div>`;
  if(arrival&&!reduced.matches)phone.querySelector('.workarea')?.animate([{opacity:.68,transform:'translateY(7px)'},{opacity:1,transform:'translateY(0)'}],{duration:200,easing:'cubic-bezier(.16,1,.3,1)'});
}
function focusAfterRender(id,selector,wasFocused) {
  if(wasFocused)document.querySelector(`[data-phone="${id}"] ${selector}`)?.focus({preventScroll:true});
}
function scoreFeedback(id,index,from,value) {
  const phone=document.querySelector(`[data-phone="${id}"]`),slot=phone.querySelector(`[data-clear="${index}"]`);
  if(!slot)return;
  if(reduced.matches){slot.animate([{opacity:.55},{opacity:1}],{duration:100});return;}
  if(id==='velocity'&&from){
    const bounds=phone.getBoundingClientRect(),dest=slot.getBoundingClientRect();
    const ghost=document.createElement('span');ghost.className='ghost-score';ghost.setAttribute('aria-hidden','true');ghost.textContent=value===0?'M':value;
    Object.assign(ghost.style,{left:dest.left-bounds.left+'px',top:dest.top-bounds.top+'px',width:dest.width+'px',height:dest.height+'px'});phone.append(ghost);
    const animation=ghost.animate([{transform:`translate(${from.left-dest.left}px,${from.top-dest.top}px) scale(.65)`,opacity:1,offset:0},{transform:'translate(0,0) scale(1)',opacity:1,offset:.8},{transform:'translate(0,0) scale(1)',opacity:0,offset:1}],{duration:340,easing:'cubic-bezier(.16,1,.3,1)'});
    animation.finished.catch(()=>{}).finally(()=>ghost.remove());
  }else if(id==='wildcard'){
    slot.querySelector('span').animate([{transform:'translateY(-12px) rotate(-14deg) scale(1.3)',filter:'blur(2px)',opacity:.45},{transform:'translateY(0) rotate(0) scale(1)',filter:'blur(0)',opacity:1}],{duration:310,easing:'cubic-bezier(.16,1,.3,1)'});
  }else{
    slot.querySelector('span').animate([{opacity:.2,filter:'blur(1px)',transform:'scale(1.07)'},{opacity:1,filter:'blur(0)',transform:'scale(1)'}],{duration:220,easing:'cubic-bezier(.16,1,.3,1)'});
  }
}
function enterScore(id,value,source) {
  const s=states[id],e=s.rounds[s.end],i=e.indexOf(null);if(i<0)return;
  const from=source?.getBoundingClientRect(),keyboard=source===document.activeElement;
  e[i]=value;s.finished=false;s.message=e.every(v=>v!==null)?'End complete. Ready for the next end.':`Arrow ${i+1}: ${value===0?'Miss':value}.`;
  render(id);scoreFeedback(id,i,from,value);
  focusAfterRender(id,e.every(v=>v!==null)?'[data-next]':`[data-score="${value}"]`,keyboard);
}
function setScreen(id,screen,{focus=false}={}) {
  const s=states[id];s.screen=screen;s.message='';if(screen==='card')s.past=null;
  render(id,{arrival:true});
  if(focus){const area=document.querySelector(`[data-phone="${id}"] .screen`);area.setAttribute('tabindex','-1');area.focus({preventScroll:true});}
}
document.querySelector('#studies').innerHTML=directions.map(d=>`<section class="study" data-study="${d.id}"><div class="study-title"><h2>${d.name}</h2><a href="?direction=${d.id}" target="_blank" rel="noopener">Open full size</a></div><div class="phone ${d.id}" data-phone="${d.id}" aria-label="${d.name} app preview"></div><p class="study-description">${d.description}</p><div class="study-caption">${d.colors.map(c=>`<span class="swatch" style="background:${c}" title="${c}"></span>`).join('')}<span class="caption-text">${d.caption}</span></div></section>`).join('');
directions.forEach(d=>render(d.id));

document.addEventListener('click',event=>{
  const b=event.target.closest('button');if(!b||b.disabled)return;
  if(b.hasAttribute('data-demo')){playDemo();return;}
  demoVersion++;
  if(b.dataset.view){directions.forEach(d=>setScreen(d.id,b.dataset.view));document.querySelectorAll('[data-view]').forEach(n=>n.setAttribute('aria-pressed',String(n===b)));return;}
  if(b.hasAttribute('data-reset')){directions.forEach(d=>{states[d.id]=newState();render(d.id)});document.querySelectorAll('[data-view]').forEach(n=>n.setAttribute('aria-pressed',String(n.dataset.view==='home')));return;}
  const phone=b.closest('[data-phone]');if(!phone)return;
  const id=phone.dataset.phone,s=states[id],keyboard=event.detail===0;
  if(b.dataset.screen){setScreen(id,b.dataset.screen,{focus:keyboard});return;}
  if(b.hasAttribute('data-past')){s.screen='card';s.past=Number(b.dataset.past);render(id,{arrival:true});return;}
  if(b.hasAttribute('data-score')){enterScore(id,b.dataset.score==='X'?'X':Number(b.dataset.score),b);return;}
  if(b.hasAttribute('data-clear')){const index=Number(b.dataset.clear);s.rounds[s.end][index]=null;s.finished=false;s.message='Arrow cleared. Enter the replacement score.';render(id);focusAfterRender(id,'[data-score="X"]',keyboard);return;}
  if(b.hasAttribute('data-undo')){for(let i=2;i>=0;i--)if(s.rounds[s.end][i]!==null){s.rounds[s.end][i]=null;break;}s.finished=false;s.message='Last score removed.';render(id);focusAfterRender(id,'[data-score="X"]',keyboard);return;}
  if(b.hasAttribute('data-next')){if(s.end===9){s.finished=true;s.past=null;s.screen='card';}else s.end++;s.message='';render(id,{arrival:true});focusAfterRender(id,'[data-score="X"]',keyboard);return;}
  if(b.hasAttribute('data-prev')){s.end=Math.max(0,s.end-1);s.message='';render(id,{arrival:true});focusAfterRender(id,'[data-next]',keyboard);return;}
  if(b.hasAttribute('data-end')){s.end=Number(b.dataset.end);s.message='';render(id,{arrival:true});}
});
document.addEventListener('submit',event=>{
  const form=event.target.closest('[data-new-form]');if(!form)return;event.preventDefault();demoVersion++;
  const id=form.dataset.newForm;states[id]={...newState(),screen:'scoring',end:0,rounds:Array.from({length:10},()=>[null,null,null])};render(id,{arrival:true});
});
async function playDemo(){
  const version=++demoVersion;
  const ids=document.body.classList.contains('solo')?[new URLSearchParams(location.search).get('direction')]:directions.map(d=>d.id);
  document.querySelectorAll('[data-view]').forEach(n=>n.setAttribute('aria-pressed',String(n.dataset.view==='scoring')));
  ids.forEach(id=>{states[id]=newState();setScreen(id,'scoring');});
  await new Promise(r=>setTimeout(r,650));if(version!==demoVersion||document.hidden)return;
  ids.forEach(id=>enterScore(id,9,document.querySelector(`[data-phone="${id}"] [data-score="9"]`)));
}
document.addEventListener('visibilitychange',()=>{if(document.hidden){demoVersion++;document.querySelectorAll('.phone').forEach(p=>{p.getAnimations({subtree:true}).forEach(a=>a.cancel());p.querySelectorAll('.ghost-score').forEach(n=>n.remove());});}});
reduced.addEventListener('change',()=>document.querySelectorAll('.phone').forEach(p=>{p.getAnimations({subtree:true}).forEach(a=>a.cancel());p.querySelectorAll('.ghost-score').forEach(n=>n.remove());}));
const params=new URLSearchParams(location.search),chosen=params.get('direction');
if(states[chosen]){document.body.classList.add('solo');document.querySelector(`[data-study="${chosen}"]`).classList.add('chosen');document.title=directions.find(d=>d.id===chosen).name+' — Ropers Scorebook';if(['scoring','card'].includes(params.get('screen')))setScreen(chosen,params.get('screen'));}
