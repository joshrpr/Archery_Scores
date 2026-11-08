"use strict";

// Presentation receives a detached snapshot and never changes stored shots.
const RoundCompletion = (() => {
  function snapshot(r, { nameOf, tally, ranking, target }) {
    const aid = r.archerIds.includes(r.plotAid) ? r.plotAid : r.archerIds[0];
    if (!aid || r.scores[aid]?.flat().length !== 30) return null;
    const arrows = r.scores[aid].flat().map((value, index) => {
      const p = r.plots?.[aid]?.[Math.floor(index / 3)]?.[index % 3];
      if (p && Number.isFinite(p.x) && Number.isFinite(p.y)) {
        return { value, x: p.x, y: p.y, illustrative: false };
      }
      // Representative centers include the existing line-cutter allowance.
      const rings = target.RINGS;
      let radius;
      if (value === "X") radius = target.X_R * 0.7;
      else if (value === 0) radius = target.FACE_R + target.ARROW_R + 0.6;
      else {
        const i = rings.findIndex((ring) => ring.score === value);
        if (i < 0) throw new Error("Unsupported Vegas score");
        const inner = i === 0 ? target.X_R : rings[i - 1].r;
        radius = (inner + rings[i].r) / 2 + target.ARROW_R;
      }
      const angle = index * 2.399963229728653;
      return {
        value,
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        illustrative: true,
      };
    });
    const result = tally(r, aid);
    return {
      roundId: r.id,
      archerId: aid,
      name: nameOf(aid),
      total: result.total,
      xs: result.xs,
      arrows,
      illustrative: arrows.some((p) => p.illustrative),
      face: {
        rings: target.RINGS.map((ring) => ({ ...ring })),
        xRadius: target.X_R,
        radius: target.FACE_R,
      },
      standings: ranking(r).map((row) => ({
        id: row.id,
        name: nameOf(row.id),
        rank: row.rank,
        total: row.total,
        xs: row.xs,
      })),
    };
  }

  function create(deps) {
    let pending = null;
    return {
      cancel() {
        pending = null;
      },
      async finish() {
        if (pending || deps.isPresenting()) return;
        const r = deps.currentRound();
        if (!r) return;
        const request = {};
        pending = request;
        const path = deps.routeKey();
        const valid = () =>
          pending === request &&
          deps.routeKey() === path &&
          deps.currentRound() === r;
        try {
          const editing = r.status === "finished";
          const gaps = deps.gapsOf(r);
          if (!(await deps.confirm(r, gaps, editing)) || !valid()) return;
          const oldStatus = r.status,
            oldFinishedAt = r.finishedAt,
            oldScores = r.scores;
          // Copy before filling blanks so a failed write can be retried intact.
          if (gaps.length) {
            r.scores = Object.fromEntries(
              Object.entries(r.scores).map(([aid, scores]) => [
                aid,
                deps.isVegas(r)
                  ? scores.map((end) => end.map((v) => (v == null ? 0 : v)))
                  : scores.map((v) => (v == null ? 0 : v)),
              ]),
            );
          }
          r.status = "finished";
          r.finishedAt = oldFinishedAt || Date.now();
          if (!deps.save()) {
            r.scores = oldScores;
            r.status = oldStatus;
            if (oldFinishedAt === undefined) delete r.finishedAt;
            else r.finishedAt = oldFinishedAt;
            return;
          }
          deps.success();
          if (!editing && deps.isVegas(r)) {
            try {
              const data = snapshot(r, deps);
              if (data) {
                deps.present(data);
                return;
              }
            } catch (error) {
              console.warn("Round presentation unavailable", error);
            }
          }
          deps.go("#/card/" + r.id);
        } finally {
          if (pending === request) pending = null;
        }
      },
    };
  }
  return { create };
})();
