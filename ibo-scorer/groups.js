'use strict';

/* =========================================================
   End-of-round arrow groups. A shot map of every arrow on the
   face, coloured from the first end to the last, with a bubble
   showing where 4 in 5 arrows landed. A slider drops the worst
   outlier one at a time. Below it, one small face per end, a
   count of each score and where each shot of the end tends to go.
   ========================================================= */

const Groups = (() => {
  const f = v => +v.toFixed(2);
  const scoreText = q => { const s = Target.scoreAt(q.x, q.y); return s.x ? 'X' : s.score ? String(s.score) : 'M'; };
  const ringCls = t => (t === 'X' || +t >= 9 ? 'rg' : +t >= 7 ? 'rr' : t === '6' ? 'rb' : 'rm');
  const SHARE = 0.8;

  // Colour for end i of n: sky blue for the first end, through green, to orange for the last.
  const endColor = (i, n) => { const t = n > 1 ? i / (n - 1) : 1; return `hsl(${Math.round(205 - t * 185)} 85% ${Math.round(60 - t * 6)}%)`; };

  // The face, group bubble and stats for one set of arrows with `cut` outliers dropped.
  // all: [{x, y, e}] where e is the end index; n: number of ends in the round.
  function view(all, n, cut) {
    const { kept, removed } = Target.trim(all, cut);
    const g = Target.group(kept);
    const el = Target.ellipse(kept, SHARE);
    const v = Target.fit(kept);
    const u = v / 11;   // marks are sized to the zoom so they stay the same size on screen
    const bubble = el ? `<ellipse cx="${f(el.cx)}" cy="${f(el.cy)}" rx="${f(el.rx)}" ry="${f(el.ry)}"
        transform="rotate(${f(el.ang)} ${f(el.cx)} ${f(el.cy)})" class="g-bubble"/>` : '';
    const gone = removed.map(q => `<circle cx="${f(q.x)}" cy="${f(q.y)}" r="${f(0.42 * u)}" class="g-gone"/>`).join('');
    // Later ends drawn last so they sit on top.
    const dots = [...kept].sort((a, b) => a.e - b.e).map(q =>
      `<circle cx="${f(q.x)}" cy="${f(q.y)}" r="${f(0.42 * u)}" fill="${endColor(q.e, n)}" class="g-dot"/>`).join('');
    const arm = 0.9 * u;
    const c = `<g class="g-centre"><path d="M0 0L${f(g.cx)} ${f(g.cy)}" class="g-lead"/>
      <path d="M${f(g.cx - arm)} ${f(g.cy)}H${f(g.cx + arm)}M${f(g.cx)} ${f(g.cy - arm)}V${f(g.cy + arm)}"/>
      <circle cx="${f(g.cx)}" cy="${f(g.cy)}" r="${f(0.35 * u)}"/></g>`;
    const face = Target.faceSvg({ view: v, cls: 'g-base', ariaLabel:
      `Shot map of ${kept.length} arrows. Group ${Target.fmtCm(g.spread)}, centre ${Target.fmtCm(g.offset)} ${Target.direction(g.cx, g.cy)}` });
    const over = `<svg class="g-over" viewBox="${-f(v)} ${-f(v)} ${f(v * 2)} ${f(v * 2)}" aria-hidden="true">${bubble}${gone}${dots}${c}</svg>`;
    const legend = n > 1 ? `<div class="g-legend"><span>End 1</span><i style="background:linear-gradient(90deg,${
      [0, 0.5, 1].map(t => endColor(t * (n - 1), n)).join(',')})"></i><span>End ${n}</span></div>` : '';
    const dropped = removed.length
      ? `<p class="g-dropped"><span>Dropped</span>${removed.map(q => { const t = scoreText(q); return `<i class="${ringCls(t)}">${t}</i>`; }).join('')}</p>`
      : '';
    return `<div class="face-wrap g-face">${face}${over}</div>${legend}
      <div class="g-stats">
        <div><small>Group size</small><b>${g.n > 1 ? Target.fmtCm(g.spread) : '–'}</b><span>${kept.length} of ${all.length} arrows</span></div>
        <div><small>Centre</small><b>${Target.fmtCm(g.offset)}</b><span>${Target.direction(g.cx, g.cy)}</span></div>
        <div><small>Group shape</small><b>${el ? `${(el.rx * 2).toFixed(1)} × ${(el.ry * 2).toFixed(1)}` : '–'}</b><span>cm, 4 in 5</span></div>
      </div>${dropped}`;
  }

  // Shot map card for one archer. plots: r.plots[aid], one array of {x, y} or null per end.
  function card(plots, title) {
    const all = [];
    plots.forEach((end, e) => end.forEach(q => q && all.push({ x: q.x, y: q.y, e })));
    const max = Math.max(0, all.length - 3);
    const slider = max ? `<label class="g-slider">
        <span><b>Drop outliers</b><output>None dropped</output></span>
        <input type="range" min="0" max="${max}" value="0" step="1" data-input="outliers" aria-label="Outlier arrows to drop">
      </label>` : '';
    return `<div class="g-card" data-n="${plots.length}" data-pts="${JSON.stringify(all.map(q => [q.x, q.y, q.e]))}">
      ${title ? `<h3>${title}</h3>` : ''}
      <div class="g-view">${view(all, plots.length, 0)}</div>
      ${slider}
    </div>`;
  }

  /* ---------- end by end ---------- */
  const TILE_V = 6;                       // every end tile shows the same 12 cm square
  const SHOT_COLORS = ['#2f96eb', '#f2621a', '#6faf2f'];
  const shotColor = k => SHOT_COLORS[k % SHOT_COLORS.length];
  const ORDINAL = ['1st', '2nd', '3rd'];
  const ordinal = k => ORDINAL[k] || `${k + 1}th`;
  const val = s => (s === 'X' ? 10 : +s || 0);

  function tile(end, plots, i, mark) {
    const lim = TILE_V - 1.1;
    const dots = (plots || []).map((q, k) => {
      if (!q) return '';
      // Arrows off the edge of the tile sit on its edge as a hollow ring.
      const off = Math.abs(q.x) > lim || Math.abs(q.y) > lim;
      const x = Math.max(-lim, Math.min(lim, q.x)), y = Math.max(-lim, Math.min(lim, q.y));
      return `<circle cx="${f(x)}" cy="${f(y)}" r="0.75" ${off ? `fill="none" stroke="${shotColor(k)}" stroke-width="0.45"` : `fill="${shotColor(k)}" stroke="#fff" stroke-width="0.2"`}/>`;
    }).join('');
    const total = end.reduce((s, v) => s + val(v), 0);
    return `<div class="g-tile${mark ? ' ' + mark : ''}">
      <div class="g-tface">${Target.faceSvg({ view: TILE_V, ariaLabel: `End ${i + 1}` })}<svg viewBox="${-TILE_V} ${-TILE_V} ${TILE_V * 2} ${TILE_V * 2}" aria-hidden="true">${dots}</svg></div>
      <span>End ${i + 1}</span><b>${total}</b></div>`;
  }

  // scores: r.scores[aid]; plots: r.plots[aid].
  function ends(scores, plots) {
    const shot = scores.map((end, i) => ({ end, i })).filter(x => x.end.some(v => v != null));
    if (!shot.length) return '';
    const totals = shot.map(x => x.end.reduce((s, v) => s + val(v), 0));
    const done = shot.filter(x => !x.end.includes(null)).map(x => totals[shot.indexOf(x)]);
    const hi = Math.max(...done), lo = Math.min(...done);
    const marks = done.length > 1 && hi !== lo;
    const tiles = shot.map((x, j) => {
      const full = !x.end.includes(null);
      const mark = marks && full ? (totals[j] === hi ? 'best' : totals[j] === lo ? 'worst' : '') : '';
      return tile(x.end, plots && plots[x.i], x.i, mark);
    }).join('');

    const arrows = shot.flatMap(x => x.end.filter(v => v != null).map(String));
    const order = ['X', '10', '9', '8', '7', '6', '0'];
    const bar = order.map(t => [t, arrows.filter(a => a === t).length]).filter(([, c]) => c)
      .map(([t, c]) => { const label = t === '0' ? 'M' : t; return `<i class="${ringCls(label)}" style="flex:${c}"><em>${label}</em><small>${c}</small></i>`; }).join('');

    // Where the 1st, 2nd and 3rd shot of each end tends to land.
    const per = plots ? Math.max(0, ...plots.map(e => e.length)) : 0;
    const shots = [];
    for (let k = 0; k < per; k++) {
      const g = Target.group(plots.map(e => e[k]));
      if (g && g.n >= 3) shots.push(`<div><span><i style="background:${shotColor(k)}"></i>${ordinal(k)} shot</span>
        <b>${Target.fmtCm(g.offset)}</b><small>${Target.direction(g.cx, g.cy)}</small></div>`);
    }
    return `<div class="g-ends">
      <h3>End by end</h3>
      <div class="g-tiles">${tiles}</div>
      <div class="g-bar" role="img" aria-label="${arrows.length} arrows: ${order.map(t => [t, arrows.filter(a => a === t).length]).filter(([, c]) => c).map(([t, c]) => `${c} × ${t === '0' ? 'M' : t}`).join(', ')}">${bar}</div>
      ${shots.length === per && per > 1 ? `<div class="g-shots">${shots.join('')}</div>` : ''}
    </div>`;
  }

  const ptsOf = el => JSON.parse(el.dataset.pts).map(([x, y, e]) => ({ x, y, e }));

  function update(cardEl, cut) {
    cardEl.querySelector('.g-view').innerHTML = view(ptsOf(cardEl), +cardEl.dataset.n, cut);
    const out = cardEl.querySelector('.g-slider output');
    if (out) out.textContent = cut ? `${cut} dropped` : 'None dropped';
  }

  // Wire up the outlier sliders on the page.
  function bind(root) {
    root.querySelectorAll('.g-card').forEach(el => {
      const s = el.querySelector('input[data-input="outliers"]');
      if (s) s.addEventListener('input', () => update(el, +s.value));
    });
  }

  return { card, ends, bind };
})();
