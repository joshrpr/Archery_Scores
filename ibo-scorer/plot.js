'use strict';

/* =========================================================
   Touch plotting on a target face drawn by Target.faceSvg().
   Press near where the arrow is, then slide to fine-tune: slow
   movements are geared down for precision, and a magnifier
   floats just above your finger showing exactly where the arrow
   sits and what it scores. Lift to place it.
   ========================================================= */

const Plot = (() => {
  const NS = 'http://www.w3.org/2000/svg';
  const LOUPE_R = 2.4;     // cm shown either side of the arrow in the magnifier
  const LOUPE_PX = 128;    // magnifier diameter on screen
  const GAP_PX = 34;       // space between fingertip and magnifier
  // Pointer gearing: slow drags move the arrow at FINE of the finger's speed,
  // ramping up to 1:1 for quick moves so big corrections are still easy.
  const FINE = 0.4, FAST_PX = 14;

  const buzz = ms => { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) { /* unsupported */ } };
  const scoreText = s => (s.x ? 'X' : s.score ? String(s.score) : 'M');

  // Attach to every face inside root that has data-plot set.
  // onPlace(dataset, {x, y}) is called when the finger lifts.
  function bind(root, onPlace) {
    root.querySelectorAll('svg.tf[data-plot]').forEach(svg => attach(svg, onPlace));
  }

  function attach(svg, onPlace) {
    const wrap = svg.parentElement;
    let s = null;   // state of the drag in progress

    const lim = Target.VIEW_R - 0.3;
    const clamp = v => Math.max(-lim, Math.min(lim, v));

    function build() {
      const box = document.createElement('div');
      box.className = 'tf-loupe';
      const lens = svg.cloneNode(true);
      lens.removeAttribute('data-plot');
      lens.setAttribute('aria-hidden', 'true');
      const ghost = document.createElementNS(NS, 'circle');
      ghost.setAttribute('r', Target.ARROW_R);
      ghost.setAttribute('class', 'tf-shaft');
      const cross = document.createElementNS(NS, 'path');
      cross.setAttribute('class', 'tf-cross');
      lens.append(ghost, cross);
      const readout = document.createElement('b');
      box.append(lens, readout);
      wrap.appendChild(box);

      const marker = document.createElementNS(NS, 'circle');
      marker.setAttribute('r', Target.ARROW_R + 0.12);
      marker.setAttribute('class', 'tf-live');
      svg.appendChild(marker);
      return { box, lens, ghost, cross, readout, marker };
    }

    // Draw the current state once per frame, however many moves arrived.
    function paint() {
      s.frame = 0;
      const { x, y } = s.pt;
      const { lens, ghost, cross, readout, marker, box } = s.ui;
      marker.setAttribute('cx', x); marker.setAttribute('cy', y);
      ghost.setAttribute('cx', x); ghost.setAttribute('cy', y);
      lens.setAttribute('viewBox', `${x - LOUPE_R} ${y - LOUPE_R} ${LOUPE_R * 2} ${LOUPE_R * 2}`);
      cross.setAttribute('d', `M${x - 1} ${y}H${x - 0.5}M${x + 0.5} ${y}H${x + 1}M${x} ${y - 1}V${y - 0.5}M${x} ${y + 0.5}V${y + 1}`);

      const score = scoreText(Target.scoreAt(x, y));
      if (score !== s.score) {
        if (s.score != null) buzz(4);          // a tick each time a line is crossed
        s.score = score;
        readout.textContent = score;
        box.dataset.ring = score;
      }

      // Float the magnifier above the fingertip, following it smoothly. Near the
      // top of the screen there's no room above, so it sits beside the finger
      // instead, and stays on that side for the rest of the drag.
      const w = wrap.getBoundingClientRect();
      const fx = s.finger.x - w.left, fy = s.finger.y - w.top;
      const roomAbove = s.finger.y - GAP_PX - LOUPE_PX > 64;
      if (!roomAbove && !s.side) s.side = fx > w.width / 2 ? -1 : 1;
      if (roomAbove && s.side && s.finger.y - GAP_PX - LOUPE_PX > 64 + 40) s.side = 0;
      let left, top;
      if (s.side) {
        left = fx + s.side * (GAP_PX + LOUPE_PX / 2) - LOUPE_PX / 2;
        top = fy - LOUPE_PX / 2;
      } else {
        left = fx - LOUPE_PX / 2;
        top = fy - GAP_PX - LOUPE_PX;
      }
      const vw = document.documentElement.clientWidth;
      left = Math.max(4 - w.left, Math.min(vw - 4 - w.left - LOUPE_PX, left));
      box.style.transform = `translate3d(${left.toFixed(1)}px, ${top.toFixed(1)}px, 0)`;
    }

    const schedule = () => { if (!s.frame) s.frame = requestAnimationFrame(paint); };

    const start = e => {
      if (s) return;
      e.preventDefault();
      svg.setPointerCapture(e.pointerId);
      const p = Target.toCm(svg, e.clientX, e.clientY);
      s = {
        id: e.pointerId, ui: build(), score: null, side: 0, frame: 0,
        finger: { x: e.clientX, y: e.clientY },
        pt: { x: clamp(p.x), y: clamp(p.y) },
        cmPerPx: (Target.VIEW_R * 2) / svg.getBoundingClientRect().width
      };
      s.ui.box.style.width = s.ui.box.style.height = LOUPE_PX + 'px';
      paint();
      requestAnimationFrame(() => s && s.ui.box.classList.add('on'));
    };

    const move = e => {
      if (!s || e.pointerId !== s.id) return;
      const dx = e.clientX - s.finger.x, dy = e.clientY - s.finger.y;
      const speed = Math.hypot(dx, dy);
      const gain = FINE + (1 - FINE) * Math.min(1, speed / FAST_PX);
      s.finger = { x: e.clientX, y: e.clientY };
      s.pt = { x: clamp(s.pt.x + dx * gain * s.cmPerPx), y: clamp(s.pt.y + dy * gain * s.cmPerPx) };
      schedule();
    };

    const end = (e, cancelled) => {
      if (!s || e.pointerId !== s.id) return;
      if (s.frame) cancelAnimationFrame(s.frame);
      const { ui, pt } = s;
      s = null;
      ui.marker.remove(); ui.box.remove();
      if (cancelled) return;
      buzz(12);
      onPlace(svg.dataset, { x: Math.round(pt.x * 100) / 100, y: Math.round(pt.y * 100) / 100 });
    };

    svg.addEventListener('pointerdown', start);
    svg.addEventListener('pointermove', move);
    svg.addEventListener('pointerup', e => end(e, false));
    svg.addEventListener('pointercancel', e => end(e, true));
    svg.addEventListener('contextmenu', e => e.preventDefault());
  }

  return { bind };
})();
