'use strict';

/* =========================================================
   Round complete: the walk up to the target.
   After the last arrow you walk to the bale to pull your arrows,
   and that is when you see the whole round at once. This plays
   that moment: the face comes up close, the round's arrows are
   in it (nock and fletching towards you, as you see them at the
   bale), a last arrow thuds into the middle, and the result lands.
   About four seconds; a tap skips straight to the end state.
   ========================================================= */

const Finish = (() => {
  const f = v => +v.toFixed(2);
  const esc = s => String(s).replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const reduced = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // An arrow in the bale seen end-on: the nock, with three vanes at 120°.
  // The cock vane is orange like the app's arrow, the two hen vanes white.
  function nock(x, y, s, cls = '', style = '') {
    const vane = (deg, fill) => `<path d="M0 -0.28 L-0.2 -1.25 L0.2 -1.25 Z" fill="${fill}" transform="rotate(${deg})"/>`;
    return `<g class="fin-nock ${cls}" style="${style}" transform="translate(${f(x)} ${f(y)}) scale(${s})">
      <g class="fin-nock-in">${vane(0, '#f2621a')}${vane(120, '#f6f3ea')}${vane(240, '#f6f3ea')}
      <circle r="0.36" fill="#0e2240" stroke="#f6f3ea" stroke-width="0.09"/></g></g>`;
  }

  // IBO has no paper face, so the round shows as a medallion in the app's
  // score colours, one pin per target sitting in the band it scored.
  const IBO_BANDS = [{ v: 5, r: 10, c: '#d8bc84' }, { v: 8, r: 7.2, c: '#6faf2f' }, { v: 10, r: 4.4, c: '#2f96eb' }, { v: 11, r: 1.8, c: '#f2621a' }];
  function iboFace(tally) {
    const rings = IBO_BANDS.map(b => `<circle r="${b.r}" fill="${b.c}" stroke="#0e2240" stroke-opacity=".35" stroke-width="0.08"/>`).join('');
    const labels = IBO_BANDS.slice(0, 3).map(b => `<text y="${f(-b.r + 0.95)}" class="fin-band">${b.v}</text>`).join('');
    // Pins spread round each band by the golden angle so a full band reads as a ring of arrows.
    const mid = { 11: 1.0, 10: 3.1, 8: 5.8, 5: 8.6, 0: 10.55 };
    const seen = {};
    const pins = tally.map((v, i) => {
      if (v == null) return '';
      const k = seen[v] = (seen[v] || 0) + 1;
      const a = k * 2.39996 + (v * 0.7);
      const r = v === 11 ? Math.min(1.1, 0.35 * Math.sqrt(k)) : mid[v];
      return nock(Math.cos(a) * r, Math.sin(a) * r, 0.62, 'fin-pin', `--d:${i}`);
    }).join('');
    return `<svg class="fin-face" viewBox="-11.5 -11.5 23 23" aria-hidden="true">
      <circle r="11.2" fill="#0e2240" opacity=".35"/>${rings}${labels}${pins}</svg>`;
  }

  // Vegas: the real face, with the featured archer's plotted arrows end by end,
  // framed close on the group the way you see it standing at the bale.
  function vegasFace(arrows, view) {
    const face = Target.faceSvg({ ariaLabel: '', view }).replace('class="tf "', 'class="tf fin-face" aria-hidden="true"');
    const pins = arrows.map(a => nock(a.x, a.y, 0.62 * view / Target.VIEW_R + 0.18, 'fin-pin', `--d:${a.end}`)).join('');
    return face.replace('</svg>', `${pins}</svg>`);
  }

  function html(s) {
    const vegas = s.type === 'vegas';
    const view = vegas ? (s.arrows.length ? Math.max(Target.fit(s.arrows), 7) : Target.VIEW_R) : 11.5;
    const face = vegas ? vegasFace(s.arrows, view) : iboFace(s.tally);
    const box = `${-view} ${-view} ${view * 2} ${view * 2}`;
    const board = s.board.length > 1 ? `<ol class="fin-board">${s.board.map((b, i) => `
      <li style="--i:${i}"><span class="fin-rank">${b.rank}${b.tie ? '=' : ''}</span>
        <span class="fin-name">${esc(b.name)}${b.pb ? '<em>New best</em>' : ''}</span><b>${b.total}</b></li>`).join('')}</ol>` : '';
    // Time between one end's (or target's) arrows and the next: the whole set lands in about 1.3 s.
    const step = Math.min(130, Math.round(1300 / Math.max(1, s.type === 'vegas' ? 10 : s.tally.length)));
    return `<div class="fin ${vegas ? 'vegas' : 'ibo'}" role="dialog" aria-modal="true" aria-label="Round complete. ${esc(s.head)}" style="--step:${step}ms">
      <svg class="fin-ridge" viewBox="0 0 400 70" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 38 L40 22 L70 34 L118 8 L160 30 L205 14 L250 32 L300 6 L345 28 L400 16 V70 H0Z" fill="#1e4175"/>
        <path d="M0 56 L55 40 L110 52 L170 34 L230 50 L290 38 L350 52 L400 42 V70 H0Z" fill="#0e2240"/>
      </svg>
      <button class="fin-skip" data-fin="skip">Skip</button>
      <div class="fin-stage">
        <div class="fin-bale">${face}
          <svg class="fin-hit" viewBox="${box}" aria-hidden="true">
            <circle class="fin-ripple" r="${f(view * 0.1)}" fill="none" stroke="#f6f3ea" stroke-width="${f(view * 0.016)}"/>
            ${nock(0, 0, f(view / 9), 'fin-last')}
          </svg>
        </div>
      </div>
      <div class="fin-copy">
        <h2 class="fin-head">${esc(s.head)}</h2>
        <div class="fin-total"><b data-count="${s.total}">${s.total}</b>${s.bonus != null ? `<span>${s.bonus}× ${s.bonusMark}</span>` : ''}</div>
        <p class="fin-sub">${s.sub.map(t => `<span>${esc(t)}</span>`).join(' <i aria-hidden="true">·</i> ')}</p>
        ${board}
        <button class="big primary fin-go" data-fin="go">See scorecard</button>
      </div>
    </div>`;
  }

  // Counts the big total up from zero as the result lands.
  function countUp(el, ms) {
    const to = +el.dataset.count;
    const t0 = performance.now();
    const step = now => {
      const k = Math.min(1, (now - t0) / ms);
      el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3)));
      if (k < 1 && !el.closest('.fin.skip')) requestAnimationFrame(step); else el.textContent = to;
    };
    el.textContent = '0';
    requestAnimationFrame(step);
  }

  // s: { type, head, sub[], total, bonus, bonusMark, board[], arrows[] | tally[] }.
  // Resolves when the archer moves on to the scorecard.
  function play(s, haptic = {}) {
    return new Promise(resolve => {
      document.querySelectorAll('.fin').forEach(n => n.remove());
      const wrap = document.createElement('div');
      wrap.innerHTML = html(s);
      const el = wrap.firstElementChild;
      document.body.appendChild(el);
      const timers = [];
      const later = (ms, fn) => timers.push(setTimeout(fn, ms));
      const finishNow = () => {
        timers.forEach(clearTimeout);
        el.classList.add('skip', 'landed', 'settled');
        el.querySelector('.fin-total b').textContent = s.total;
        el.querySelector('.fin-go').focus({ preventScroll: true });
      };
      const close = () => {
        timers.forEach(clearTimeout);
        el.classList.add('out');
        setTimeout(() => el.remove(), reduced() ? 0 : 220);
        document.removeEventListener('keydown', onKey);
        window.removeEventListener('hashchange', onHash);
        resolve();
      };
      const onKey = e => {
        if (e.key === 'Escape') close();
        else if ((e.key === 'Enter' || e.key === ' ') && !el.classList.contains('settled')) { e.preventDefault(); finishNow(); }
      };
      // The phone's back button leaves the screen; the scorecard behind it is already the current page.
      const startHash = location.hash;
      const onHash = () => { if (location.hash !== startHash) close(); };
      el.addEventListener('click', e => {
        const b = e.target.closest('[data-fin]');
        if (b && b.dataset.fin === 'go') return close();
        if (!el.classList.contains('settled')) finishNow();
      });
      document.addEventListener('keydown', onKey);
      window.addEventListener('hashchange', onHash);

      if (reduced()) { finishNow(); return; }
      // Walk up (CSS, 0-0.9s), arrows in (0.7s on), last arrow lands, result counts up.
      const pinsDone = 700 + 1300;
      later(pinsDone, () => el.classList.add('flying'));
      later(pinsDone + 420, () => { el.classList.add('landed'); haptic.place && haptic.place(); });
      later(pinsDone + 650, () => countUp(el.querySelector('.fin-total b'), 900));
      later(pinsDone + 1700, () => {
        el.classList.add('settled');
        haptic.success && haptic.success();
        el.querySelector('.fin-go').focus({ preventScroll: true });
      });
    });
  }

  return { play };
})();
