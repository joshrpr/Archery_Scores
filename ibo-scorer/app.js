'use strict';

/* =========================================================
   Ropers Archery Scorecard — offline 3D archery scorecard
   All data lives in this phone's browser storage (localStorage).
   ========================================================= */

const KEY = 'ibo-scorer-v1';
const VALUES = [11, 10, 8, 5, 0];           // IBO scoring; 0 = miss
const VEGAS_VALUES = ['X', 10, 9, 8, 7, 6, 0]; // Vegas 300; X scores 10, 0 = miss
const VEGAS_ENDS = 10, VEGAS_ARROWS = 3;
const label = v => (v === 0 ? 'M' : String(v));
const points = v => (v === 'X' ? 10 : v);
// Vegas face colour for a value: gold (X-9), red (8-7), blue (6), miss.
const ring = v => (v === 'X' || v >= 9 ? 'g' : v >= 7 ? 'r' : v === 6 ? 'b' : 'm');
const SERIES_COLORS = ['#2f96eb', '#f2621a', '#6faf2f', '#d8bc84', '#ff6b6b', '#c792ff'];

const app = document.getElementById('app');
let db = load();
if (migrate(db)) save();
let draft = null;        // new-round form state
let wakeLock = null;
let lastPath = null;

/* ---------- storage ---------- */
function load() {
  try {
    const d = JSON.parse(localStorage.getItem(KEY));
    if (d && Array.isArray(d.archers) && Array.isArray(d.rounds)) return d;
  } catch (e) { /* fall through */ }
  return { archers: [], rounds: [] };
}
// Rounds saved before round types existed are IBO rounds.
function migrate(d) {
  let changed = false;
  for (const r of d.rounds) if (!r.type) { r.type = 'ibo'; changed = true; }
  return changed;
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(db)); }
  catch (e) { alert('Could not save. Phone storage may be full.'); }
}
if (navigator.storage && navigator.storage.persist) {
  navigator.storage.persist().catch(() => {});
}

/* ---------- helpers ---------- */
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const esc = s => String(s).replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const archerById = id => db.archers.find(a => a.id === id);
const nameOf = id => { const a = archerById(id); return a ? a.name : 'Unknown'; };
const activeArchers = () => db.archers.filter(a => !a.deleted)
  .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
const roundById = id => db.rounds.find(r => r.id === id);
const fmtDate = ts => new Date(ts).toLocaleDateString(undefined,
  { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
const fmtShort = ts => new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

/* ---------- round types ---------- */
const isVegas = r => r.type === 'vegas';
const typeName = r => (isVegas(r) ? 'Vegas 300' : 'IBO 3D');
const unit = r => (isVegas(r) ? 'End' : 'Target');
const unitsLabel = r => (isVegas(r) ? `${r.targets} ends` : `${r.targets} targets`);
const bonusLabel = r => (isVegas(r) ? 'Xs' : '11s');
const bonusMark = r => (isVegas(r) ? 'X' : '11');
// One target (IBO) or one end (Vegas) is complete for an archer.
const slotDone = (r, aid, i) => (isVegas(r)
  ? r.scores[aid][i].every(v => v != null)
  : r.scores[aid][i] != null);
const endTotal = end => end.reduce((s, v) => s + (v == null ? 0 : points(v)), 0);

function tally(r, aid) {
  let total = 0, elevens = 0, xs = 0, scored = 0;
  const arrows = isVegas(r) ? (r.scores[aid] || []).flat() : r.scores[aid] || [];
  for (const v of arrows) {
    if (v != null) { total += points(v); scored++; if (v === 11) elevens++; if (v === 'X') xs++; }
  }
  return { total, elevens, xs, scored, bonus: isVegas(r) ? xs : elevens };
}

// Highest total first, 11s (IBO) or Xs (Vegas) as tiebreak; equal total+bonus share a rank.
function ranking(r) {
  const rows = r.archerIds.map(id => ({ id, ...tally(r, id) }))
    .sort((a, b) => b.total - a.total || b.bonus - a.bonus);
  rows.forEach((row, i) => {
    const prev = rows[i - 1];
    row.rank = prev && prev.total === row.total && prev.bonus === row.bonus ? prev.rank : i + 1;
  });
  return rows;
}

function gapsOf(r) {
  const gaps = [];
  for (const aid of r.archerIds) {
    const missing = [];
    r.scores[aid].forEach((_, i) => { if (!slotDone(r, aid, i)) missing.push(i + 1); });
    if (missing.length) gaps.push({ aid, missing });
  }
  return gaps;
}

function addArcher(raw) {
  const name = raw.trim().replace(/\s+/g, ' ');
  if (!name) return null;
  if (activeArchers().some(a => a.name.toLowerCase() === name.toLowerCase())) {
    alertBox('Name already used', `There is already an archer named <b>${esc(name)}</b>.`);
    return null;
  }
  const a = { id: uid(), name, deleted: false, createdAt: Date.now() };
  db.archers.push(a);
  save();
  return a;
}

/* ---------- modal dialogs ---------- */
function modal({ title, html = '', input = null, buttons }) {
  return new Promise(resolve => {
    const wrap = document.createElement('div');
    wrap.className = 'modal-wrap';
    wrap.innerHTML = `<div class="modal" role="dialog" aria-modal="true">
      <h2>${esc(title)}</h2>${html}
      ${input ? `<input class="modal-input" maxlength="${input.max || 60}"
          value="${esc(input.value || '')}" placeholder="${esc(input.placeholder || '')}">` : ''}
      <div class="modal-btns" style="${buttons.length === 1 ? 'grid-template-columns:1fr' : ''}">
        ${buttons.map((b, i) => `<button class="btn ${b.cls || ''}" data-i="${i}">${esc(b.label)}</button>`).join('')}
      </div></div>`;
    document.body.appendChild(wrap);
    const inp = wrap.querySelector('input');
    const finish = btn => { wrap.remove(); resolve({ value: btn.value, text: inp ? inp.value : null }); };
    if (inp) {
      inp.focus(); inp.select();
      inp.addEventListener('keydown', e => {
        if (e.key === 'Enter') finish(buttons.find(b => b.value === true) || buttons[buttons.length - 1]);
      });
    }
    wrap.addEventListener('click', e => {
      const b = e.target.closest('[data-i]');
      if (b) finish(buttons[+b.dataset.i]);
    });
  });
}
async function confirmBox(title, html, okLabel = 'OK', danger = false) {
  const r = await modal({ title, html, buttons: [
    { label: 'Cancel', value: false },
    { label: okLabel, value: true, cls: danger ? 'danger' : 'primary' }] });
  return r.value === true;
}
async function promptBox(title, value, placeholder) {
  const r = await modal({ title, input: { value, placeholder }, buttons: [
    { label: 'Cancel', value: false },
    { label: 'Save', value: true, cls: 'primary' }] });
  return r.value === true ? r.text : null;
}
function alertBox(title, html) {
  return modal({ title, html, buttons: [{ label: 'OK', value: true, cls: 'primary' }] });
}

/* ---------- screen wake lock (keeps screen on while scoring) ---------- */
async function setWakeLock(on) {
  if (!('wakeLock' in navigator)) return;
  try {
    if (on && !wakeLock) {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => { wakeLock = null; });
    } else if (!on && wakeLock) {
      await wakeLock.release();
      wakeLock = null;
    }
  } catch (e) { /* not allowed right now; ignore */ }
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') setWakeLock(route().page === 'round');
});

/* ---------- routing ---------- */
function route() {
  const [page = '', id = ''] = location.hash.replace(/^#\/?/, '').split('/');
  return { page, id };
}
function go(hash) {
  if (location.hash === hash) render(); else location.hash = hash;
}
window.addEventListener('hashchange', () => {
  // Phone back button while a dialog is open: close the dialog too.
  document.querySelectorAll('.modal-wrap').forEach(m => m.remove());
  render();
});

function header(title, backTo) {
  return `<header class="top">
    ${backTo ? `<button class="back" data-action="nav" data-to="${backTo}" aria-label="Back">←</button>` : ''}
    <h1>${title}</h1></header>`;
}

function render() {
  const { page, id } = route();
  let html;
  switch (page) {
    case 'new': html = viewNew(); break;
    case 'round': html = viewRound(id); break;
    case 'card': html = viewCard(id); break;
    case 'history': html = viewHistory(); break;
    case 'archers': html = viewArchers(); break;
    case 'archer': html = viewArcher(id); break;
    case 'backup': html = viewBackup(); break;
    case 'stats': html = Stats.view(id); break;
    default: html = viewHome();
  }
  if (html == null) return;            // view redirected
  app.innerHTML = html;
  const path = location.hash;
  if (path !== lastPath) { window.scrollTo(0, 0); lastPath = path; }
  const cur = app.querySelector('.chip.cur');
  if (cur) cur.scrollIntoView({ inline: 'center', block: 'nearest' });
  setWakeLock(page === 'round');
  Plot.bind(app, placeArrow);
  if (page === 'stats') Stats.bind(app);
}

/* ---------- views ---------- */
function viewHome() {
  const open = db.rounds.filter(r => r.status !== 'finished').sort((a, b) => b.createdAt - a.createdAt);
  return `<section class="hero">
    <img class="hero-logo" src="icons/logo.webp" alt="" width="168" height="168">
    <h1 class="brand"><span>Ropers</span>Archery Scorecard</h1>
    <svg class="ridge" viewBox="0 0 400 70" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 38 L40 22 L70 34 L118 8 L160 30 L205 14 L250 32 L300 6 L345 28 L400 16 V70 H0Z" fill="#1e4175"/>
      <path d="M0 56 L55 40 L110 52 L170 34 L230 50 L290 38 L350 52 L400 42 V70 H0Z" fill="#0e2240"/>
    </svg>
  </section>
  <main>
    <button class="big primary" data-action="new-round">Start new round</button>
    ${open.length ? `<h2>Pick up where you left off</h2>` + open.map(r => `
      <button class="card-row resume" data-action="nav" data-to="#/round/${r.id}">
        <div class="title">${unit(r)} ${r.current + 1} of ${r.targets}<span class="badge type">${typeName(r)}</span></div>
        <div>${r.archerIds.map(id => esc(nameOf(id))).join(', ')}</div>
        <div class="muted small">${fmtDate(r.createdAt)}${r.note ? `, ${esc(r.note)}` : ''}</div>
      </button>`).join('') : ''}
    <button class="big an-home" data-action="nav" data-to="#/stats">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 20h18M6 16V11M11 16V6M16 16v-7M21 16V9" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>
      Analytics</button>
    <div class="grid2">
      <button class="big" data-action="nav" data-to="#/history">History</button>
      <button class="big" data-action="nav" data-to="#/archers">Archers</button>
    </div>
    <button class="btn" data-action="nav" data-to="#/backup">Backup and export</button>
  </main>`;
}

function viewNew() {
  if (!draft) {
    const last = [...db.rounds].sort((a, b) => b.createdAt - a.createdAt)[0];
    draft = { selected: [], targets: 20, note: '', type: last && isVegas(last) ? 'vegas' : 'ibo' };
  }
  const vegas = draft.type === 'vegas';
  draft.selected = draft.selected.filter(id => { const a = archerById(id); return a && !a.deleted; });
  const list = activeArchers();
  return `${header('New round', '#/')}
  <main>
    <h2>Round</h2>
    <div class="seg" role="radiogroup" aria-label="Round type">
      <button role="radio" aria-checked="${!vegas}" class="${vegas ? '' : 'on'}" data-action="draft-type" data-type="ibo">
        <b>IBO 3D</b><span>11, 10, 8, 5</span></button>
      <button role="radio" aria-checked="${vegas}" class="${vegas ? 'on' : ''}" data-action="draft-type" data-type="vegas">
        <b>Vegas 300</b><span>10 ends × 3 arrows</span></button>
    </div>

    <h2>Archers</h2>
    <p class="muted small">Tap archers in shooting order.</p>
    <div class="pick">
      ${list.length ? list.map(a => {
        const i = draft.selected.indexOf(a.id);
        return `<button class="pick-btn ${i >= 0 ? 'on' : ''}" data-action="toggle-pick" data-id="${a.id}">
          ${i >= 0 ? `<span class="order">${i + 1}</span>` : ''}${esc(a.name)}</button>`;
      }).join('') : '<p class="muted">No saved archers yet. Add one below.</p>'}
    </div>
    <form class="inline" data-form="add-and-pick">
      <input name="name" placeholder="New archer name" autocomplete="off" maxlength="40">
      <button class="btn">Add</button>
    </form>

    ${vegas ? `
    <p class="muted small">Vegas 300: ${VEGAS_ENDS} ends of ${VEGAS_ARROWS} arrows, scored X, 10 to 6 and M. X counts 10 and breaks ties.</p>` : `
    <h2>Targets</h2>
    <div class="stepper">
      <button data-action="draft-targets" data-d="-1" aria-label="Fewer targets">−</button>
      <span>${draft.targets}</span>
      <button data-action="draft-targets" data-d="1" aria-label="More targets">+</button>
    </div>
    <p class="muted small">You can also add or remove targets during the round.</p>`}

    <h2>Note (optional)</h2>
    <input data-input="draft-note" value="${esc(draft.note)}" placeholder="e.g. Club shoot" maxlength="60">

    <button class="big primary" data-action="start-round" ${draft.selected.length ? '' : 'disabled'}>
      Start round${draft.selected.length ? ` with ${draft.selected.length} archer${draft.selected.length > 1 ? 's' : ''}` : ''}
    </button>
  </main>`;
}

function viewRound(id) {
  const r = roundById(id);
  if (!r) { go('#/'); return null; }
  const t = r.current;
  const editing = r.status === 'finished';
  const isLast = t === r.targets - 1;

  const vegas = isVegas(r);
  const chips = Array.from({ length: r.targets }, (_, i) => {
    const done = r.archerIds.every(aid => slotDone(r, aid, i));
    return `<button class="chip ${i === t ? 'cur' : done ? 'done' : ''}" data-action="jump" data-t="${i}">${i + 1}</button>`;
  }).join('');

  const rows = r.archerIds.map(aid => vegas ? vegasRow(r, aid, t) : iboRow(r, aid, t)).join('');

  return `${header(`${unit(r)} ${t + 1} <small>of ${r.targets}${editing ? ', editing' : ''}</small>`,
                   editing ? `#/card/${r.id}` : '#/')}
  <nav class="strip">${chips}</nav>
  <main class="with-dock">
    ${vegas ? plotPanel(r, t) : ''}
    ${rows}
    ${vegas
      ? `<button class="btn" data-action="nav" data-to="#/card/${r.id}">Scorecard</button>`
      : `<div class="grid3">
      <button class="btn" data-action="nav" data-to="#/card/${r.id}">Scorecard</button>
      <button class="btn" data-action="add-target">+ Target</button>
      <button class="btn" data-action="remove-target" ${r.targets <= 1 ? 'disabled' : ''}>− Target</button>
    </div>`}
    <button class="big ${isLast ? 'go' : ''}" data-action="finish">${editing ? 'Done editing' : 'Finish round'}</button>
  </main>
  <div class="dock">
    <button class="big" data-action="move" data-d="-1" ${t === 0 ? 'disabled' : ''}>◀ Prev</button>
    ${!isLast
      ? `<button class="big primary" data-action="move" data-d="1">Next ▶</button>`
      : vegas
        ? `<button class="big go" data-action="finish">${editing ? 'Done editing' : 'Finish'}</button>`
        : `<button class="big primary" data-action="add-target">+ Add target</button>`}
  </div>`;
}

function iboRow(r, aid, t) {
  const { total, elevens } = tally(r, aid);
  const v = r.scores[aid][t];
  return `<div class="arow" data-v="${v == null ? '' : v}">
    <div class="ahead">
      <span class="aname">${esc(nameOf(aid))}</span>
      <span class="atot"><span class="elev" title="11s">${elevens}× 11</span><b>${total}</b></span>
    </div>
    <div class="sbtns">
      ${VALUES.map(x => `<button class="s s${x} ${v === x ? 'sel' : ''}" data-action="score"
          data-aid="${aid}" data-v="${x}" aria-pressed="${v === x}">${label(x)}</button>`).join('')}
    </div></div>`;
}

// Vegas: three arrow slots per end. Score buttons fill the next empty slot;
// tapping a filled slot clears it so it can be re-entered.
function vegasRow(r, aid, t) {
  const { total, xs } = tally(r, aid);
  const end = r.scores[aid][t];
  const next = end.indexOf(null);
  const full = next < 0;
  const slots = end.map((v, k) => v == null
    ? `<span class="slot empty ${k === next ? 'next' : ''}" aria-label="Arrow ${k + 1} not scored"></span>`
    : `<button class="slot r${ring(v)}" data-action="vclear" data-aid="${aid}" data-k="${k}"
        aria-label="Arrow ${k + 1}: ${label(v)}. Tap to clear">${label(v)}</button>`).join('');
  return `<div class="arow vrow ${full ? 'full' : ''}">
    <div class="ahead">
      <span class="aname">${esc(nameOf(aid))}</span>
      <span class="atot"><span class="elev" title="Xs">${xs}× X</span><b>${total}</b></span>
    </div>
    <div class="slots">${slots}<span class="endtot"><small>End</small>${endTotal(end)}</span></div>
    <div class="sbtns vbtns">
      ${VEGAS_VALUES.map(x => `<button class="s r${ring(x)}" data-action="vscore"
          data-aid="${aid}" data-v="${x}" ${full ? 'disabled' : ''}>${label(x)}</button>`).join('')}
    </div></div>`;
}

function viewCard(id) {
  const r = roundById(id);
  if (!r) { go('#/history'); return null; }
  const finished = r.status === 'finished';
  const rank = ranking(r);
  const vegas = isVegas(r);
  const cell = v => `<td class="v${v == null ? 'null' : v}">${v == null ? '–' : label(v)}</td>`;
  const endCell = end => end.every(v => v == null) ? '<td class="vnull">–</td>'
    : `<td class="vend"><span class="arr">${end.map(v => v == null ? '<i>·</i>'
        : `<i class="r${ring(v)}">${label(v)}</i>`).join('')}</span><b>${endTotal(end)}</b></td>`;

  return `${header(finished ? 'Scorecard' : 'Scorecard <small>in progress</small>',
                   finished ? '#/history' : `#/round/${r.id}`)}
  <main>
    <div class="meta"><strong>${fmtDate(r.createdAt)}</strong>${r.note ? `<span>${esc(r.note)}</span>` : ''}
      <span class="badge type">${typeName(r)}</span><span class="muted">${unitsLabel(r)}</span></div>

    <h2>Standings</h2>
    <div class="tablewrap"><table>
      <thead><tr><th>#</th><th class="name">Archer</th><th>Total</th><th>${bonusLabel(r)}</th></tr></thead>
      <tbody>${rank.map(x => `<tr class="${x.rank === 1 && finished ? 'first' : ''}">
        <td>${x.rank === 1 && finished ? '<span class="rank1">1</span>' : x.rank}</td><td class="name">${esc(nameOf(x.id))}</td><td><b>${x.total}</b></td><td>${x.bonus}</td></tr>`).join('')}
      </tbody></table></div>

    <h2>Card</h2>
    <div class="tablewrap"><table>
      <thead><tr><th>${vegas ? 'End' : 'Tgt'}</th>${r.archerIds.map(aid => `<th>${esc(nameOf(aid))}</th>`).join('')}</tr></thead>
      <tbody>${Array.from({ length: r.targets }, (_, i) =>
        `<tr><td class="muted" style="font-size:1rem">${i + 1}</td>${r.archerIds.map(aid => (vegas ? endCell : cell)(r.scores[aid][i])).join('')}</tr>`).join('')}
      </tbody>
      <tfoot>
        <tr><td class="name">Total</td>${r.archerIds.map(aid => `<td>${tally(r, aid).total}</td>`).join('')}</tr>
        <tr><td class="name">${bonusLabel(r)}</td>${r.archerIds.map(aid => `<td>${tally(r, aid).bonus}</td>`).join('')}</tr>
      </tfoot></table></div>

    ${vegas ? roundGroups(r) : ''}

    ${finished
      ? `<button class="big" data-action="edit-round">Edit scores</button>`
      : `<button class="big primary" data-action="nav" data-to="#/round/${r.id}">Back to scoring</button>`}
    <div class="grid2">
      <button class="btn" data-action="edit-note">${r.note ? 'Edit note' : 'Add note'}</button>
      <button class="btn danger" data-action="delete-round">Delete round</button>
    </div>
  </main>`;
}

function viewHistory() {
  const rounds = [...db.rounds].sort((a, b) => b.createdAt - a.createdAt);
  return `${header('History', '#/')}
  <main>
    ${rounds.length ? rounds.map(r => {
      const finished = r.status === 'finished';
      const summary = finished
        ? ranking(r).map(x => `<span>${esc(nameOf(x.id))} <b>${x.total}</b></span>`).join('')
        : r.archerIds.map(id => `<span>${esc(nameOf(id))}</span>`).join('');
      return `<button class="card-row" data-action="nav" data-to="${finished ? '#/card/' : '#/round/'}${r.id}">
        <div class="title">${fmtDate(r.createdAt)}${finished ? '' : '<span class="badge">In progress</span>'}</div>
        <div class="muted small">${typeName(r)}, ${r.note ? esc(r.note) + ', ' : ''}${unitsLabel(r)}</div>
        <div class="scores-line">${summary}</div>
      </button>`;
    }).join('') : '<p class="empty">No rounds yet.</p>'}
  </main>`;
}

function archerRounds(id) {
  return db.rounds
    .filter(r => r.status === 'finished' && r.archerIds.includes(id))
    .sort((a, b) => a.createdAt - b.createdAt)
    .map(r => ({ r, n: r.targets, vegas: isVegas(r), ...tally(r, id) }))
    .map(x => ({ ...x, key: x.vegas ? 'vegas' : 'ibo-' + x.n, what: x.vegas ? 'Vegas 300' : `${x.n} targets` }));
}

// Best per round kind: Vegas 300 is kept apart from each IBO target count.
// Ties on total go to the higher 11s / Xs count.
function personalBests(rows) {
  const best = {};
  for (const x of rows) {
    const b = best[x.key];
    if (!b || x.total > b.total || (x.total === b.total && x.bonus > b.bonus)) best[x.key] = x;
  }
  return Object.values(best).sort((a, b) => a.vegas - b.vegas || a.n - b.n);
}
const markOf = x => (x.vegas ? 'X' : '11');

function viewArchers() {
  const list = activeArchers();
  return `${header('Archers', '#/')}
  <main>
    <form class="inline" data-form="add-archer">
      <input name="name" placeholder="New archer name" autocomplete="off" maxlength="40">
      <button class="btn">Add</button>
    </form>
    ${list.length ? list.map(a => {
      const rows = archerRounds(a.id);
      const pbs = personalBests(rows).map(x => `<span>Best ${x.vegas ? 'Vegas 300' : `${x.n}-target`} <b>${x.total}</b></span>`).join('');
      return `<button class="card-row" data-action="nav" data-to="#/archer/${a.id}">
        <div class="title">${esc(a.name)}</div>
        <div class="muted small">${rows.length} finished round${rows.length === 1 ? '' : 's'}</div>
        ${pbs ? `<div class="scores-line">${pbs}</div>` : ''}
      </button>`;
    }).join('') : '<p class="empty">No archers yet. Add one above.</p>'}
  </main>`;
}

function viewArcher(id) {
  const a = archerById(id);
  if (!a || a.deleted) { go('#/archers'); return null; }
  const rows = archerRounds(id);
  const pbs = personalBests(rows);
  const kinds = [false, true].map(vegas => rows.filter(x => x.vegas === vegas)).filter(k => k.length);
  const bonusTiles = list => {
    const sum = list.reduce((s, x) => s + x.bonus, 0);
    const top = list.reduce((b, x) => (!b || x.bonus > b.bonus ? x : b), null);
    const m = markOf(list[0]);
    return `<h2>${m}s${kinds.length > 1 ? ` <small class="muted">${list[0].vegas ? 'Vegas 300' : 'IBO 3D'}</small>` : ''}</h2>
    <div class="tiles">
      <div class="tile eleven"><div class="k">Total ${m}s</div><div class="v">${sum}</div>
        <div class="d">over ${list.length} round${list.length === 1 ? '' : 's'}</div></div>
      <div class="tile eleven"><div class="k">Best in one round</div><div class="v">${top.bonus}</div>
        <div class="d">${fmtShort(top.r.createdAt)}</div></div>
    </div>`;
  };

  return `${header(esc(a.name), '#/archers')}
  <main>
    ${rows.length ? `
    <h2>Personal bests</h2>
    <div class="tiles">
      ${pbs.map(x => `<div class="tile pb ${x.vegas ? 'vegas' : ''}"><div class="k">${x.what}</div>
        <div class="v">${x.total}</div><div class="d">${x.bonus}× ${markOf(x)}, ${fmtShort(x.r.createdAt)}</div></div>`).join('')}
    </div>
    ${kinds.map(bonusTiles).join('')}
    ${kinds.map(list => `<h2>${kinds.length > 1 ? (list[0].vegas ? 'Vegas 300 trend' : 'IBO trend') : 'Trend'}</h2>
    ${trendChart(list)}`).join('')}
    ${groupTrend(rows.filter(x => x.vegas), id)}
    <h2>Rounds</h2>
    ${[...rows].reverse().map(x => `<button class="card-row" data-action="nav" data-to="#/card/${x.r.id}">
      <div class="scores-line"><b>${x.total}</b><span class="muted">${x.bonus}× ${markOf(x)}</span><span class="muted">${x.what}</span></div>
      <div class="muted small">${fmtDate(x.r.createdAt)}${x.r.note ? ', ' + esc(x.r.note) : ''}</div>
    </button>`).join('')}`
    : '<p class="empty">No finished rounds yet. Stats appear here after a round is finished.</p>'}

    <button class="btn" data-action="nav" data-to="#/stats/${a.id}">Open in Analytics</button>
    <h2>Manage</h2>
    <div class="grid2">
      <button class="btn" data-action="rename-archer" data-id="${a.id}">Rename</button>
      <button class="btn danger" data-action="delete-archer" data-id="${a.id}">Delete archer</button>
    </div>
  </main>`;
}

// Raw totals over time, one line per round kind (target count, or Vegas 300).
function trendChart(rows) {
  if (rows.length < 2) return '<p class="muted">Finish at least two rounds to see a trend.</p>';
  const W = 360, H = 220, L = 42, R = 12, T = 14, B = 34;
  const totals = rows.map(x => x.total);
  let lo = Math.min(...totals), hi = Math.max(...totals);
  if (hi - lo < 10) { const mid = (hi + lo) / 2; lo = mid - 5; hi = mid + 5; }
  const pad = (hi - lo) * 0.1; lo = Math.floor(lo - pad); hi = Math.ceil(hi + pad);
  const x = i => L + (rows.length === 1 ? 0 : i * (W - L - R) / (rows.length - 1));
  const y = v => T + (hi - v) * (H - T - B) / (hi - lo);

  const counts = [...new Set(rows.map(r => r.key))];
  const color = n => SERIES_COLORS[counts.indexOf(n) % SERIES_COLORS.length];
  const what = n => rows.find(r => r.key === n).what;

  const ticks = [lo, Math.round((lo + hi) / 2), hi];
  const grid = ticks.map(v => `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke="#2b5590"/>
    <text x="${L - 6}" y="${y(v) + 5}" fill="#a9bcd6" font-size="15" text-anchor="end">${v}</text>`).join('');

  const series = counts.map(n => {
    const pts = rows.map((r, i) => ({ r, i })).filter(p => p.r.key === n);
    const path = pts.map((p, k) => `${k ? 'L' : 'M'}${x(p.i).toFixed(1)},${y(p.r.total).toFixed(1)}`).join(' ');
    return `<path d="${path}" fill="none" stroke="${color(n)}" stroke-width="3" stroke-linejoin="round"/>` +
      pts.map(p => `<circle cx="${x(p.i)}" cy="${y(p.r.total)}" r="6" fill="${color(n)}" stroke="#16325c" stroke-width="2">
        <title>${p.r.total}, ${fmtShort(p.r.r.createdAt)}</title></circle>`).join('');
  }).join('');

  const xl = `<text x="${L}" y="${H - 10}" fill="#a9bcd6" font-size="15">${fmtShort(rows[0].r.createdAt)}</text>
    <text x="${W - R}" y="${H - 10}" fill="#a9bcd6" font-size="15" text-anchor="end">${fmtShort(rows[rows.length - 1].r.createdAt)}</text>`;

  return `<div class="chart">
    <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Round totals over time">${grid}${series}${xl}</svg>
    <div class="legend">${counts.map(n => `<span><i style="background:${color(n)}"></i>${what(n)}</span>`).join('')}</div>
  </div>`;
}

/* ---------- arrow plotting (Vegas) ---------- */
// r.plots[aid][end][arrow] = {x, y} in cm from the spot centre, or null when
// that arrow was scored with the buttons instead of plotted.
function plotsOf(r, aid) {
  if (!r.plots) r.plots = {};
  if (!r.plots[aid]) r.plots[aid] = r.scores[aid].map(end => end.map(() => null));
  return r.plots[aid];
}
const hasPlots = (r, aid) => !!(r.plots && r.plots[aid] && r.plots[aid].some(e => e.some(Boolean)));
const plotAid = r => (r.archerIds.includes(r.plotAid) ? r.plotAid : r.archerIds[0]);
const END_COLORS = ['#0e2240', '#1767c4', '#6faf2f', '#f2621a', '#7a4fd0', '#0b8f8a', '#c2185b', '#5d4037', '#455a64', '#e0a100'];

function groupLine(g, what) {
  if (!g) return '';
  return `<div class="gline">${g.n > 1 ? `<span><small>${what}</small><b>${Target.fmtCm(g.spread)}</b></span>` : ''}
    <span><small>Centre</small><b>${Target.fmtCm(g.offset)}</b> ${Target.direction(g.cx, g.cy)}</span></div>`;
}

function plotPanel(r, t) {
  if (!r.plot) {
    return `<button class="btn plot-toggle" data-action="plot-toggle">Plot arrows on the target</button>`;
  }
  const aid = plotAid(r);
  const plots = plotsOf(r, aid);
  const end = plots[t];
  const full = !r.scores[aid][t].includes(null);
  // Earlier ends this round show faintly so you can see the group build up.
  const earlier = plots.slice(0, t).flat().filter(Boolean).map(p => ({ ...p, color: 'rgba(14,34,64,.28)', ghost: true }));
  const fresh = justPlaced && justPlaced.aid === aid && justPlaced.end === t ? justPlaced.k : -1;
  justPlaced = null;
  const now = end.map((p, k) => p && { ...p, label: k + 1, cls: k === fresh ? 'new' : '' }).filter(Boolean);
  const face = Target.faceSvg({ arrows: [...earlier, ...now], showGroup: now.length > 1 ? Target.group(now) : null,
    ariaLabel: `Target face for ${nameOf(aid)}, end ${t + 1}` })
    .replace('<svg ', `<svg data-plot="1" data-aid="${aid}" `);
  const tabs = r.archerIds.length > 1 ? `<div class="ptabs">${r.archerIds.map(id => {
    const done = !r.scores[id][t].includes(null);
    return `<button class="${id === aid ? 'on' : ''} ${done ? 'done' : ''}" data-action="plot-archer" data-aid="${id}">${esc(nameOf(id))}</button>`;
  }).join('')}</div>` : '';
  return `<section class="plot">
    <div class="plot-head"><b>Plot arrows</b>
      <button class="link" data-action="plot-toggle">Use buttons only</button></div>
    ${tabs}
    <div class="face-wrap">${face}</div>
    <p class="muted small plot-hint">${full
      ? 'End complete. Tap an arrow score below to clear and re-plot it.'
      : `Press where ${r.archerIds.length > 1 ? esc(nameOf(aid)) + '’s ' : ''}arrow ${r.scores[aid][t].indexOf(null) + 1} landed. Slide slowly to fine-tune, then lift to place.`}</p>
    ${groupLine(Target.group(now), 'This end')}
  </section>`;
}

// Called by Plot when a finger lifts off the face.
let justPlaced = null;   // the arrow to animate in on the next render
function placeArrow(data, pt) {
  const r = currentRound(); if (!r || !isVegas(r) || !r.plot) return;
  const aid = data.aid;
  const end = r.scores[aid][r.current];
  const k = end.indexOf(null);
  if (k < 0) return;
  const s = Target.scoreAt(pt.x, pt.y);
  end[k] = s.x ? 'X' : s.score;
  plotsOf(r, aid)[r.current][k] = { x: pt.x, y: pt.y };
  justPlaced = { aid, end: r.current, k };
  // End done for this archer: move on to the next archer still shooting this end.
  if (!end.includes(null)) {
    const i = r.archerIds.indexOf(aid);
    const next = [...r.archerIds.slice(i + 1), ...r.archerIds.slice(0, i)]
      .find(id => r.scores[id][r.current].includes(null));
    r.plotAid = next || r.archerIds[0];
  }
  save(); render();
}

// Scorecard: every plotted arrow of the round, coloured by end, with group stats.
function roundGroups(r) {
  const who = r.archerIds.filter(aid => hasPlots(r, aid));
  if (!who.length) return '';
  return `<h2>Arrow groups</h2>` + who.map(aid => {
    const plots = r.plots[aid];
    const arrows = plots.flatMap((end, i) => end.filter(Boolean).map(p => ({ ...p, color: END_COLORS[i % END_COLORS.length] })));
    const g = Target.group(arrows);
    const ends = plots.map((end, i) => ({ i, g: Target.group(end) })).filter(e => e.g);
    return `<div class="gcard">
      ${r.archerIds.length > 1 ? `<h3>${esc(nameOf(aid))}</h3>` : ''}
      <div class="face-wrap small">${Target.faceSvg({ arrows, showGroup: g, view: Target.fit(arrows), ariaLabel: `All plotted arrows for ${nameOf(aid)}` })}</div>
      ${groupLine(g, 'Round group')}
      ${g.n > 1 ? `<p class="muted small">Average distance from the group centre: ${Target.fmtCm(g.meanR)}, over ${g.n} plotted arrows.</p>` : ''}
      <div class="tablewrap"><table class="gtable">
        <thead><tr><th>End</th><th>Group</th><th>Centre</th></tr></thead>
        <tbody>${ends.map(e => `<tr><td><i class="dot" style="background:${END_COLORS[e.i % END_COLORS.length]}"></i>${e.i + 1}</td>
          <td>${e.g.n > 1 ? Target.fmtCm(e.g.spread) : '–'}</td>
          <td>${Target.fmtCm(e.g.offset)} <span class="muted">${Target.direction(e.g.cx, e.g.cy)}</span></td></tr>`).join('')}
        </tbody></table></div>
    </div>`;
  }).join('');
}

// Per round: average end group size, and how far the whole round's centre sat from the middle.
function roundGroupStats(r, aid) {
  if (!hasPlots(r, aid)) return null;
  const ends = r.plots[aid].map(e => Target.group(e)).filter(g => g && g.n > 1);
  const all = Target.group(r.plots[aid].flat());
  return {
    size: ends.length ? ends.reduce((s, g) => s + g.spread, 0) / ends.length : null,
    offset: all.offset, cx: all.cx, cy: all.cy, n: all.n
  };
}

function groupTrend(rows, aid) {
  const pts = rows.map(x => ({ x, s: roundGroupStats(x.r, aid) })).filter(p => p.s);
  if (!pts.length) return '';
  const last = pts[pts.length - 1];
  const tiles = `<div class="tiles">
    <div class="tile"><div class="k">Avg end group</div><div class="v">${last.s.size == null ? '–' : last.s.size.toFixed(1)}<small> cm</small></div>
      <div class="d">last round, ${fmtShort(last.x.r.createdAt)}</div></div>
    <div class="tile"><div class="k">Last group centre</div><div class="v">${last.s.offset.toFixed(1)}<small> cm</small></div>
      <div class="d">${Target.direction(last.s.cx, last.s.cy)}</div></div>
  </div>`;
  if (pts.length < 2) return `<h2>Arrow groups</h2>${tiles}<p class="muted">Plot arrows in two rounds to see a group trend.</p>`;

  const W = 360, H = 200, L = 42, R = 12, T = 14, B = 34;
  const vals = pts.flatMap(p => [p.s.size, p.s.offset]).filter(v => v != null);
  const hi = Math.max(2, Math.ceil(Math.max(...vals) * 1.15));
  const x = i => L + i * (W - L - R) / (pts.length - 1);
  const y = v => T + (hi - v) * (H - T - B) / hi;
  const line = (key, color, label) => {
    const p = pts.map((q, i) => ({ i, v: q.s[key], q })).filter(q => q.v != null);
    if (!p.length) return '';
    return `<path d="${p.map((q, k) => `${k ? 'L' : 'M'}${x(q.i).toFixed(1)},${y(q.v).toFixed(1)}`).join(' ')}"
      fill="none" stroke="${color}" stroke-width="3" stroke-linejoin="round"/>` +
      p.map(q => `<circle cx="${x(q.i)}" cy="${y(q.v)}" r="5.5" fill="${color}" stroke="#16325c" stroke-width="2">
        <title>${label} ${q.v.toFixed(1)} cm, ${fmtShort(q.q.x.r.createdAt)}</title></circle>`).join('');
  };
  const ticks = [0, hi / 2, hi];
  const grid = ticks.map(v => `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" stroke="#2b5590"/>
    <text x="${L - 6}" y="${y(v) + 5}" fill="#a9bcd6" font-size="15" text-anchor="end">${+v.toFixed(1)}</text>`).join('');
  const xl = `<text x="${L}" y="${H - 10}" fill="#a9bcd6" font-size="15">${fmtShort(pts[0].x.r.createdAt)}</text>
    <text x="${W - R}" y="${H - 10}" fill="#a9bcd6" font-size="15" text-anchor="end">${fmtShort(last.x.r.createdAt)}</text>`;
  return `<h2>Arrow groups <small class="muted">cm, lower is better</small></h2>${tiles}
  <div class="chart">
    <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Group size and centre offset over time">${grid}
      ${line('size', SERIES_COLORS[0], 'End group')}${line('offset', SERIES_COLORS[1], 'Centre off')}${xl}</svg>
    <div class="legend"><span><i style="background:${SERIES_COLORS[0]}"></i>Avg end group</span>
      <span><i style="background:${SERIES_COLORS[1]}"></i>Centre offset</span></div>
  </div>`;
}

function viewBackup() {
  const finished = db.rounds.filter(r => r.status === 'finished').length;
  return `${header('Backup and export', '#/')}
  <main>
    <p class="muted">${activeArchers().length} archer${activeArchers().length === 1 ? '' : 's'},
      ${db.rounds.length} round${db.rounds.length === 1 ? '' : 's'} (${finished} finished) on this phone.</p>

    <h2>Backup</h2>
    <p class="muted small">Saves every archer, round and score to one file. Keep it somewhere safe, like Google Drive, so you can restore after a new phone or a reinstall.</p>
    <button class="big primary" data-action="export-json">Save backup file</button>

    <h2>Restore</h2>
    <p class="muted small">Replaces everything on this phone with the contents of a backup file. You will be asked to confirm first.</p>
    <label class="btn file-btn">Restore from backup file
      <input type="file" accept=".json,application/json" data-input="import-json">
    </label>

    <h2>Spreadsheet</h2>
    <p class="muted small">Every score from every round as a CSV file that opens in Excel or Google Sheets. This file cannot be restored.</p>
    <button class="btn" data-action="export-csv" ${db.rounds.length ? '' : 'disabled'}>Export scorecards (CSV)</button>
  </main>`;
}

/* ---------- backup, restore and CSV ---------- */
const BACKUP_APP = 'ropers-archery-scorecard';
const BACKUP_FORMAT = 1;
const today = () => new Date().toISOString().slice(0, 10);

function download(name, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function backupText() {
  return JSON.stringify({
    app: BACKUP_APP, format: BACKUP_FORMAT, storageKey: KEY,
    exportedAt: new Date().toISOString(), data: db
  }, null, 2);
}

// Checks a parsed backup file and returns the data to restore, or throws a
// readable message. Round objects are kept as-is (unknown fields included) so
// newer round types survive a round trip.
function parseBackup(obj) {
  if (!obj || typeof obj !== 'object') throw new Error('The file is not a backup.');
  if (obj.app !== undefined && obj.app !== BACKUP_APP) throw new Error('This backup is from a different app.');
  if (typeof obj.format === 'number' && obj.format > BACKUP_FORMAT) {
    throw new Error('This backup was made by a newer version of the app. Update the app and try again.');
  }
  const d = obj.data !== undefined ? obj.data : obj;
  if (!d || !Array.isArray(d.archers) || !Array.isArray(d.rounds)) {
    throw new Error('The file has no archers or rounds in it.');
  }
  const ids = new Set();
  d.archers.forEach((a, i) => {
    if (!a || typeof a.id !== 'string' || typeof a.name !== 'string') throw new Error(`Archer ${i + 1} is damaged.`);
    if (ids.has(a.id)) throw new Error(`Archer "${a.name}" appears twice.`);
    ids.add(a.id);
  });
  const roundIds = new Set();
  d.rounds.forEach((r, i) => {
    const bad = () => new Error(`Round ${i + 1} is damaged.`);
    if (!r || typeof r.id !== 'string' || roundIds.has(r.id)) throw bad();
    if (!Array.isArray(r.archerIds) || !r.scores || typeof r.scores !== 'object') throw bad();
    if (!r.archerIds.every(id => typeof id === 'string' && Array.isArray(r.scores[id]))) throw bad();
    roundIds.add(r.id);
  });
  return d;
}

const CSV_HEAD = ['Date', 'Round ID', 'Round type', 'Note', 'Status', 'Archer',
  'Target or end', 'Arrow', 'Score', 'Points', 'Plot X (cm)', 'Plot Y (cm)'];
const csvCell = v => {
  let s = v == null ? '' : String(v);
  if (typeof v === 'string' && /^[=+@\t-]/.test(s)) s = "'" + s;   // keep spreadsheets from running it as a formula
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

// One row per IBO target, or per Vegas arrow (with its plotted spot when there
// is one), so the file pivots easily in a spreadsheet.
function scorecardsCsv() {
  const rows = [CSV_HEAD];
  const rounds = [...db.rounds].sort((a, b) => a.createdAt - b.createdAt);
  for (const r of rounds) {
    const head = [new Date(r.createdAt).toISOString().slice(0, 10), r.id, typeName(r), r.note || '', r.status];
    for (const aid of r.archerIds) {
      const plots = r.plots && r.plots[aid];
      (r.scores[aid] || []).forEach((v, i) => {
        if (!Array.isArray(v)) { rows.push([...head, nameOf(aid), i + 1, '', v, v]); return; }
        v.forEach((a, k) => {
          const p = plots && plots[i] && plots[i][k];
          rows.push([...head, nameOf(aid), i + 1, k + 1, a, a == null ? null : points(a),
            p ? +p.x.toFixed(2) : null, p ? +p.y.toFixed(2) : null]);
        });
      });
    }
  }
  return rows.map(row => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
}

async function importBackup(file) {
  let data;
  try {
    data = parseBackup(JSON.parse(await file.text()));
  } catch (e) {
    alertBox('Could not restore', `<p>${esc(e instanceof SyntaxError ? 'The file is not a valid backup.' : e.message)}</p>`);
    return;
  }
  const archers = data.archers.filter(a => !a.deleted).length;
  const ok = await confirmBox('Restore this backup?',
    `<p>The backup has <b>${archers}</b> archer${archers === 1 ? '' : 's'} and <b>${data.rounds.length}</b> round${data.rounds.length === 1 ? '' : 's'}.</p>
     <p>Everything on this phone now (${activeArchers().length} archers, ${db.rounds.length} rounds) will be replaced. Save a backup first if you might want it back.</p>`,
    'Replace and restore', true);
  if (!ok) return;
  migrate(data);
  db = data;
  draft = null;
  save();
  await alertBox('Backup restored', `<p>${archers} archers and ${data.rounds.length} rounds restored.</p>`);
  go('#/');
}

/* ---------- actions ---------- */
const currentRound = () => roundById(route().id);

const actions = {
  nav: d => go(d.to),

  'new-round': () => { draft = null; go('#/new'); },

  'stats-set': d => { Stats.set(d); render(); },

  'toggle-pick': d => {
    const i = draft.selected.indexOf(d.id);
    if (i >= 0) draft.selected.splice(i, 1); else draft.selected.push(d.id);
    render();
  },

  'draft-type': d => { draft.type = d.type === 'vegas' ? 'vegas' : 'ibo'; render(); },

  'draft-targets': d => {
    draft.targets = Math.min(100, Math.max(1, draft.targets + Number(d.d)));
    render();
  },

  'start-round': () => {
    if (!draft || !draft.selected.length) return;
    const vegas = draft.type === 'vegas';
    const r = {
      id: uid(), createdAt: Date.now(), note: draft.note.trim(), type: vegas ? 'vegas' : 'ibo',
      targets: vegas ? VEGAS_ENDS : draft.targets, archerIds: [...draft.selected],
      scores: {}, current: 0, status: 'in_progress'
    };
    if (vegas) {
      const lastVegas = [...db.rounds].filter(isVegas).sort((a, b) => b.createdAt - a.createdAt)[0];
      r.plot = !!(lastVegas && lastVegas.plot);
    }
    r.archerIds.forEach(aid => {
      r.scores[aid] = vegas
        ? Array.from({ length: VEGAS_ENDS }, () => Array(VEGAS_ARROWS).fill(null))
        : Array(r.targets).fill(null);
    });
    db.rounds.push(r);
    save();
    draft = null;
    go('#/round/' + r.id);
  },

  score: d => {
    const r = currentRound(); if (!r) return;
    const v = Number(d.v);
    const arr = r.scores[d.aid];
    arr[r.current] = arr[r.current] === v ? null : v;   // tap again to clear
    save(); render();
  },

  vscore: d => {
    const r = currentRound(); if (!r || !isVegas(r)) return;
    const end = r.scores[d.aid][r.current];
    const k = end.indexOf(null); if (k < 0) return;
    end[k] = d.v === 'X' ? 'X' : Number(d.v);
    save(); render();
  },

  vclear: d => {
    const r = currentRound(); if (!r || !isVegas(r)) return;
    r.scores[d.aid][r.current][Number(d.k)] = null;
    const pe = plotsOf(r, d.aid)[r.current]; pe[Number(d.k)] = null;
    save(); render();
  },

  'plot-toggle': () => {
    const r = currentRound(); if (!r || !isVegas(r)) return;
    r.plot = !r.plot;
    save(); render();
  },

  'plot-archer': d => {
    const r = currentRound(); if (!r) return;
    r.plotAid = d.aid;
    save(); render();
  },

  move: d => {
    const r = currentRound(); if (!r) return;
    r.current = Math.min(r.targets - 1, Math.max(0, r.current + Number(d.d)));
    save(); render();
  },

  jump: d => {
    const r = currentRound(); if (!r) return;
    r.current = Number(d.t);
    save(); render();
  },

  'add-target': () => {
    const r = currentRound(); if (!r || isVegas(r)) return;
    r.targets++;
    r.archerIds.forEach(aid => r.scores[aid].push(null));
    r.current = r.targets - 1;
    save(); render();
  },

  'remove-target': async () => {
    const r = currentRound(); if (!r || isVegas(r) || r.targets <= 1) return;
    const last = r.targets - 1;
    const hasScores = r.archerIds.some(aid => r.scores[aid][last] != null);
    if (hasScores && !(await confirmBox(`Remove target ${last + 1}?`,
        '<p>Scores have been entered on this target. They will be deleted.</p>', 'Remove', true))) return;
    r.targets--;
    r.archerIds.forEach(aid => r.scores[aid].pop());
    if (r.current > r.targets - 1) r.current = r.targets - 1;
    save(); render();
  },

  finish: async () => {
    const r = currentRound(); if (!r) return;
    const editing = r.status === 'finished';
    const gaps = gapsOf(r);
    if (gaps.length) {
      const u = unit(r).toLowerCase();
      const list = gaps.map(g => `<li><b>${esc(nameOf(g.aid))}</b>: ${u}${g.missing.length > 1 ? 's' : ''} ${g.missing.join(', ')}</li>`).join('');
      const ok = await confirmBox(isVegas(r) ? 'Some arrows are blank' : 'Some targets are blank',
        `<ul>${list}</ul><p>Blank ${isVegas(r) ? 'arrows' : 'targets'} will be scored as <b>0 (miss)</b>.</p>`,
        editing ? 'Save as 0' : 'Finish anyway');
      if (!ok) return;
      gaps.forEach(g => g.missing.forEach(n => {
        if (isVegas(r)) r.scores[g.aid][n - 1] = r.scores[g.aid][n - 1].map(v => (v == null ? 0 : v));
        else r.scores[g.aid][n - 1] = 0;
      }));
    } else if (!editing && !(await confirmBox('Finish round?',
        '<p>You can still edit scores afterwards from History.</p>', 'Finish'))) {
      return;
    }
    r.status = 'finished';
    r.finishedAt = r.finishedAt || Date.now();
    save();
    go('#/card/' + r.id);
  },

  'edit-round': () => {
    const r = currentRound(); if (!r) return;
    r.current = 0; save();
    go('#/round/' + r.id);
  },

  'edit-note': async () => {
    const r = currentRound(); if (!r) return;
    const text = await promptBox('Round note', r.note || '', 'e.g. Club shoot');
    if (text == null) return;
    r.note = text.trim().slice(0, 60);
    save(); render();
  },

  'delete-round': async () => {
    const r = currentRound(); if (!r) return;
    if (!(await confirmBox('Delete this round?',
        `<p>${fmtDate(r.createdAt)}${r.note ? ' · ' + esc(r.note) : ''}</p><p>This cannot be undone.</p>`,
        'Delete', true))) return;
    db.rounds = db.rounds.filter(x => x.id !== r.id);
    save();
    go('#/history');
  },

  'rename-archer': async d => {
    const a = archerById(d.id); if (!a) return;
    const text = await promptBox('Rename archer', a.name, 'Name');
    if (text == null) return;
    const name = text.trim().replace(/\s+/g, ' ');
    if (!name || name === a.name) return;
    if (activeArchers().some(x => x.id !== a.id && x.name.toLowerCase() === name.toLowerCase())) {
      alertBox('Name already used', `There is already an archer named <b>${esc(name)}</b>.`);
      return;
    }
    a.name = name.slice(0, 40);
    save(); render();
  },

  'export-json': () => download(`ropers-archery-backup-${today()}.json`, backupText(), 'application/json'),

  'export-csv': () => download(`ropers-archery-scorecards-${today()}.csv`, scorecardsCsv(), 'text/csv'),

  'delete-archer': async d => {
    const a = archerById(d.id); if (!a) return;
    if (!(await confirmBox(`Delete ${a.name}?`,
        '<p>Their stats and personal bests will be removed. Their name will still appear on past group scorecards so other archers’ rounds stay complete.</p>',
        'Delete', true))) return;
    a.deleted = true;
    save();
    go('#/archers');
  }
};

const forms = {
  'add-and-pick': f => {
    const a = addArcher(f.elements.name.value);
    if (a) { draft.selected.push(a.id); render(); }
  },
  'add-archer': f => {
    if (addArcher(f.elements.name.value)) render();
  }
};

app.addEventListener('click', e => {
  const el = e.target.closest('[data-action]');
  if (!el || el.disabled) return;
  const fn = actions[el.dataset.action];
  if (fn) fn(el.dataset, el);
});
app.addEventListener('submit', e => {
  e.preventDefault();
  const fn = forms[e.target.dataset.form];
  if (fn) fn(e.target);
});
app.addEventListener('input', e => {
  if (e.target.dataset.input === 'draft-note' && draft) draft.note = e.target.value;
});
app.addEventListener('change', e => {
  if (e.target.dataset.input !== 'import-json') return;
  const file = e.target.files && e.target.files[0];
  e.target.value = '';                  // let the same file be picked again
  if (file) importBackup(file);
});

/* ---------- offline support ---------- */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  // When a new version finishes installing, reload once so it shows right away.
  const hadController = !!navigator.serviceWorker.controller;
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hadController && !reloaded && !document.querySelector('.modal-wrap')) { reloaded = true; location.reload(); }
  });
}

render();
