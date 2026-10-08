'use strict';

/* =========================================================
   Vegas target face: drawing, tap-to-position, ring scoring
   and arrow-group maths. Positions are stored in centimetres
   from the centre of the spot (x right, y down), so they stay
   correct whatever size the face is drawn at.
   ========================================================= */

const Target = (() => {
  // 40 cm Vegas face, as shot on the 3-spot: rings 10 down to 6, 2 cm apart,
  // with a 1 cm X ring inside the 10. Anything outside the 6 is a miss.
  const RINGS = [
    { score: 10, r: 2 },
    { score: 9, r: 4 },
    { score: 8, r: 6 },
    { score: 7, r: 8 },
    { score: 6, r: 10 }
  ];
  const X_R = 1;
  const FACE_R = 10;          // outer edge of the scoring area
  const VIEW_R = 11;          // drawn area, so misses just off the face can be plotted
  // Arrow radius used for line cutters: if the shaft touches a line the arrow
  // takes the higher score. 0.4 cm is roughly a typical indoor arrow.
  const ARROW_R = 0.4;

  const COLORS = { 10: '#ffd400', 9: '#ffd400', 8: '#e8352b', 7: '#e8352b', 6: '#2a7fd4' };
  const LINE = { 10: '#6b5a00', 9: '#6b5a00', 8: '#7a1a14', 7: '#7a1a14', 6: '#0d3d6e' };

  /* ---------- scoring ---------- */
  // Score for an arrow whose centre is at (x, y) cm. Returns { score, x }.
  function scoreAt(x, y, arrowR = ARROW_R) {
    const d = Math.hypot(x, y) - arrowR;
    if (d <= X_R) return { score: 10, x: true };
    for (const ring of RINGS) if (d <= ring.r) return { score: ring.score, x: false };
    return { score: 0, x: false };
  }

  /* ---------- group maths ---------- */
  // pts: [{x, y}] in cm. Nulls are ignored.
  function group(pts) {
    const p = (pts || []).filter(Boolean);
    const n = p.length;
    if (!n) return null;
    const cx = p.reduce((s, q) => s + q.x, 0) / n;
    const cy = p.reduce((s, q) => s + q.y, 0) / n;
    let spread = 0;
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      spread = Math.max(spread, Math.hypot(p[i].x - p[j].x, p[i].y - p[j].y));
    }
    const meanR = p.reduce((s, q) => s + Math.hypot(q.x - cx, q.y - cy), 0) / n;
    return { n, cx, cy, offset: Math.hypot(cx, cy), spread, meanR };
  }

  // Compass-style direction of the group centre, e.g. "high left". Empty when centred.
  function direction(cx, cy, dead = 0.5) {
    const v = cy < -dead ? 'high' : cy > dead ? 'low' : '';
    const h = cx < -dead ? 'left' : cx > dead ? 'right' : '';
    return [v, h].filter(Boolean).join(' ') || 'centred';
  }

  const fmtCm = v => (v == null ? '–' : v.toFixed(1) + ' cm');

  /* ---------- drawing ---------- */
  const f = v => +v.toFixed(2);

  // opts.arrows: [{x, y, label?, color?}]; opts.showGroup: result of group() to mark the centre.
  // opts.view: half-width shown in cm (defaults to the whole face); smaller zooms in.
  function faceSvg({ arrows = [], showGroup = null, cls = '', ariaLabel = 'Target face', view = VIEW_R } = {}) {
    const rings = [...RINGS].reverse().map(ring =>
      `<circle r="${ring.r}" fill="${COLORS[ring.score]}" stroke="${LINE[ring.score]}" stroke-width="0.06"/>`).join('');
    const x = `<circle r="${X_R}" fill="none" stroke="${LINE[10]}" stroke-width="0.05"/>
      <path d="M-0.35 0H0.35M0 -0.35V0.35" stroke="${LINE[10]}" stroke-width="0.06"/>`;
    const labels = RINGS.slice(1).map(ring =>
      `<text x="0" y="${f(-ring.r + 0.75)}" class="tf-ring">${ring.score}</text>`).join('');
    const dots = arrows.map(a => `<g class="tf-arrow">
        <circle cx="${f(a.x)}" cy="${f(a.y)}" r="${ARROW_R + 0.12}" fill="${a.color || '#0e2240'}" stroke="#fff" stroke-width="0.12"/>
        ${a.label != null ? `<text x="${f(a.x)}" y="${f(a.y + 0.22)}" class="tf-num">${a.label}</text>` : ''}
      </g>`).join('');
    const g = showGroup ? `<g class="tf-group">
        <circle cx="${f(showGroup.cx)}" cy="${f(showGroup.cy)}" r="${f(Math.max(showGroup.meanR, 0.2))}"
          fill="none" stroke="#fff" stroke-width="0.1" stroke-dasharray="0.4 0.3"/>
        <path d="M${f(showGroup.cx - 0.6)} ${f(showGroup.cy)}H${f(showGroup.cx + 0.6)}M${f(showGroup.cx)} ${f(showGroup.cy - 0.6)}V${f(showGroup.cy + 0.6)}"
          stroke="#fff" stroke-width="0.14"/>
      </g>` : '';
    const v = f(view);
    return `<svg class="tf ${cls}" viewBox="${-v} ${-v} ${v * 2} ${v * 2}"
      role="img" aria-label="${ariaLabel}">
      <rect x="${-v}" y="${-v}" width="${v * 2}" height="${v * 2}" rx="${f(v * 0.06)}" fill="#f6f3ea"/>
      ${rings}${x}${labels}${g}${dots}</svg>`;
  }

  // Half-width that frames a set of arrows with some margin, for zoomed views.
  function fit(arrows) {
    const far = Math.max(0, ...arrows.filter(Boolean).map(a => Math.max(Math.abs(a.x), Math.abs(a.y))));
    return Math.min(VIEW_R, Math.max(4, Math.ceil(far + 1.5)));
  }

  // Convert a screen point to cm on a face drawn by faceSvg().
  function toCm(svg, clientX, clientY) {
    const b = svg.getBoundingClientRect();
    const s = (VIEW_R * 2) / b.width;
    return {
      x: Math.round(((clientX - b.left) * s - VIEW_R) * 100) / 100,
      y: Math.round(((clientY - b.top) * s - VIEW_R) * 100) / 100
    };
  }

  return { RINGS, X_R, FACE_R, VIEW_R, ARROW_R, scoreAt, group, direction, fmtCm, faceSvg, fit, toCm };
})();

if (typeof module !== 'undefined') module.exports = Target;
