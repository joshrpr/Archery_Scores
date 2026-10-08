'use strict';
// Run with: node --test ibo-scorer/tests/*.test.js
const test = require('node:test');
const assert = require('node:assert');
const A = require('../stats.js');

const vegasRound = (id, t, ends, plots) => ({
  id, type: 'vegas', status: 'finished', createdAt: t, targets: 10, archerIds: ['a'],
  scores: { a: ends }, plots: plots ? { a: plots } : undefined
});
const iboRound = (id, t, scores, status = 'finished') => ({
  id, type: 'ibo', status, createdAt: t, targets: scores.length, archerIds: ['a', 'b'],
  scores: { a: scores, b: scores.map(() => 5) }
});

test('rounds are filtered by archer, kind and status, oldest first', () => {
  const rounds = [iboRound('2', 20, [10]), vegasRound('v', 5, [['X', 9, 8]]), iboRound('1', 10, [11]), iboRound('3', 30, [8], 'in_progress')];
  assert.deepStrictEqual(A.roundsFor(rounds, 'a', 'ibo').map(r => r.id), ['1', '2']);
  assert.deepStrictEqual(A.roundsFor(rounds, 'a', 'vegas').map(r => r.id), ['v']);
  assert.deepStrictEqual(A.roundsFor(rounds, 'c', 'ibo'), []);
});

test('summary counts Xs as 10 and IBO value is per target', () => {
  const v = A.summarize(vegasRound('v', 1, [['X', 10, 0], [9, 9, 8]]), 'a');
  assert.strictEqual(v.total, 46);
  assert.strictEqual(v.bonus, 1);
  assert.strictEqual(v.misses, 1);
  assert.strictEqual(v.value, 46);
  const i = A.summarize(iboRound('i', 1, [11, 10, 8, 0]), 'a');
  assert.strictEqual(i.total, 29);
  assert.strictEqual(i.bonus, 1);
  assert.strictEqual(i.value, 29 / 4);
});

test('kpis: best, rates and recent-vs-prior delta', () => {
  const rows = [100, 110, 120, 130, 140, 150, 160, 170].map((s, n) => ({ value: s, bonus: n, n: 30, misses: 3, group: null, r: {} }));
  const k = A.kpis(rows);
  assert.strictEqual(k.rounds, 8);
  assert.strictEqual(k.best.value, 170);
  assert.strictEqual(k.avg, 135);
  assert.ok(Math.abs(k.hitRate - 0.9) < 1e-9);
  assert.strictEqual(k.delta, 150 - 110);       // last 5 rounds vs the 3 before them
  assert.strictEqual(A.kpis(rows.slice(0, 3)).delta, null);
});

test('rolling average trails up to k values', () => {
  assert.deepStrictEqual(A.rolling([2, 4, 6, 8], 2), [2, 3, 5, 7]);
});

test('score mix covers every face value', () => {
  const rows = [A.summarize(vegasRound('v', 1, [['X', 10, 10], [6, 0, 9]]), 'a')];
  const m = A.mix(rows, 'vegas');
  assert.deepStrictEqual(m.map(x => x.v), ['X', 10, 9, 8, 7, 6, 0]);
  assert.strictEqual(m.find(x => x.v === 10).count, 2);
  assert.ok(Math.abs(m.reduce((s, x) => s + x.pct, 0) - 1) < 1e-9);
});

test('end and arrow averages', () => {
  const rows = [
    A.summarize(vegasRound('1', 1, [[10, 10, 10], [9, 9, 9]]), 'a'),
    A.summarize(vegasRound('2', 2, [[10, 10, 8], [7, 9, 'X']]), 'a')
  ];
  const e = A.endAverages(rows);
  assert.deepStrictEqual(e.ends, [29, 26.5]);
  assert.deepStrictEqual(e.arrows, [9, 9.5, 9.25]);
});

test('groups and shots come from plotted arrows only', () => {
  const plots = [[{ x: 1, y: 1 }, { x: 3, y: 1 }, null], [null, null, null]];
  const r = vegasRound('p', 1, [[9, 9, 9], [9, 9, 9]], plots);
  const g = A.groupStats(r, 'a');
  assert.strictEqual(g.size, 2);
  assert.strictEqual(g.cx, 2);
  assert.strictEqual(A.groupStats(vegasRound('n', 1, [[9, 9, 9]]), 'a'), null);
  const s = A.shots([A.summarize(r, 'a')]);
  assert.strictEqual(s.length, 2);
  assert.strictEqual(s[0].round, 0);
});

test('leaderboard ranks archers by average', () => {
  const rounds = [iboRound('1', 1, [11, 10]), iboRound('2', 2, [8, 8])];
  const b = A.leaderboard(rounds, [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }, { id: 'c', name: 'C' }], 'ibo', null);
  assert.deepStrictEqual(b.map(x => x.aid), ['a', 'b']);
  assert.strictEqual(b[0].avg, (10.5 + 8) / 2);
  assert.strictEqual(A.leaderboard(rounds, [{ id: 'a', name: 'A' }], 'ibo', 1)[0].avg, 8);
});

test('niceRange brackets the data within limits', () => {
  const [lo, hi, step] = A.niceRange(255, 291, 0, 300);
  assert.ok(lo <= 255 && hi >= 291 && hi <= 300 && step > 0);
  const [a, b] = A.niceRange(5, 5, 0);
  assert.ok(a < 5 && b > 5 && a >= 0);
});
