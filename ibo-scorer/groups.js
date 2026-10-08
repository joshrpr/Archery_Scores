'use strict';

/* =========================================================
   End-of-round arrow groups: a heatmap of where the arrows
   landed, the group's real outline (not a circle), and a
   slider that drops the worst outlier one at a time so you
   can see the group you'd have shot without the fliers.
   ========================================================= */

const Groups = (() => {
  const HEAT_GRID = 96;
  const f = v => +v.toFixed(2);
  const scoreText = q => { const s = Target.scoreAt(q.x, q.y); return s.x ? 'X' : s.score ? String(s.score) : 'M'; };
  const ringCls = t => (t === 'X' || +t >= 9 ? 'rg' : +t >= 7 ? 'rr' : t === '6' ? 'rb' : 'rm');

  // Smooth outline around the group: the hull, pushed out a little so it wraps
  // the arrows, drawn as a closed Catmull-Rom curve through those points so it
  // follows the group's real shape without sharp corners.
  function outline(kept, g, pad) {
    const h = Target.hull(kept);
    if (h.length < 3) return '';
    const v = h.map(q => {
      const dx = q.x - g.cx, dy = q.y - g.cy, d = Math.hypot(dx, dy) || 1;
      return { x: q.x + dx / d * pad, y: q.y + dy / d * pad };
    });
    const n = v.length, at = i => v[(i + n) % n];
    let d = `M${f(v[0].x)} ${f(v[0].y)}`;
    for (let i = 0; i < n; i++) {
      const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
      const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
      const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
      d += `C${f(c1.x)} ${f(c1.y)} ${f(c2.x)} ${f(c2.y)} ${f(p2.x)} ${f(p2.y)}`;
    }
    return `<path d="${d}Z" class="g-hull"/>`;
  }

  // The face, heatmap and stats for one set of arrows with `cut` outliers dropped.
  function view(all, cut) {
    const { kept, removed } = Target.trim(all, cut);
    const g = Target.group(kept);
    const v = Target.fit(kept);
    const vb = `${-v} ${-v} ${v * 2} ${v * 2}`;
    const base = Target.faceSvg({ view: v, cls: 'g-base', ariaLabel: 'Target face' });
    // Marks are sized to the zoom so they stay the same size on screen.
    const u = v / 11;
    const dots = kept.map(q => `<circle cx="${f(q.x)}" cy="${f(q.y)}" r="${f(0.2 * u)}" class="g-dot"/>`).join('');
    const gone = removed.map(q => `<circle cx="${f(q.x)}" cy="${f(q.y)}" r="${f(0.32 * u)}" class="g-gone"/>`).join('');
    const arm = 0.75 * u;
    const c = `<g class="g-centre"><path d="M${f(g.cx - arm)} ${f(g.cy)}H${f(g.cx + arm)}M${f(g.cx)} ${f(g.cy - arm)}V${f(g.cy + arm)}"/>
      <circle cx="${f(g.cx)}" cy="${f(g.cy)}" r="${f(0.3 * u)}"/></g>`;
    const over = `<svg class="g-over" viewBox="${vb}" role="img"
      aria-label="Heatmap of ${kept.length} arrows. Group ${Target.fmtCm(g.spread)}, centre ${Target.fmtCm(g.offset)} ${Target.direction(g.cx, g.cy)}">
      ${outline(kept, g, 0.45 * u)}${gone}${dots}${c}</svg>`;
    const dropped = removed.length
      ? `<p class="g-dropped"><span>Dropped</span>${removed.map(q => { const t = scoreText(q); return `<i class="${ringCls(t)}">${t}</i>`; }).join('')}</p>`
      : '';
    return `<div class="face-wrap g-face">${base}<canvas class="g-heat" data-view="${v}" aria-hidden="true"></canvas>${over}</div>
      <div class="g-stats">
        <div><small>Group size</small><b>${g.n > 1 ? Target.fmtCm(g.spread) : '–'}</b><span>widest spread</span></div>
        <div><small>Centre</small><b>${Target.fmtCm(g.offset)}</b><span>${Target.direction(g.cx, g.cy)}</span></div>
        <div><small>Avg from centre</small><b>${g.n > 1 ? Target.fmtCm(g.meanR) : '–'}</b><span>${kept.length} of ${all.length} arrows</span></div>
      </div>${dropped}`;
  }

  // Card for one archer. `all` is every plotted arrow of the round.
  function card(all, title) {
    const max = Math.max(0, all.length - 3);
    const slider = max ? `<label class="g-slider">
        <span><b>Drop outliers</b><output>None dropped</output></span>
        <input type="range" min="0" max="${max}" value="0" step="1" data-input="outliers" aria-label="Outlier arrows to drop">
      </label>` : '';
    return `<div class="g-card" data-pts="${JSON.stringify(all.map(q => [q.x, q.y]))}">
      ${title ? `<h3>${title}</h3>` : ''}
      <div class="g-view">${view(all, 0)}</div>
      ${slider}
    </div>`;
  }

  // Heat colours: pale gold through orange to deep red, transparent where empty.
  const RAMP = [[0, 255, 236, 140], [0.45, 255, 160, 20], [0.75, 240, 70, 20], [1, 170, 0, 40]];
  function rampAt(t) {
    for (let i = 1; i < RAMP.length; i++) {
      if (t <= RAMP[i][0]) {
        const a = RAMP[i - 1], b = RAMP[i], u = (t - a[0]) / (b[0] - a[0]);
        return [0, 1, 2].map(k => a[k + 1] + (b[k + 1] - a[k + 1]) * u);
      }
    }
    return RAMP[RAMP.length - 1].slice(1);
  }

  function paint(cardEl, pts) {
    const cv = cardEl.querySelector('canvas.g-heat');
    if (!cv) return;
    const v = +cv.dataset.view;
    const size = HEAT_GRID;
    const dens = Target.density(pts, v, size, Math.max(0.5, v * 0.1));
    const small = document.createElement('canvas');
    small.width = small.height = size;
    const sctx = small.getContext('2d');
    const img = sctx.createImageData(size, size);
    for (let i = 0; i < dens.length; i++) {
      const t = dens[i];
      if (t < 0.06) continue;
      const [r, g, b] = rampAt(t);
      img.data[i * 4] = r; img.data[i * 4 + 1] = g; img.data[i * 4 + 2] = b;
      img.data[i * 4 + 3] = Math.round(255 * Math.min(0.92, Math.pow((t - 0.06) / 0.94, 0.75)));
    }
    sctx.putImageData(img, 0, 0);
    const px = Math.round(cv.getBoundingClientRect().width * (window.devicePixelRatio || 1)) || 600;
    cv.width = cv.height = px;
    const ctx = cv.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(small, 0, 0, px, px);
  }

  const ptsOf = el => JSON.parse(el.dataset.pts).map(([x, y]) => ({ x, y }));

  function update(cardEl, cut) {
    const all = ptsOf(cardEl);
    cardEl.querySelector('.g-view').innerHTML = view(all, cut);
    const out = cardEl.querySelector('.g-slider output');
    if (out) out.textContent = cut ? `${cut} dropped` : 'None dropped';
    paint(cardEl, Target.trim(all, cut).kept);
  }

  // Paint every heatmap on the page and wire up the sliders.
  function bind(root) {
    root.querySelectorAll('.g-card').forEach(el => {
      paint(el, ptsOf(el));
      const s = el.querySelector('input[data-input="outliers"]');
      if (s) s.addEventListener('input', () => update(el, +s.value));
    });
  }

  return { card, bind };
})();
