'use strict';

/* =========================================================
   Analytics dashboard: score trends, score mix, end and arrow
   patterns, arrow groups and head-to-head across past rounds.
   Analytics holds the maths (no DOM, runs under node for tests);
   Stats draws the page and wires up the chart tooltips.
   ========================================================= */

const Analytics = (() => {
  const T = typeof Target !== 'undefined' ? Target : require('./target.js');
  const points = v => (v === 'X' ? 10 : v);
  const isVegas = r => r.type === 'vegas';
  const mean = a => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : null);
  const VALUES = { vegas: ['X', 10, 9, 8, 7, 6, 0], ibo: [11, 10, 8, 5, 0] };

  // Finished rounds of one kind ('vegas' or 'ibo') that an archer shot, oldest first.
  function roundsFor(rounds, aid, kind) {
    return rounds
      .filter(r => r.status === 'finished' && r.archerIds.includes(aid) && Array.isArray(r.scores[aid]) &&
        isVegas(r) === (kind === 'vegas'))
      .sort((a, b) => a.createdAt - b.createdAt);
  }

  // Per-round numbers for one archer. `value` is what the dashboard charts:
  // the total for Vegas, and points per target for IBO (rounds vary in length).
  function summarize(r, aid) {
    const vegas = isVegas(r);
    const arrows = vegas ? r.scores[aid].flat() : r.scores[aid];
    let total = 0, bonus = 0, misses = 0, n = 0;
    for (const v of arrows) {
      if (v == null) continue;
      n++; total += points(v);
      if (v === 'X' || v === 11) bonus++;
      if (v === 0) misses++;
    }
    const slots = r.scores[aid].length || 1;
    return {
      r, aid, vegas, total, bonus, misses, n, slots,
      value: vegas ? total : total / slots,
      group: groupStats(r, aid)
    };
  }

  // Average end group size and where the whole round's group sat, from plotted arrows.
  function groupStats(r, aid) {
    const plots = r.plots && r.plots[aid];
    if (!plots || !plots.some(e => e && e.some(Boolean))) return null;
    const ends = plots.map(e => T.group(e)).filter(g => g && g.n > 1);
    const all = T.group(plots.flat());
    return {
      size: ends.length ? mean(ends.map(g => g.spread)) : null,
      offset: all.offset, cx: all.cx, cy: all.cy, n: all.n, meanR: all.meanR
    };
  }

  // Trailing average over up to k values, one per input.
  function rolling(vals, k = 5) {
    return vals.map((_, i) => mean(vals.slice(Math.max(0, i - k + 1), i + 1)));
  }

  // Headline numbers for a run of summarized rounds.
  function kpis(rows) {
    if (!rows.length) return null;
    const vals = rows.map(x => x.value);
    const best = rows.reduce((b, x) => (!b || x.value > b.value || (x.value === b.value && x.bonus > b.bonus) ? x : b), null);
    const arrows = rows.reduce((s, x) => s + x.n, 0);
    const recent = rows.slice(-5), prior = rows.slice(-10, -5);
    const groups = rows.map(x => x.group && x.group.size).filter(v => v != null);
    return {
      rounds: rows.length,
      avg: mean(vals),
      best,
      avgBonus: mean(rows.map(x => x.bonus)),
      bonusRate: arrows ? rows.reduce((s, x) => s + x.bonus, 0) / arrows : 0,
      hitRate: arrows ? 1 - rows.reduce((s, x) => s + x.misses, 0) / arrows : 0,
      // Last 5 rounds against the 5 before them; needs at least 2 in each.
      delta: rows.length >= 4 && prior.length >= 2 ? mean(recent.map(x => x.value)) - mean(prior.map(x => x.value)) : null,
      group: groups.length ? mean(groups) : null,
      lastGroup: groups.length ? groups[groups.length - 1] : null
    };
  }

  // How often each score was shot: [{v, count, pct}] in face order.
  function mix(rows, kind) {
    const counts = new Map(VALUES[kind].map(v => [v, 0]));
    let n = 0;
    for (const x of rows) {
      const arrows = x.vegas ? x.r.scores[x.aid].flat() : x.r.scores[x.aid];
      for (const v of arrows) if (v != null && counts.has(v)) { counts.set(v, counts.get(v) + 1); n++; }
    }
    return [...counts].map(([v, count]) => ({ v, count, pct: n ? count / n : 0 }));
  }

  // Vegas: average total for each end number, and average points for arrow 1, 2, 3 of an end.
  function endAverages(rows) {
    const ends = [], arrows = [];
    for (const x of rows) {
      x.r.scores[x.aid].forEach((end, i) => {
        (ends[i] = ends[i] || []).push(end.reduce((s, v) => s + (v == null ? 0 : points(v)), 0));
        end.forEach((v, k) => { if (v != null) (arrows[k] = arrows[k] || []).push(points(v)); });
      });
    }
    return { ends: ends.map(mean), arrows: arrows.map(mean) };
  }

  // Every plotted arrow across the rounds, tagged with its round's position (0 = oldest).
  function shots(rows) {
    const out = [];
    rows.forEach((x, i) => {
      const plots = x.r.plots && x.r.plots[x.aid];
      if (plots) plots.forEach(end => end && end.forEach(p => { if (p) out.push({ x: p.x, y: p.y, round: i }); }));
    });
    return out;
  }

  // Plotted arrows split into the last `recent` plotted rounds and everything
  // before them, with each side's group and 4-in-5 bubble. The split only
  // happens when both sides have enough arrows to draw a bubble.
  function compare(rows, recent = 5) {
    const plotted = rows.filter(x => x.r.plots && x.r.plots[x.aid] && x.r.plots[x.aid].some(e => e && e.some(Boolean)));
    const pts = list => list.flatMap(x => x.r.plots[x.aid].flat().filter(Boolean));
    const side = list => { const p = pts(list); return { rounds: list.length, n: p.length, g: T.group(p), el: T.ellipse(p, 0.8) }; };
    const all = side(plotted);
    if (plotted.length <= recent) return { all, recent: null, earlier: null };
    const r = side(plotted.slice(-recent)), e = side(plotted.slice(0, -recent));
    if (!r.el || !e.el) return { all, recent: null, earlier: null };
    return { all, recent: r, earlier: e };
  }

  // Arrow density on a square grid covering [-view, view] cm, from a Gaussian
  // kernel of width bw cm around each arrow. Returns values scaled to 0..1.
  function heat(pts, view, size = 48, bw = Math.max(0.5, view / 12)) {
    const cell = (2 * view) / size, out = new Float64Array(size * size);
    const reach = Math.ceil((3 * bw) / cell);
    for (const p of pts) {
      const ci = Math.floor((p.x + view) / cell), cj = Math.floor((p.y + view) / cell);
      for (let j = Math.max(0, cj - reach); j <= Math.min(size - 1, cj + reach); j++) {
        for (let i = Math.max(0, ci - reach); i <= Math.min(size - 1, ci + reach); i++) {
          const dx = -view + (i + 0.5) * cell - p.x, dy = -view + (j + 0.5) * cell - p.y;
          out[j * size + i] += Math.exp(-(dx * dx + dy * dy) / (2 * bw * bw));
        }
      }
    }
    let max = 0;
    for (const v of out) if (v > max) max = v;
    if (max) for (let k = 0; k < out.length; k++) out[k] /= max;
    return { size, cell, view, values: out };
  }

  // Where each plotted round's group centre sat: x right of centre, y above it (cm).
  function drift(rows) {
    return rows.filter(x => x.group).map(x => ({ r: x.r, x: x.group.cx, y: -x.group.cy }));
  }

  // Each archer's average over their last `limit` rounds of this kind (null = all), best first.
  function leaderboard(rounds, archers, kind, limit) {
    return archers.map(a => {
      let rs = roundsFor(rounds, a.id, kind);
      if (limit) rs = rs.slice(-limit);
      if (!rs.length) return null;
      const rows = rs.map(r => summarize(r, a.id));
      return { aid: a.id, name: a.name, avg: mean(rows.map(x => x.value)), rounds: rows.length };
    }).filter(Boolean).sort((a, b) => b.avg - a.avg);
  }

  // A tidy axis range: [lo, hi, step] with three or four ticks.
  function niceRange(lo, hi, floor = -Infinity, ceil = Infinity) {
    if (!isFinite(lo) || !isFinite(hi)) return [0, 1, 0.5];
    if (hi - lo < 1e-9) { lo -= 1; hi += 1; }
    const span = hi - lo;
    const raw = span / 3;
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const step = [1, 2, 2.5, 5, 10].map(m => m * mag).find(s => s >= raw) || raw;
    let a = Math.floor((lo - span * 0.08) / step) * step;
    let b = Math.ceil((hi + span * 0.08) / step) * step;
    a = Math.max(floor, a); b = Math.min(ceil, b);
    if (b <= a) b = a + step;
    return [a, b, step];
  }

  return { VALUES, points, roundsFor, summarize, groupStats, rolling, kpis, mix, endAverages, shots, compare, heat, drift, leaderboard, niceRange };
})();

if (typeof module !== 'undefined') { module.exports = Analytics; }

/* ---------- drawing (browser only) ---------- */
const Stats = (() => {
  if (typeof document === 'undefined') return null;
  const A = Analytics;
  const PREF = 'ibo-scorer-stats-view';
  const BLUE = '#2f96eb', ORANGE = '#f2621a', INK = '#f6f3ea', MUTED = '#a9bcd6', GRID = '#2b5590';
  const RANGES = [{ id: '10', label: 'Last 10' }, { id: '25', label: 'Last 25' }, { id: 'all', label: 'All time' }];
  // Score colours: the Vegas face (gold, red, blue) and the IBO score buttons.
  const VCOL = { X: '#f5c84c', 10: '#f5c84c', 9: '#e0b23a', 8: '#ef5350', 7: '#d84340', 6: '#42a5f5', 0: '#8fa3bf' };
  const ICOL = { 11: '#f2621a', 10: '#2f96eb', 8: '#6faf2f', 5: '#d8bc84', 0: '#8fa3bf' };
  const reduceMotion = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  let pref = {};
  try { pref = JSON.parse(localStorage.getItem(PREF)) || {}; } catch (e) { pref = {}; }
  const remember = () => { try { localStorage.setItem(PREF, JSON.stringify(pref)); } catch (e) { /* not essential */ } };

  const f1 = v => (v == null ? '–' : (Math.round(v * 10) / 10).toFixed(1));
  const fmtVal = (kind, v) => (v == null ? '–' : kind === 'vegas' ? String(Math.round(v * 10) / 10) : f1(v));
  const pct = v => Math.round(v * 100) + '%';
  const scoreLabel = v => (v === 0 ? 'M' : String(v));
  const tipAttr = tips => `data-tips="${esc(JSON.stringify(tips))}"`;
  const day = ts => new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const dayLong = ts => new Date(ts).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

  /* ---------- state ---------- */
  // Which archer, round kind and range the page shows. Falls back to whoever has rounds.
  function state(routeAid) {
    const archers = activeArchers();
    const counts = a => db.rounds.filter(r => r.status === 'finished' && r.archerIds.includes(a.id)).length;
    const withRounds = archers.filter(a => counts(a));
    if (routeAid && withRounds.some(a => a.id === routeAid)) pref.aid = routeAid;
    if (!withRounds.some(a => a.id === pref.aid)) {
      pref.aid = withRounds.length ? withRounds.reduce((b, a) => (counts(a) > counts(b) ? a : b)).id : null;
    }
    const kinds = pref.aid ? ['vegas', 'ibo'].filter(k => A.roundsFor(db.rounds, pref.aid, k).length) : [];
    if (!kinds.includes(pref.kind)) {
      const last = pref.aid && db.rounds.filter(r => r.status === 'finished' && r.archerIds.includes(pref.aid))
        .sort((a, b) => b.createdAt - a.createdAt)[0];
      pref.kind = last ? (isVegas(last) ? 'vegas' : 'ibo') : 'vegas';
    }
    if (!RANGES.some(r => r.id === pref.range)) pref.range = 'all';
    return { archers: withRounds, kinds, aid: pref.aid, kind: pref.kind, range: pref.range };
  }

  function set(d) {
    if (d.aid) pref.aid = d.aid;
    if (d.kind) pref.kind = d.kind;
    if (d.range) pref.range = d.range;
    remember();
  }

  /* ---------- page ---------- */
  function view(routeAid) {
    const st = state(routeAid);
    const head = header('Analytics', '#/');
    if (!st.aid) {
      return `${head}<main><div class="an-empty">
        <svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="54" fill="#1e4175"/>
          <circle cx="60" cy="60" r="38" fill="#16325c"/><circle cx="60" cy="60" r="22" fill="#1e4175"/>
          <circle cx="60" cy="60" r="8" fill="#f2621a"/></svg>
        <h2>Nothing to chart yet</h2>
        <p class="muted">Finish a round and your trends, score mix and arrow groups show up here.</p>
        <button class="big primary" data-action="new-round">Start a round</button></div></main>`;
    }
    const kind = st.kind, vegas = kind === 'vegas';
    const all = A.roundsFor(db.rounds, st.aid, kind).map(r => A.summarize(r, st.aid));
    const rows = st.range === 'all' ? all : all.slice(-Number(st.range));
    const k = A.kpis(rows);
    const name = nameOf(st.aid);

    const archerChips = st.archers.length > 1 ? `<div class="an-chips" role="tablist" aria-label="Archer">
      ${st.archers.map(a => `<button role="tab" aria-selected="${a.id === st.aid}" class="${a.id === st.aid ? 'on' : ''}"
        data-action="stats-set" data-aid="${a.id}">${esc(a.name)}</button>`).join('')}</div>` : '';
    const kindSeg = st.kinds.length > 1 ? `<div class="an-seg" role="radiogroup" aria-label="Round type">
      ${st.kinds.map(x => `<button role="radio" aria-checked="${x === kind}" class="${x === kind ? 'on' : ''}"
        data-action="stats-set" data-kind="${x}">${x === 'vegas' ? 'Vegas 300' : 'IBO 3D'}</button>`).join('')}</div>` : '';
    const rangeSeg = `<div class="an-seg" role="radiogroup" aria-label="Range">
      ${RANGES.map(x => `<button role="radio" aria-checked="${x.id === st.range}" class="${x.id === st.range ? 'on' : ''}"
        data-action="stats-set" data-range="${x.id}">${x.label}</button>`).join('')}</div>`;

    return `${head}
    <div class="an">
      <section class="an-hero">
        <div class="an-hero-in">
          <div class="an-who"><b>${esc(name)}</b><span>${vegas ? 'Vegas 300' : 'IBO 3D'} · ${k.rounds} round${k.rounds === 1 ? '' : 's'}</span></div>
          <div class="an-big">
            <div><small>${vegas ? 'Average score' : 'Average per target'}</small>
              <span class="an-num countup" data-to="${k.avg}" data-dec="${vegas ? 1 : 2}">${vegas ? f1(k.avg) : k.avg.toFixed(2)}</span></div>
            ${deltaChip(k.delta, vegas)}
          </div>
          ${spark(rows.map(x => x.value))}
        </div>
      </section>
      <main class="an-main">
        <div class="an-filters">${archerChips}<div class="an-row">${kindSeg}${rangeSeg}</div></div>
        ${kpiTiles(k, kind)}
        <section class="an-card">
          <div class="an-h"><h2>Score trend</h2><span>${vegas ? 'Round total' : 'Points per target'}</span></div>
          ${trendChart(rows, kind, k.best)}
        </section>
        <section class="an-card">
          <div class="an-h"><h2>Score mix</h2><span>${rows.reduce((s, x) => s + x.n, 0)} arrows</span></div>
          ${mixChart(A.mix(rows, kind), kind)}
        </section>
        ${vegas ? endsCard(rows) : ''}
        ${vegas ? groupsCard(rows) : ''}
        ${leaderCard(st, kind)}
        ${recentCard(rows, kind, k.avg)}
      </main>
    </div>`;
  }

  function deltaChip(d, vegas) {
    if (d == null) return '';
    const up = d >= 0;
    return `<div class="an-delta ${up ? 'up' : 'down'}"><b>${up ? '▲' : '▼'} ${vegas ? f1(Math.abs(d)) : Math.abs(d).toFixed(2)}</b>
      <span>last 5 vs the 5 before</span></div>`;
  }

  // Small decorative trend line for the hero; the full chart below carries the values.
  function spark(vals) {
    if (vals.length < 2) return '';
    const W = 320, H = 56;
    const lo = Math.min(...vals), hi = Math.max(...vals), span = hi - lo || 1;
    const x = i => 4 + i * (W - 8) / (vals.length - 1);
    const y = v => 6 + (hi - v) * (H - 12) / span;
    const d = vals.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('');
    return `<svg class="an-spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">
      <defs><linearGradient id="sparkfill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient></defs>
      <path d="${d}L${x(vals.length - 1)},${H}L${x(0)},${H}Z" fill="url(#sparkfill)" class="an-fade"/>
      <path d="${d}" fill="none" stroke="#fff" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"
        vector-effect="non-scaling-stroke" pathLength="1" class="an-draw"/>
      <circle cx="${x(vals.length - 1)}" cy="${y(vals[vals.length - 1])}" r="4" fill="#fff" class="an-fade"/></svg>`;
  }

  function kpiTiles(k, kind) {
    const vegas = kind === 'vegas';
    const best = k.best;
    const tiles = [
      { cls: 'pb', k: 'Personal best', v: vegas ? best.total : best.value.toFixed(2), dec: vegas ? 0 : 2,
        d: vegas ? `${best.bonus}× X · ${day(best.r.createdAt)}` : `${best.total} over ${best.slots} target${best.slots === 1 ? '' : 's'} · ${day(best.r.createdAt)}` },
      { cls: 'gold', k: vegas ? 'Xs per round' : '11s per round', v: f1(k.avgBonus), dec: 1,
        d: `${pct(k.bonusRate)} of arrows` },
      { cls: 'green', k: 'Hit rate', v: Math.round(k.hitRate * 100), dec: 0, unit: '%',
        d: `${k.rounds} round${k.rounds === 1 ? '' : 's'}` },
      vegas && k.group != null
        ? { cls: 'blue', k: 'Avg end group', v: f1(k.group), dec: 1, unit: ' cm', d: `last round ${f1(k.lastGroup)} cm` }
        : { cls: 'blue', k: 'Rounds', v: k.rounds, dec: 0, d: 'finished' }
    ];
    return `<div class="an-kpis">${tiles.map((t, i) => `<div class="an-kpi ${t.cls}" style="--i:${i}">
      <div class="k">${t.k}</div>
      <div class="v"><span class="countup" data-to="${t.v}" data-dec="${t.dec}">${t.v}</span>${t.unit ? `<small>${t.unit}</small>` : ''}</div>
      <div class="d">${t.d}</div></div>`).join('')}</div>`;
  }

  /* ---------- charts ---------- */
  // Shared frame for the line charts: one y axis, evenly spaced rounds along x.
  function frame(n, lo, hi, step, { W = 360, H = 220, L = 40, R = 16, T = 18, B = 30 } = {}) {
    const x = i => (n === 1 ? (L + W - R) / 2 : L + i * (W - L - R) / (n - 1));
    const y = v => T + (hi - v) * (H - T - B) / (hi - lo);
    const ticks = [];
    for (let v = lo; v <= hi + step * 1e-6; v += step) ticks.push(+v.toFixed(4));
    const grid = ticks.map(v => `<line x1="${L}" x2="${W - R}" y1="${y(v).toFixed(1)}" y2="${y(v).toFixed(1)}" class="an-grid"/>
      <text x="${L - 7}" y="${(y(v) + 4.5).toFixed(1)}" class="an-tick" text-anchor="end">${+v.toFixed(2)}</text>`).join('');
    return { W, H, L, R, T, B, x, y, grid };
  }
  const pathOf = pts => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('');

  function chartBox(fr, label, body, tips, legend = '') {
    return `<div class="an-chart" ${tipAttr(tips)} data-w="${fr.W}" data-h="${fr.H}">
      <svg viewBox="0 0 ${fr.W} ${fr.H}" role="img" aria-label="${esc(label)}">${body}
        <line class="an-xh" x1="0" x2="0" y1="${fr.T}" y2="${fr.H - fr.B}"/>
        <circle class="an-focus" r="6" cx="-20" cy="-20"/></svg>
      <div class="an-tip" role="status" aria-live="polite"></div>
    </div>${legend}`;
  }
  const legendOf = items => `<div class="an-legend">${items.map(([c, t, line]) =>
    `<span><i class="${line ? 'ln' : ''}" style="background:${c}"></i>${t}</span>`).join('')}</div>`;

  function trendChart(rows, kind, best) {
    if (rows.length < 2) return `<p class="muted an-note">Finish at least two rounds in this range to see a trend.</p>`;
    const vegas = kind === 'vegas';
    const vals = rows.map(x => x.value);
    const avg = A.rolling(vals, 5);
    const [lo, hi, step] = A.niceRange(Math.min(...vals), Math.max(...vals), 0, vegas ? 300 : 11);
    const fr = frame(rows.length, lo, hi, step);
    const line = vals.map((v, i) => [fr.x(i), fr.y(v)]);
    const area = `${pathOf(line)}L${fr.x(rows.length - 1).toFixed(1)},${fr.y(lo).toFixed(1)}L${fr.x(0).toFixed(1)},${fr.y(lo).toFixed(1)}Z`;
    const bi = rows.indexOf(best);
    const showDots = rows.length <= 30;
    const dots = showDots ? line.map(([px, py], i) => i === bi ? '' :
      `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="4" fill="${BLUE}" class="an-dot an-fade" style="--d:${(i / rows.length * 0.6).toFixed(2)}s"/>`).join('') : '';
    const [bx, by] = line[bi];
    const pbLabelUp = by - 16 > fr.T;
    const pb = `<g class="an-fade" style="--d:.7s"><circle cx="${bx.toFixed(1)}" cy="${by.toFixed(1)}" r="7.5" fill="${ORANGE}" class="an-dot"/>
      <text x="${Math.min(fr.W - fr.R - 2, Math.max(fr.L + 20, bx)).toFixed(1)}" y="${(pbLabelUp ? by - 13 : by + 22).toFixed(1)}"
        class="an-lbl" text-anchor="middle">Best ${vegas ? best.total : best.value.toFixed(2)}</text></g>`;
    const xl = `<text x="${fr.L}" y="${fr.H - 8}" class="an-tick">${day(rows[0].r.createdAt)}</text>
      <text x="${fr.W - fr.R}" y="${fr.H - 8}" class="an-tick" text-anchor="end">${day(rows[rows.length - 1].r.createdAt)}</text>`;
    const body = `<defs><linearGradient id="trendfill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${BLUE}" stop-opacity=".38"/><stop offset="1" stop-color="${BLUE}" stop-opacity="0"/></linearGradient></defs>
      ${fr.grid}<path d="${area}" fill="url(#trendfill)" class="an-fade"/>
      <path d="${pathOf(line)}" fill="none" stroke="${BLUE}" stroke-width="2.5" stroke-linejoin="round" pathLength="1" class="an-draw"/>
      <path d="${pathOf(avg.map((v, i) => [fr.x(i), fr.y(v)]))}" fill="none" stroke="${ORANGE}" stroke-width="2" stroke-linejoin="round"
        pathLength="1" class="an-draw" style="--d:.25s"/>
      ${dots}${pb}${xl}`;
    const tips = rows.map((x, i) => ({
      x: +fr.x(i).toFixed(1), y: +fr.y(x.value).toFixed(1),
      t: dayLong(x.r.createdAt) + (x.r.note ? ' · ' + x.r.note : ''),
      rows: [[fmtVal(kind, x.value) + (vegas ? '' : ` (${x.total})`), i === bi ? 'Score, best' : 'Score', BLUE],
        [fmtVal(kind, avg[i]), '5-round average', ORANGE], [String(x.bonus), vegas ? 'Xs' : '11s', null]]
    }));
    return chartBox(fr, `${vegas ? 'Round totals' : 'Points per target'} over ${rows.length} rounds`, body, tips,
      legendOf([[BLUE, 'Score', true], [ORANGE, '5-round average', true]]));
  }

  function mixChart(mix, kind) {
    const total = mix.reduce((s, m) => s + m.count, 0);
    if (!total) return `<p class="muted an-note">No scored arrows in this range.</p>`;
    const col = kind === 'vegas' ? VCOL : ICOL;
    const W = 360, H = 190, L = 10, R = 10, T = 26, B = 30;
    const n = mix.length, slot = (W - L - R) / n, bw = Math.min(42, slot - 10);
    const top = Math.max(...mix.map(m => m.pct)) || 1;
    const fr = { W, H, T, B };
    const bars = mix.map((m, i) => {
      const cx = L + slot * (i + 0.5);
      const h = Math.max(m.count ? 4 : 0, (H - T - B) * m.pct / top);
      return `<g class="an-bar" style="--d:${(i * 0.05).toFixed(2)}s">
        <rect x="${(cx - bw / 2).toFixed(1)}" y="${(H - B - h).toFixed(1)}" width="${bw.toFixed(1)}" height="${h.toFixed(1)}" rx="4" fill="${col[m.v]}"/>
        </g>
        <text x="${cx.toFixed(1)}" y="${(H - B - h - 7).toFixed(1)}" class="an-lbl an-fade" text-anchor="middle">${m.count ? pct(m.pct) : ''}</text>
        <text x="${cx.toFixed(1)}" y="${H - 9}" class="an-cat" text-anchor="middle">${scoreLabel(m.v)}</text>`;
    }).join('');
    const tips = mix.map((m, i) => ({
      x: +(L + slot * (i + 0.5)).toFixed(1), y: null, t: m.v === 0 ? 'Misses' : `${scoreLabel(m.v)}s`,
      rows: [[pct(m.pct), 'of arrows', col[m.v]], [String(m.count), 'arrows', null]]
    }));
    return chartBox(fr, 'Share of arrows at each score', `<line x1="${L}" x2="${W - R}" y1="${H - B}" y2="${H - B}" class="an-base"/>${bars}`, tips);
  }

  function endsCard(rows) {
    const { ends, arrows } = A.endAverages(rows);
    if (!ends.length) return '';
    const W = 360, H = 190, L = 10, R = 10, T = 26, B = 30;
    const fr = { W, H, T, B };
    const slot = (W - L - R) / ends.length, bw = Math.min(26, slot - 8);
    const valid = ends.filter(v => v != null);
    const lo = Math.min(...valid), hi = Math.max(...valid);
    const weak = ends.indexOf(lo), strong = ends.indexOf(hi);
    // Bars start at zero so their lengths stay honest; labels name the best and weakest end.
    const bars = ends.map((v, i) => {
      const cx = L + slot * (i + 0.5);
      const h = (H - T - B) * (v || 0) / 30;
      const c = i === weak && lo !== hi ? ORANGE : BLUE;
      const lbl = lo !== hi && (i === weak || i === strong) ? `<text x="${cx.toFixed(1)}" y="${(H - B - h - 7).toFixed(1)}" class="an-lbl an-fade" text-anchor="middle">${f1(v)}</text>` : '';
      return `<g class="an-bar" style="--d:${(i * 0.04).toFixed(2)}s"><rect x="${(cx - bw / 2).toFixed(1)}" y="${(H - B - h).toFixed(1)}"
        width="${bw.toFixed(1)}" height="${h.toFixed(1)}" rx="4" fill="${c}"/></g>${lbl}
        <text x="${cx.toFixed(1)}" y="${H - 9}" class="an-cat" text-anchor="middle">${i + 1}</text>`;
    }).join('');
    const tips = ends.map((v, i) => ({ x: +(L + slot * (i + 0.5)).toFixed(1), y: null, t: `End ${i + 1}`,
      rows: [[f1(v), 'average of 30', i === weak && lo !== hi ? ORANGE : BLUE]] }));
    const arrowTiles = arrows.map((v, i) => `<div><small>Arrow ${i + 1}</small><b>${v == null ? '–' : v.toFixed(2)}</b></div>`).join('');
    const bestArrow = arrows.indexOf(Math.max(...arrows));
    const worstArrow = arrows.indexOf(Math.min(...arrows));
    return `<section class="an-card">
      <div class="an-h"><h2>End by end</h2><span>average end score</span></div>
      ${chartBox(fr, 'Average score for each end', `<line x1="${L}" x2="${W - R}" y1="${H - B}" y2="${H - B}" class="an-base"/>${bars}`, tips)}
      ${lo !== hi ? `<p class="an-insight">End ${strong + 1} is your strongest (${f1(hi)}), end ${weak + 1} your weakest (${f1(lo)}).</p>` : ''}
      <div class="an-h sub"><h3>Arrow in the end</h3><span>average points</span></div>
      <div class="an-arrows">${arrowTiles}</div>
      ${arrows.length > 1 && bestArrow !== worstArrow && arrows[bestArrow] - arrows[worstArrow] >= 0.15
        ? `<p class="an-insight">Arrow ${worstArrow + 1} drops ${(arrows[bestArrow] - arrows[worstArrow]).toFixed(2)} points against arrow ${bestArrow + 1}.</p>` : ''}
    </section>`;
  }

  // Heat colours, light to strong: sky blue, arrow orange, then warm white at the densest spot.
  const HEAT = [[0, [47, 150, 235, 0]], [0.22, [47, 150, 235, 0.5]], [0.6, [242, 98, 26, 0.85]], [1, [255, 236, 200, 0.96]]];
  function heatColor(v) {
    let k = 1;
    while (k < HEAT.length - 1 && v > HEAT[k][0]) k++;
    const [a, ca] = HEAT[k - 1], [b, cb] = HEAT[k];
    const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
    const c = ca.map((x, i) => x + (cb[i] - x) * t);
    return `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${c[3].toFixed(2)})`;
  }
  const HEAT_MIN = 60;   // below this many arrows (about two rounds), show the arrows themselves

  const r2 = v => +v.toFixed(2);
  const bubbleSvg = (el, cls) => `<ellipse cx="${r2(el.cx)}" cy="${r2(el.cy)}" rx="${r2(el.rx)}" ry="${r2(el.ry)}"
    transform="rotate(${r2(el.ang)} ${r2(el.cx)} ${r2(el.cy)})" class="${cls}"/>`;
  const crossSvg = (g, arm, cls) => `<path d="M${r2(g.cx - arm)} ${r2(g.cy)}H${r2(g.cx + arm)}M${r2(g.cx)} ${r2(g.cy - arm)}V${r2(g.cy + arm)}" class="${cls}"/>`;
  const sizeText = el => `${(el.rx * 2).toFixed(1)} × ${(el.ry * 2).toFixed(1)}`;

  function groupsCard(rows) {
    const shots = A.shots(rows);
    if (!shots.length) {
      return `<section class="an-card"><div class="an-h"><h2>Arrow groups</h2></div>
        <p class="muted an-note">Plot arrows on the target during a Vegas round and your heat map and group trends appear here.</p></section>`;
    }
    const cmp = A.compare(rows);
    // Frame the face on the bulk of the arrows; a stray flier or two shouldn't zoom the whole map out.
    const byDist = [...shots].sort((a, b) => Math.hypot(a.x, a.y) - Math.hypot(b.x, b.y));
    const v = Target.fit(byDist.slice(0, Math.max(1, Math.ceil(byDist.length * 0.98))));
    const u = v / 11;   // marks are sized to the zoom so they stay the same size on screen
    const useHeat = shots.length >= HEAT_MIN;

    let layer = '';
    if (useHeat) {
      const h = A.heat(shots, v);
      for (let k = 0; k < h.values.length; k++) {
        if (h.values[k] < 0.03) continue;
        const i = k % h.size, j = Math.floor(k / h.size);
        layer += `<rect x="${r2(-v + i * h.cell)}" y="${r2(-v + j * h.cell)}" width="${r2(h.cell + 0.02)}" height="${r2(h.cell + 0.02)}" fill="${heatColor(h.values[k])}"/>`;
      }
      layer = `<g class="an-heat" filter="url(#an-soft)">${layer}</g>`;
    } else {
      layer = shots.map(q => `<circle cx="${r2(q.x)}" cy="${r2(q.y)}" r="${r2(0.42 * u)}" class="an-shot"/>`).join('');
    }

    let marks;
    if (cmp.recent) {
      const ge = cmp.earlier.g, gr = cmp.recent.g;
      const moved = Math.hypot(gr.cx - ge.cx, gr.cy - ge.cy);
      marks = bubbleSvg(cmp.earlier.el, 'an-bub-old') + bubbleSvg(cmp.recent.el, 'an-bub-new') +
        crossSvg(ge, 0.7 * u, 'an-cross-old') + crossSvg(gr, 0.8 * u, 'an-cross-new') +
        (moved > 0.3 ? `<path d="M${r2(ge.cx)} ${r2(ge.cy)}L${r2(gr.cx)} ${r2(gr.cy)}" class="an-move" marker-end="url(#an-head)"/>` : '');
    } else {
      marks = (cmp.all.el ? bubbleSvg(cmp.all.el, 'an-bub-new') : '') + crossSvg(cmp.all.g, 0.8 * u, 'an-cross-new');
    }
    const defs = `<defs><filter id="an-soft" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="${r2(0.4 * u)}"/></filter>
      <marker id="an-head" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4.5" markerHeight="4.5" orient="auto"><path d="M0 0L10 5L0 10z" fill="#fff"/></marker></defs>`;
    const face = Target.faceSvg({ view: v, cls: useHeat ? 'an-dim' : '', ariaLabel:
      `${useHeat ? 'Heat map' : 'Shot map'} of ${shots.length} plotted arrows` });
    const over = `<svg class="an-over" viewBox="${-r2(v)} ${-r2(v)} ${r2(v * 2)} ${r2(v * 2)}" aria-hidden="true">${defs}${layer}<g class="an-marks">${marks}</g></svg>`;

    const key = `<div class="an-mapkey">
      ${useHeat ? '<span class="an-ramp">Fewer<i></i>More arrows</span>' : ''}
      ${cmp.recent ? `<span><i class="old"></i>Before</span><span><i class="new"></i>Last ${cmp.recent.rounds} rounds</span>`
        : '<span><i class="new"></i>4 in 5 arrows</span>'}</div>`;

    let stats, insight;
    if (cmp.recent) {
      const ge = cmp.earlier.g, gr = cmp.recent.g;
      const moved = Math.hypot(gr.cx - ge.cx, gr.cy - ge.cy);
      const ratio = (cmp.recent.el.rx * cmp.recent.el.ry) / (cmp.earlier.el.rx * cmp.earlier.el.ry);
      const change = Math.round(Math.abs(1 - ratio) * 100);
      const way = Target.direction(gr.cx - ge.cx, gr.cy - ge.cy, 0.2);
      stats = `<div><small>Before, cm</small><b>${sizeText(cmp.earlier.el)}</b><span>${cmp.earlier.rounds} round${cmp.earlier.rounds === 1 ? '' : 's'}</span></div>
        <div><small>Last ${cmp.recent.rounds}, cm</small><b>${sizeText(cmp.recent.el)}</b><span>4 in 5 arrows</span></div>
        <div><small>Centre now</small><b>${Target.fmtCm(gr.offset)}</b><span>${Target.direction(gr.cx, gr.cy)}</span></div>`;
      insight = `Your last ${cmp.recent.rounds} rounds group ${change < 5 ? '<b>about the same</b> as' : `<b>${change}% ${ratio < 1 ? 'tighter' : 'wider'}</b> than`} before` +
        (moved > 0.3 ? `, and the centre moved ${Target.fmtCm(moved)} ${way === 'centred' ? '' : way}.` : ', with the centre in the same place.');
    } else {
      const g = cmp.all.g, el = cmp.all.el;
      stats = `<div><small>4 in 5, cm</small><b>${el ? sizeText(el) : '–'}</b><span>group size</span></div>
        <div><small>Centre</small><b>${Target.fmtCm(g.offset)}</b><span>${Target.direction(g.cx, g.cy)}</span></div>
        <div><small>Arrows</small><b>${shots.length}</b><span>${cmp.all.rounds} round${cmp.all.rounds === 1 ? '' : 's'}</span></div>`;
      const dir = Target.direction(g.cx, g.cy);
      insight = dir === 'centred'
        ? `Your arrows centre within ${Target.fmtCm(g.offset)} of the middle. Sight is on.`
        : `Your arrows centre ${Target.fmtCm(g.offset)} <b>${dir}</b> of the middle.`;
    }

    return `<section class="an-card">
      <div class="an-h"><h2>Arrow groups</h2><span>${shots.length.toLocaleString()} plotted arrow${shots.length === 1 ? '' : 's'}</span></div>
      <div class="an-face-wrap an-face">${face}${over}</div>
      ${key}
      <div class="an-gstats">${stats}</div>
      <p class="an-insight">${insight}</p>
      ${driftChart(rows)}
      ${groupTrend(rows)}
    </section>`;
  }

  // Where each round's centre sat, left-right and high-low, on one cm axis centred on zero.
  function driftChart(rows) {
    const d = A.drift(rows);
    if (d.length < 2) return '';
    const far = Math.max(1, ...d.flatMap(p => [Math.abs(p.x), Math.abs(p.y)]));
    const [, hi, step] = A.niceRange(-far, far);
    const top = Math.max(hi, step);
    const fr = frame(d.length, -top, top, step, { H: 200 });
    const zero = `<line x1="${fr.L}" x2="${fr.W - fr.R}" y1="${fr.y(0).toFixed(1)}" y2="${fr.y(0).toFixed(1)}" class="an-zero"/>`;
    const series = (key, color) => {
      const p = d.map((q, i) => [fr.x(i), fr.y(q[key])]);
      return `<path d="${pathOf(p)}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linejoin="round" pathLength="1" class="an-draw"/>` +
        (d.length <= 30 ? p.map(([px, py]) => `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="4" fill="${color}" class="an-dot an-fade"/>`).join('') : '');
    };
    const side = (v, horiz) => (Math.abs(v) < 0.05 ? 'on centre' : `${Math.abs(v).toFixed(1)} cm ${horiz ? (v > 0 ? 'right' : 'left') : (v > 0 ? 'high' : 'low')}`);
    const labels = `<text x="${fr.W - fr.R}" y="${(fr.T + 12).toFixed(1)}" class="an-tick" text-anchor="end">right / high</text>
      <text x="${fr.W - fr.R}" y="${(fr.H - fr.B - 6).toFixed(1)}" class="an-tick" text-anchor="end">left / low</text>
      <text x="${fr.L}" y="${fr.H - 8}" class="an-tick">${day(d[0].r.createdAt)}</text>
      <text x="${fr.W - fr.R}" y="${fr.H - 8}" class="an-tick" text-anchor="end">${day(d[d.length - 1].r.createdAt)}</text>`;
    const tips = d.map((q, i) => ({ x: +fr.x(i).toFixed(1), y: null, t: dayLong(q.r.createdAt),
      rows: [[side(q.x, true), 'Left–right', BLUE], [side(q.y, false), 'High–low', ORANGE]] }));
    return `<div class="an-h sub"><h3>Sight drift</h3><span>group centre per round</span></div>
      ${chartBox(fr, 'Group centre left-right and high-low per round', fr.grid + zero + series('x', BLUE) + series('y', ORANGE) + labels, tips,
        legendOf([[BLUE, 'Left–right', true], [ORANGE, 'High–low', true]]))}`;
  }

  function groupTrend(rows) {
    const plotted = rows.filter(x => x.group);
    if (plotted.length < 2) return `<p class="muted an-note">Plot arrows in two rounds to see your sight drift and group trend.</p>`;
    const vals = plotted.flatMap(x => [x.group.size, x.group.offset]).filter(v => v != null);
    const [lo, hi, step] = A.niceRange(0, Math.max(...vals), 0);
    const fr = frame(plotted.length, lo, hi, step, { H: 200 });
    const series = (key, color) => {
      const p = plotted.map((x, i) => [i, x.group[key]]).filter(q => q[1] != null).map(([i, v]) => [fr.x(i), fr.y(v)]);
      return p.length ? `<path d="${pathOf(p)}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linejoin="round" pathLength="1" class="an-draw"/>` +
        (plotted.length <= 30 ? p.map(([px, py]) => `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="4" fill="${color}" class="an-dot an-fade"/>`).join('') : '') : '';
    };
    const xl = `<text x="${fr.L}" y="${fr.H - 8}" class="an-tick">${day(plotted[0].r.createdAt)}</text>
      <text x="${fr.W - fr.R}" y="${fr.H - 8}" class="an-tick" text-anchor="end">${day(plotted[plotted.length - 1].r.createdAt)}</text>`;
    const tips = plotted.map((x, i) => ({ x: +fr.x(i).toFixed(1), y: null, t: dayLong(x.r.createdAt),
      rows: [[Target.fmtCm(x.group.size), 'Avg end group', BLUE], [Target.fmtCm(x.group.offset), 'Centre offset', ORANGE],
        [Target.direction(x.group.cx, x.group.cy), 'Centre sits', null]] }));
    return `<div class="an-h sub"><h3>Group trend</h3><span>cm, lower is better</span></div>
      ${chartBox(fr, 'Group size and centre offset over time', fr.grid + series('size', BLUE) + series('offset', ORANGE) + xl, tips,
        legendOf([[BLUE, 'Avg end group', true], [ORANGE, 'Centre offset', true]]))}`;
  }

  function leaderCard(st, kind) {
    const limit = st.range === 'all' ? null : Number(st.range);
    const board = A.leaderboard(db.rounds, st.archers, kind, limit);
    if (board.length < 2) return '';
    const top = board[0].avg || 1;
    return `<section class="an-card">
      <div class="an-h"><h2>Head to head</h2><span>${kind === 'vegas' ? 'average score' : 'points per target'}</span></div>
      <div class="an-board">${board.map((b, i) => `<button class="an-brow ${b.aid === st.aid ? 'on' : ''}" data-action="stats-set" data-aid="${b.aid}" style="--i:${i}">
        <span class="an-rank">${i + 1}</span><span class="an-bname">${esc(b.name)}<small>${b.rounds} round${b.rounds === 1 ? '' : 's'}</small></span>
        <span class="an-btrack"><i style="width:${(b.avg / top * 100).toFixed(1)}%"></i></span>
        <b>${fmtVal(kind, b.avg)}</b></button>`).join('')}</div>
    </section>`;
  }

  function recentCard(rows, kind, avg) {
    const last = rows.slice(-6).reverse();
    return `<section class="an-card">
      <div class="an-h"><h2>Recent rounds</h2><span>vs your average</span></div>
      ${last.map(x => {
        const d = x.value - avg;
        const plots = x.r.plots && x.r.plots[x.aid] ? x.r.plots[x.aid].flat().filter(Boolean) : [];
        const thumb = plots.length ? `<span class="an-thumb">${Target.faceSvg({ arrows: plots.map(p => ({ ...p, color: '#0e2240' })), view: Target.VIEW_R, ariaLabel: 'Plotted arrows' })}</span>` : '';
        return `<button class="an-rrow" data-action="nav" data-to="#/card/${x.r.id}">
          ${thumb}<span class="an-rmain"><b>${x.total}</b>
            <small>${kind === 'vegas' ? `${x.bonus}× X` : `${x.slots} target${x.slots === 1 ? '' : 's'} · ${x.value.toFixed(2)}/target`}</small></span>
          <span class="an-rdate">${day(x.r.createdAt)}${x.r.note ? `<small>${esc(x.r.note)}</small>` : ''}</span>
          <span class="an-rdelta ${d >= 0 ? 'up' : 'down'}">${d >= 0 ? '+' : '−'}${kind === 'vegas' ? f1(Math.abs(d)) : Math.abs(d).toFixed(2)}</span>
        </button>`;
      }).join('')}
    </section>`;
  }

  /* ---------- interaction ---------- */
  function bind(root) {
    root.querySelectorAll('.an-chart[data-tips]').forEach(attachTips);
    countUp(root);
  }

  // Crosshair tooltip: the pointer snaps to the nearest round (or bar) along x.
  function attachTips(box) {
    let tips;
    try { tips = JSON.parse(box.dataset.tips); } catch (e) { return; }
    if (!tips.length) return;
    const svg = box.querySelector('svg'), tip = box.querySelector('.an-tip');
    const xh = svg.querySelector('.an-xh'), focus = svg.querySelector('.an-focus');
    const W = +box.dataset.w;
    let shown = -1;

    const show = i => {
      if (i === shown) return;
      shown = i;
      const t = tips[i];
      xh.setAttribute('x1', t.x); xh.setAttribute('x2', t.x);
      box.classList.add('tipping');
      if (t.y != null) { focus.setAttribute('cx', t.x); focus.setAttribute('cy', t.y); focus.style.display = ''; }
      else focus.style.display = 'none';
      // Names and notes are user text, so build with textContent.
      tip.textContent = '';
      const h = document.createElement('div'); h.className = 'tt'; h.textContent = t.t; tip.appendChild(h);
      for (const [v, l, c] of t.rows) {
        const row = document.createElement('div');
        const key = document.createElement('i'); if (c) key.style.background = c; else key.className = 'none';
        const b = document.createElement('b'); b.textContent = v;
        const s = document.createElement('span'); s.textContent = l;
        row.append(key, b, s); tip.appendChild(row);
      }
      const bw = box.clientWidth, px = t.x / W * bw;
      const tw = tip.offsetWidth;
      tip.style.left = Math.max(0, Math.min(bw - tw, px - tw / 2)) + 'px';
    };
    const hide = () => { shown = -1; box.classList.remove('tipping'); };
    const at = e => {
      const r = svg.getBoundingClientRect();
      const vx = (e.clientX - r.left) * W / r.width;
      let best = 0;
      tips.forEach((t, i) => { if (Math.abs(t.x - vx) < Math.abs(tips[best].x - vx)) best = i; });
      show(best);
    };
    svg.addEventListener('pointerdown', at);
    svg.addEventListener('pointermove', e => { if (e.pointerType === 'mouse' || e.buttons) at(e); });
    svg.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') hide(); });
    box.hideTip = hide;
    // Keyboard: focus the chart and use the arrow keys to step through it.
    box.tabIndex = 0;
    box.addEventListener('keydown', e => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      show(Math.max(0, Math.min(tips.length - 1, (shown < 0 ? (e.key === 'ArrowLeft' ? tips.length : -1) : shown) + (e.key === 'ArrowLeft' ? -1 : 1))));
    });
    box.addEventListener('blur', hide);
  }

  // A tap anywhere else closes a touch tooltip.
  document.addEventListener('pointerdown', e => {
    document.querySelectorAll('.an-chart.tipping').forEach(b => { if (!b.contains(e.target) && b.hideTip) b.hideTip(); });
  }, { passive: true });

  function countUp(root) {
    const els = root.querySelectorAll('.countup');
    if (reduceMotion()) return;
    els.forEach(el => {
      const to = parseFloat(el.dataset.to), dec = +el.dataset.dec || 0;
      if (!isFinite(to)) return;
      const t0 = performance.now(), dur = 900;
      const step = now => {
        const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3);
        el.textContent = (to * e).toFixed(dec);
        if (p < 1) requestAnimationFrame(step);
      };
      el.textContent = (0).toFixed(dec);
      requestAnimationFrame(step);
    });
  }

  return { view, bind, set };
})();
