'use strict';
const concepts=[
  {id:'ranch-horizon',name:'Ranch Horizon',description:'The closest to your current identity. The ranch fills the lower part of the icon, with your arrow and target arcs against a solid OD green horizon.'},
  {id:'ranch-emblem',name:'Ranch Emblem',description:'A circular window onto the ranch, surrounded by OD green and a cream ring. The orange arrow anchors the aerial to the archery identity.'},
  {id:'ranch-frame',name:'Ranch Frame',description:'The aerial takes almost the entire icon. An OD green frame and orange arrow badge give it a cleaner Velocity treatment.'}
];
const mark=(id,cls='')=>`<img class="app-icon ${cls}" src="marks/${id}.svg" alt="${concepts.find(c=>c.id===id).name} icon" width="128" height="128">`;
const wordmark=()=>'<div class="wordmark">Ropers<small>Archery Scorecard</small></div>';
document.querySelector('#concepts').innerHTML=concepts.map(c=>`<section class="concept" data-concept="${c.id}" aria-label="${c.name} proposal"><h2>${c.name}</h2><div class="identity"><div class="mark-large">${mark(c.id)}</div>${wordmark()}</div><p class="concept-description">${c.description}</p><div class="scale-line"><span class="scale-label">At launcher size</span><div class="size-pair"><span class="size-example">${mark(c.id,'s48')}<span>48px</span></span><span class="size-example">${mark(c.id,'s32')}<span>32px</span></span></div></div><div class="context" aria-label="${c.name} in the Velocity OD header"><header class="context-header">${mark(c.id)}${wordmark()}</header><div class="context-body"><h3>Pick up where you left off.</h3><div class="round-panel"><h4>Vegas<span>300</span></h4><span class="arrow" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m6 18 12-12M7 6h11v11"/></svg></span><p>Josh · End 4 of 10</p><div class="round-total"><span>108 points</span><span>6 Xs</span></div></div><p class="context-note">Header preview · sample round</p></div></div><div class="downloads"><a href="marks/${c.id}.svg" target="_blank" rel="noopener">SVG asset</a><a href="marks/${c.id}-512.png" target="_blank" rel="noopener">PNG asset</a><a href="?concept=${c.id}">View alone</a></div></section>`).join('');
document.addEventListener('click',e=>{
  const b=e.target.closest('button');if(!b)return;
  if(b.dataset.mask){document.body.classList.toggle('circle',b.dataset.mask==='circle');document.querySelectorAll('[data-mask]').forEach(n=>n.setAttribute('aria-pressed',String(n===b)));}
  if(b.hasAttribute('data-ink')){const active=document.body.classList.toggle('ink');b.setAttribute('aria-pressed',String(active));b.textContent=active?'Show brand colors':'Check grayscale';}
});
const selected=new URLSearchParams(location.search).get('concept');
if(concepts.some(c=>c.id===selected)){document.body.classList.add('solo');document.querySelector(`[data-concept="${selected}"]`).classList.add('selected');document.title=concepts.find(c=>c.id===selected).name+' — Velocity OD identity study';}

