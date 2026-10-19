'use strict';

/* =========================================================
   Backup files: checking a restore before it replaces anything.

   A backup is the app's own JSON (or a bare {archers, rounds}).
   Rounds are kept as they are, unknown fields included, so a file
   from a newer version still round-trips. But everything the app
   draws has to be present and the right shape: a file whose round
   claims 20 ends and holds 10 would otherwise restore "successfully"
   and then throw while drawing the round, leaving a blank screen.
   ========================================================= */

const Backup = (() => {
  const APP = 'ropers-archery-scorecard';
  const FORMAT = 1;
  const ARROWS_PER_END = 3;

  const isObject = v => !!v && typeof v === 'object' && !Array.isArray(v);
  const isId = v => typeof v === 'string' && v.length > 0;
  const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

  // values: { ibo: [11, 10, 8, 5, 0], vegas: ['X', 10, 9, 8, 7, 6, 0] } — the
  // face values each round type can hold, so the scorer stays the one source.
  // Returns the same object with missing round types filled in as IBO (rounds
  // saved before types existed), or throws a message meant for an archer.
  function parse(obj, values) {
    const sets = values || {};
    const faceValues = {
      ibo: Array.isArray(sets.ibo) ? sets.ibo : [],
      vegas: Array.isArray(sets.vegas) ? sets.vegas : []
    };

    if (!isObject(obj)) throw new Error('The file is not a backup.');
    if (obj.app !== undefined && obj.app !== APP) throw new Error('This backup is from a different app.');
    if (typeof obj.format === 'number' && obj.format > FORMAT) {
      throw new Error('This backup was made by a newer version of the app. Update the app and try again.');
    }

    const d = obj.data !== undefined ? obj.data : obj;
    if (!d || !Array.isArray(d.archers) || !Array.isArray(d.rounds)) {
      throw new Error('The file has no archers or rounds in it.');
    }

    const archerIds = new Set();
    d.archers.forEach((a, i) => {
      if (!a || !isId(a.id) || typeof a.name !== 'string') throw new Error(`Archer ${i + 1} is damaged.`);
      if (archerIds.has(a.id)) throw new Error(`Archer "${a.name}" appears twice.`);
      archerIds.add(a.id);
    });

    const roundIds = new Set();
    d.rounds.forEach((r, i) => {
      const damaged = why => new Error(`Round ${i + 1} is damaged${why ? ` (${why})` : ''}.`);

      if (!isObject(r) || !isId(r.id)) throw damaged();
      if (roundIds.has(r.id)) throw damaged('it appears twice');
      roundIds.add(r.id);

      // Rounds saved before round types existed are IBO rounds.
      if (r.type === undefined || r.type === null) r.type = 'ibo';
      const vegas = r.type === 'vegas';
      if (!vegas && r.type !== 'ibo') throw damaged(`unknown round type "${r.type}"`);
      const unit = vegas ? 'end' : 'target';

      if (!Array.isArray(r.archerIds) || !r.archerIds.length) throw damaged('no archers');
      if (new Set(r.archerIds).size !== r.archerIds.length) throw damaged('an archer appears twice');
      if (!r.archerIds.every(id => isId(id) && archerIds.has(id))) {
        throw damaged('it names an archer that is not in the backup');
      }

      if (!Number.isFinite(r.createdAt)) throw damaged('no date');
      if (r.status !== undefined && r.status !== 'in_progress' && r.status !== 'finished') {
        throw damaged(`unknown status "${r.status}"`);
      }
      if (!Number.isInteger(r.targets) || r.targets < 1) throw damaged('no target count');
      if (r.current !== undefined &&
          (!Number.isInteger(r.current) || r.current < 0 || r.current >= r.targets)) {
        throw damaged(`it is on ${unit} ${r.current + 1} of ${r.targets}`);
      }
      if (!isObject(r.scores)) throw damaged('no scores');

      for (const aid of r.archerIds) {
        const scores = r.scores[aid];
        if (!Array.isArray(scores) || scores.length !== r.targets) {
          const got = Array.isArray(scores) ? scores.length : 0;
          throw damaged(`${plural(got, unit)} recorded for a ${r.targets}-${unit} round`);
        }
        scores.forEach((v, t) => {
          const where = `${unit} ${t + 1}`;
          if (vegas) {
            if (!Array.isArray(v) || v.length !== ARROWS_PER_END) {
              throw damaged(`${where} does not have ${ARROWS_PER_END} arrows`);
            }
            if (!v.every(a => a == null || faceValues.vegas.includes(a))) {
              throw damaged(`${where} has a score that is not on the face`);
            }
          } else if (v != null && !faceValues.ibo.includes(v)) {
            throw damaged(`${where} has a score that is not on the face`);
          }
        });
      }

      // Plots only decorate the card: check they can be drawn, not where they sit.
      if (r.plots != null) {
        if (!isObject(r.plots)) throw damaged('its plotted arrows are not readable');
        for (const aid of r.archerIds) {
          const plots = r.plots[aid];
          if (plots === undefined) continue;
          if (!Array.isArray(plots) || plots.length !== r.targets) {
            throw damaged('its plotted arrows do not match the scores');
          }
          plots.forEach((end, t) => {
            if (end == null) return;
            if (!Array.isArray(end)) throw damaged(`the plotted arrows for ${unit} ${t + 1} are not readable`);
            const scores = r.scores[aid][t];
            if (Array.isArray(scores) && end.length !== scores.length) {
              throw damaged(`the plotted arrows for ${unit} ${t + 1} do not match its scores`);
            }
            if (!end.every(p => p == null || (isObject(p) && Number.isFinite(p.x) && Number.isFinite(p.y)))) {
              throw damaged(`a plotted arrow on ${unit} ${t + 1} has no position`);
            }
          });
        }
      }

      if (r.note !== undefined && typeof r.note !== 'string') throw damaged('its note is not text');
      if (r.source !== undefined && !isObject(r.source)) throw damaged('its import source is not readable');
    });

    return d;
  }

  return { APP, FORMAT, parse };
})();

if (typeof module !== 'undefined') module.exports = Backup;
