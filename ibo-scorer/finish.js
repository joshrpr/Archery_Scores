'use strict';

/* The scorebook's walk-up: recorded shots, one replay, then the result.
   This view never changes a score or invents a plotted position. */
const Finish = (() => {
  const target = typeof Target !== 'undefined' ? Target : require('./target.js');
  const f = v => +v.toFixed(3);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const reduced = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let activeClose = null;

  // Coincident plots are separate shots; an entered score has no coordinates.
  function shotPlan(s) {
    const vegas = s.type === 'vegas';
    let shots;
    if (vegas) {
      shots = (s.arrows || []).filter(p => p && Number.isFinite(p.x) && Number.isFinite(p.y))
        .map((p, i) => ({ ...p, index: Number.isInteger(p.index) ? p.index : i }))
        .sort((a, b) => a.index - b.index);
    } else {
      const radius = { 11: 1.25, 10: 3.45, 8: 6.05, 5: 8.65, 0: 10.65 };
      const tally = s.tally || [];
      const counts = {}, seen = {};
      tally.forEach(v => { if (v != null && Object.hasOwn(radius, v)) counts[v] = (counts[v] || 0) + 1; });
      shots = tally.flatMap((value, index) => {
        if (value == null || !Object.hasOwn(radius, value)) return [];
        const n = seen[value] || 0;
        seen[value] = n + 1;
        const angle = -Math.PI / 2 + (n + 1) * 2 * Math.PI / (counts[value] + 1);
        const r = radius[value];
        return [{ value, index, x: f(Math.cos(angle) * r), y: f(Math.sin(angle) * r) }];
      });
    }
    return { kind: vegas ? 'vegas' : 'ibo', shots, prior: shots.slice(0, -1),
      last: shots.length ? shots[shots.length - 1] : null, symbolic: !vegas || !shots.length };
  }

  function arrow(p, last, order, symbolic) {
    const data = `data-shot="${p.index}" data-x="${p.x}" data-y="${p.y}"${symbolic ? ` data-score="${p.value}"` : ''}`;
    const body = symbolic
      ? `<ellipse cx=".05" cy=".12" rx=".22" ry=".12" fill="#14283d" opacity=".15"/>
         <path d="M0 0V-.45" stroke="#26333b" stroke-width=".13"/>
         <path d="M-.14 -.35L0 -.65 .14 -.35Z" fill="#b95529"/>
         <circle cy="-.57" r=".095" fill="#f9f3e6"/>`
      : `<ellipse cx=".08" cy=".1" rx=".2" ry=".13" fill="#152332" opacity=".28"/>
         <g transform="rotate(-32)">
           <path d="M0 .13L3.5 .13" stroke="#172331" stroke-width=".17" opacity=".1"/>
           <path d="M0 0H3.55" stroke="#172331" stroke-width=".13" stroke-linecap="round"/>
           <path d="M.12 -.035H3.45" stroke="#6e7b80" stroke-width=".035"/>
           <path d="M2.2 0Q2.55 -.38 3.12 -.3L3.35 -.07 2.5 .03Z" fill="#b95529"/>
           <path d="M2.25 .04Q2.6 .36 3.15 .28L3.37 .08 2.55 -.01Z" fill="#faf6e8" stroke="#b8af9c" stroke-width=".035"/>
           <path d="M2.35 -.03L3.32 -.12 3.38 -.035 2.5 .05Z" fill="#fffaf0"/>
           <path d="M3.4 0H3.7" stroke="#cb7444" stroke-width=".15" stroke-linecap="round"/>
           <path d="M3.66 -.065V.065" stroke="#7f4226" stroke-width=".04"/>
         </g>`;
    return `<g class="${last ? 'fin-last' : 'fin-pin'}" ${data} style="--d:${order}" transform="translate(${f(p.x)} ${f(p.y)})">
      <g class="fin-nock-in">${body}</g></g>`;
  }

  function face(plan) {
    const pins = plan.shots.map((p, i) => arrow(p, p === plan.last, i, plan.kind === 'ibo')).join('');
    if (plan.kind === 'ibo') {
      const bands = [{ r: 10, value: 5, color: '#e6dfd0' }, { r: 7.4, value: 8, color: '#ede6d9' },
        { r: 4.8, value: 10, color: '#f4ecdc' }, { r: 2.2, value: 11, color: '#f8efdf' }];
      return `<svg class="fin-face fin-medallion" viewBox="-12 -12 24 24" aria-hidden="true">
        <circle cy=".28" r="10.3" fill="#14283d" opacity=".08"/>
        ${bands.map(b => `<circle r="${b.r}" fill="${b.color}" stroke="#9b8b70" stroke-width=".055"/>
          <text y="${f(-b.r + .88)}" class="fin-band">${b.value}</text>`).join('')}
        ${pins}${plan.shots.some(p => p.value === 0) ? '<text y="11.65" class="fin-band fin-miss-label">M · outside score bands</text>' : ''}</svg>`;
    }
    // The material image is unprinted. All rings and plots use exact geometry.
    const colors = { 10: '#eac746', 9: '#eac746', 8: '#d95747', 7: '#d95747', 6: '#4386b0' };
    const far = Math.max(15, ...plan.shots.map(p => Math.max(Math.abs(p.x) + 3.8, Math.abs(p.y) + .8)));
    return `<svg class="fin-face" viewBox="${-far} ${-far} ${far * 2} ${far * 2}" aria-hidden="true">
      <rect x="-13.5" y="-13.5" width="27" height="27" rx=".18" fill="#303332"/>
      <rect x="-10.9" y="-10.9" width="21.8" height="21.8" fill="#fbf6e8"/>
      <image href="images/finish-butt.webp" x="-15" y="-14.7" width="30" height="30"/>
      ${[...target.RINGS].reverse().map(r => `<circle r="${r.r}" fill="${colors[r.score]}" stroke="#493f2e" stroke-width=".055"/>`).join('')}
      <circle r="${target.X_R}" fill="none" stroke="#61512f" stroke-width=".045"/>
      <path d="M-.23 0H.23M0 -.23V.23" stroke="#61512f" stroke-width=".055"/>
      ${pins}${!plan.shots.length ? `<g class="fin-decoration" data-decoration="true" transform="translate(0 12.3)">
        <path d="M-3 0H3" stroke="#b95529" stroke-width=".11"/><path d="M-3 0l.8 -.3m-.8 .3l.8 .3M3 0l-.4 -.15m.4 .15l-.4 .15" fill="none" stroke="#b95529" stroke-width=".08"/></g>` : ''}
      </svg>`;
  }

  function html(s) {
    const plan = shotPlan(s), vegas = plan.kind === 'vegas';
    const board = s.board || [], featured = s.featuredName || (board[0] && board[0].name) || 'Archer';
    const ties = board.filter(b => b.rank === 1);
    const name = ties.length > 1 ? ties.map(b => b.name).join(' & ') : featured;
    const title = s.title || (board.length > 1 ? 'Round winner' : 'Round complete');
    const bonus = s.bonus == null ? 0 : s.bonus, mark = vegas ? 'Xs' : '11s';
    const scored = s.scored == null ? (vegas ? 30 : plan.shots.length) : s.scored;
    const slots = s.totalSlots || (vegas ? 30 : (s.tally || []).length);
    const round = vegas ? 'Vegas 300' : 'IBO 3D';
    const caption = vegas ? `${featured}’s plotted shots` : 'Score medallion';
    const ownership = vegas ? caption : `${featured}’s score medallion`;
    const plotted = vegas ? `${plan.shots.length} of ${scored} arrows plotted` : `${plan.shots.length} of ${slots} targets recorded`;
    const detail = vegas ? (plan.last ? 'Last plotted shot · replay' : 'Completion animation · no plotted positions') : 'Score bands, not shot locations';
    const unit = vegas ? 'arrows' : 'targets';
    const meta = `${round} · ${scored === slots ? `${scored} ${unit}` : `${scored} of ${slots} ${unit} scored`}`;
    const table = board.length > 1 ? `<table class="fin-board"><caption>Standings</caption>
      <thead><tr><th scope="col"><span class="fin-sr">Rank</span></th><th scope="col">Archer</th><th scope="col">Score</th><th scope="col">${mark}</th></tr></thead>
      <tbody>${board.map(b => `<tr${b.rank === 1 ? ' class="first"' : ''}>
        <td class="fin-rank">${esc(b.rank)}${b.tie ? '=' : ''}</td><th scope="row" class="fin-name">${esc(b.name)}${b.pb ? '<small class="fin-pb">New best</small>' : ''}</th>
        <td class="fin-points">${esc(b.total)}</td><td class="fin-xs">${esc(b.bonus == null ? 0 : b.bonus)}</td></tr>`).join('')}</tbody></table>` : '';
    return `<div class="fin ${plan.kind}" role="dialog" aria-modal="true" aria-label="${esc(s.head || 'Round complete')}" tabindex="-1" style="--step:${Math.min(70, 600 / Math.max(1, plan.prior.length))}ms">
      <div class="fin-shell"><header class="fin-header">
        <div class="fin-brand">Ropers Archery<span class="fin-round-label">${round}</span></div>
        <button type="button" class="fin-skip" data-fin="skip">Skip</button></header>
      <div class="fin-main" role="region" aria-label="Round results and standings" tabindex="-1"><div class="fin-scene">
        <div class="fin-intro" aria-hidden="true"><h2>Round complete</h2><p>Walking up to the target</p></div>
        <div class="fin-stage" aria-hidden="true"><div class="fin-bale">${face(plan)}</div></div>
        <div class="fin-caption" aria-hidden="true"><strong>${esc(caption)}</strong><span>${esc(plotted)}</span><small>${esc(detail)}</small></div>
        <div class="fin-result-head" aria-hidden="true"><p class="fin-kicker">${esc(title)}</p><h2 id="fin-title">${esc(name)}</h2></div>
      </div><div class="fin-copy" aria-hidden="true">
        <div class="fin-metrics"><div class="fin-score"><b>${esc(s.total)}</b>${vegas ? '<span class="fin-max">/ 300</span>' : '<span class="fin-score-label">Score</span>'}</div>
          <div class="fin-bonus"><b>${esc(bonus)}</b><span>${mark}</span></div></div>
        <p class="fin-meta">${esc(meta)}</p>
        ${s.previousBest ? `<p class="fin-previous">Previous best <b>${esc(s.previousBest.total)}</b> · ${esc(s.previousBest.bonus)} ${mark}</p>` : ''}
        ${table}<p class="fin-note">${esc(ownership)} · ${esc(plotted)}${!vegas ? '<br>Score bands, not shot locations' : ''}</p>
      </div></div><footer class="fin-footer"><button type="button" class="fin-go" data-fin="go" disabled>See scorecard
        <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="M4 12h15m-6-6 6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button></footer></div></div>`;
  }

  function play(s, haptic = {}) {
    if (activeClose) activeClose(true);
    return new Promise(resolve => {
      const wrap = document.createElement('div');
      wrap.innerHTML = html(s);
      const el = wrap.firstElementChild;
      const previousFocus = document.activeElement;
      const page = document.getElementById('app');
      const wasInert = page ? page.inert : false;
      const overflow = document.body.style.overflow;
      if (page) page.inert = true;
      document.body.style.overflow = 'hidden';
      document.body.appendChild(el);
      const go = el.querySelector('.fin-go'), skip = el.querySelector('.fin-skip');
      const main = el.querySelector('.fin-main');
      const timers = [];
      let closed = false, resultsVisible = false;
      const later = (ms, fn) => timers.push(setTimeout(() => { if (!closed) fn(); }, ms));
      const clear = () => timers.forEach(clearTimeout);
      const focus = node => { if (node && node.focus) node.focus({ preventScroll: true }); };
      const reveal = () => {
        resultsVisible = true;
        el.classList.add('results');
        el.querySelector('.fin-copy').setAttribute('aria-hidden', 'false');
        el.querySelector('.fin-result-head').setAttribute('aria-hidden', 'false');
        go.disabled = false;
        main.tabIndex = 0;
        skip.hidden = true;
        focus(go);
      };
      const finishNow = () => {
        clear();
        el.classList.add('skip', 'revealing', 'flying', 'landed', 'settled');
        reveal();
      };
      const close = (immediate = false) => {
        if (closed) return;
        closed = true;
        clear();
        document.removeEventListener('keydown', onKey);
        window.removeEventListener('hashchange', onHash);
        if (query && query.removeEventListener) query.removeEventListener('change', onMotion);
        if (page) page.inert = wasInert;
        document.body.style.overflow = overflow;
        if (activeClose === close) activeClose = null;
        if (immediate || reduced()) el.remove();
        else { el.classList.add('out'); setTimeout(() => el.remove(), 180); }
        if (!immediate) {
          const destination = previousFocus && previousFocus.isConnected && previousFocus !== document.body
            ? previousFocus : document.querySelector('#app h1, #app button');
          if (destination && destination.tagName === 'H1') destination.setAttribute('tabindex', '-1');
          focus(destination);
        }
        resolve();
      };
      const startHash = location.hash;
      const onHash = () => { if (location.hash !== startHash) close(); };
      const onMotion = e => { if (e.matches) finishNow(); };
      const onKey = e => {
        if (e.key === 'Escape') { e.preventDefault(); close(); }
        else if (!resultsVisible && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); finishNow(); }
        else if (e.key === 'Tab') {
          e.preventDefault();
          // The standings can overflow on a small phone. Keep their scroll
          // region in the focus cycle so keyboard users can read every row.
          focus(resultsVisible ? (document.activeElement === go ? main : go) : skip);
        }
      };
      el.addEventListener('click', e => {
        const button = e.target.closest('[data-fin]');
        if (button && button.dataset.fin === 'go' && resultsVisible) close();
        else if (!resultsVisible) finishNow();
      });
      const query = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
      if (query && query.addEventListener) query.addEventListener('change', onMotion);
      document.addEventListener('keydown', onKey);
      window.addEventListener('hashchange', onHash);
      activeClose = close;
      if (reduced()) { finishNow(); return; }
      focus(skip);
      later(650, () => el.classList.add('revealing'));
      later(1450, () => el.classList.add('flying'));
      later(1800, () => {
        el.classList.add('landed');
        // One LIGHT tap; haptic failure must not interrupt the result.
        try { const p = haptic.tap && haptic.tap(); if (p && p.catch) p.catch(() => {}); } catch (_) { /* optional */ }
      });
      later(1900, reveal);
      later(2650, () => el.classList.add('settled'));
    });
  }

  return { play, html, shotPlan };
})();

if (typeof module !== 'undefined') module.exports = Finish;
