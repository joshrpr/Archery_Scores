'use strict';

/* =========================================================
   Touch plotting on a target face drawn by Target.faceSvg().
   Press where the arrow is, slide to fine-tune while a zoomed
   loupe shows what's under your finger, lift to place it.
   ========================================================= */

const Plot = (() => {
  const NS = 'http://www.w3.org/2000/svg';
  const LOUPE_R = 2.6;    // cm shown either side of the finger in the loupe

  // Attach to every face inside root that has data-plot set.
  // onPlace(dataset, {x, y}) is called when the finger lifts.
  function bind(root, onPlace) {
    root.querySelectorAll('svg.tf[data-plot]').forEach(svg => attach(svg, onPlace));
  }

  function attach(svg, onPlace) {
    const wrap = svg.parentElement;
    let marker = null, loupe = null, cross = null, readout = null, id = null, pt = null;

    const update = e => {
      pt = Target.toCm(svg, e.clientX, e.clientY);
      const lim = Target.VIEW_R - 0.3;
      pt.x = Math.max(-lim, Math.min(lim, pt.x));
      pt.y = Math.max(-lim, Math.min(lim, pt.y));
      marker.setAttribute('cx', pt.x); marker.setAttribute('cy', pt.y);
      const s = Target.scoreAt(pt.x, pt.y);
      readout.textContent = s.x ? 'X' : s.score ? String(s.score) : 'M';
      loupe.setAttribute('viewBox', `${pt.x - LOUPE_R} ${pt.y - LOUPE_R} ${LOUPE_R * 2} ${LOUPE_R * 2}`);
      cross.setAttribute('d', `M${pt.x - 0.9} ${pt.y}H${pt.x + 0.9}M${pt.x} ${pt.y - 0.9}V${pt.y + 0.9}`);
      // Keep the loupe away from the finger: top corner opposite the touch.
      loupe.parentElement.classList.toggle('right', pt.x < 0);
    };

    const start = e => {
      if (id != null) return;
      id = e.pointerId;
      svg.setPointerCapture(id);
      e.preventDefault();

      const box = document.createElement('div');
      box.className = 'tf-loupe';
      loupe = svg.cloneNode(true);
      loupe.removeAttribute('data-plot');
      loupe.setAttribute('aria-hidden', 'true');
      cross = document.createElementNS(NS, 'path');
      cross.setAttribute('class', 'tf-cross');
      loupe.appendChild(cross);
      readout = document.createElement('b');
      box.append(loupe, readout);
      wrap.appendChild(box);

      marker = document.createElementNS(NS, 'circle');
      marker.setAttribute('r', Target.ARROW_R + 0.12);
      marker.setAttribute('class', 'tf-live');
      svg.appendChild(marker);
      update(e);
    };

    const move = e => {
      if (e.pointerId !== id) return;
      update(e);
    };

    const end = (e, cancelled) => {
      if (e.pointerId !== id) return;
      id = null;
      marker.remove(); wrap.querySelector('.tf-loupe').remove();
      if (!cancelled && pt) onPlace(svg.dataset, pt);
    };

    svg.addEventListener('pointerdown', start);
    svg.addEventListener('pointermove', move);
    svg.addEventListener('pointerup', e => end(e, false));
    svg.addEventListener('pointercancel', e => end(e, true));
  }

  return { bind };
})();
