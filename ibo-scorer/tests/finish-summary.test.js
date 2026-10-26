'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');

const source = readFileSync(join(__dirname, '..', 'app.js'), 'utf8');
const archers = [
  { id: 'a', name: 'Josh Roper' },
  { id: 'b', name: 'Maya Chen' },
  { id: 'c', name: 'Eli Brooks' }
];

// Run the complete production script with only its browser boundary stubbed.
// Tests exercise finishSummary, tally, ranking and PB selection together.
function summaryFor(rounds, id) {
  const app = { addEventListener() {}, querySelector() { return null; } };
  const context = vm.createContext({
    document: {
      getElementById() { return app; },
      querySelector() { return null; },
      addEventListener() {},
      documentElement: { dataset: {}, style: { setProperty() {} } }
    },
    window: { addEventListener() {}, scrollTo() {} },
    navigator: {},
    location: { hash: '' },
    localStorage: {
      getItem(key) { return key === 'ibo-scorer-v1' ? JSON.stringify({ archers, rounds }) : null; },
      setItem() {}
    },
    Native: { isApp: false, keepAwake() {} },
    Plot: { bind() {} }
  });
  vm.runInContext(source, context, { filename: 'app.js' });
  // Serializing at the VM boundary gives assertions ordinary local objects.
  return JSON.parse(vm.runInContext(`JSON.stringify(finishSummary(roundById(${JSON.stringify(id)})))`, context));
}

function vegas(id, createdAt, scores, plots) {
  return {
    id, type: 'vegas', status: 'finished', createdAt, targets: 10,
    archerIds: Object.keys(scores),
    scores: Object.fromEntries(Object.entries(scores).map(([aid, ends]) => [aid,
      Array.from({ length: 10 }, (_, end) => ends[end] || [null, null, null])])),
    ...(plots ? { plots } : {})
  };
}

function ibo(id, createdAt, scores) {
  return {
    id, type: 'ibo', status: 'finished', createdAt,
    targets: Object.values(scores)[0].length, archerIds: Object.keys(scores), scores
  };
}

test('shared Vegas leaders use Xs to rank and show only the featured archer plots with original slots', () => {
  const round = vegas('group', 100, {
    a: [[10, 10, 10], [9, null, null]],
    b: [['X', 10, 10], [9, null, null]],
    c: [['X', 10, 10], [9, null, null]]
  }, {
    a: [[{ x: -2, y: -1 }, null, null]],
    b: [[null, { x: 1.8, y: 0 }, null], [{ x: 3, y: 0 }, null, null]],
    c: [[{ x: 0.3, y: 0.1 }, null, null]]
  });
  const s = summaryFor([round], round.id);
  assert.equal(s.title, 'Shared lead');
  assert.equal(s.head, 'Maya Chen and Eli Brooks share the top');
  assert.equal(s.featuredName, 'Maya Chen');
  assert.equal(s.featuredArcherId, 'b');
  assert.equal(s.isSolo, false);
  assert.equal(s.roundLabel, 'Vegas 300');
  assert.equal(s.total, 39);
  assert.equal(s.bonus, 1);
  assert.equal(s.bonusMark, 'X');
  assert.equal(s.scored, 4);
  assert.equal(s.arrowCount, 4);
  assert.equal(s.totalSlots, 30);
  assert.deepEqual(s.board.map(({ rank, tie, name, total, bonus }) => ({ rank, tie, name, total, bonus })), [
    { rank: 1, tie: true, name: 'Maya Chen', total: 39, bonus: 1 },
    { rank: 1, tie: true, name: 'Eli Brooks', total: 39, bonus: 1 },
    { rank: 3, tie: false, name: 'Josh Roper', total: 39, bonus: 0 }
  ]);
  assert.deepEqual(s.arrows, [
    { x: 1.8, y: 0, end: 0, arrow: 1, index: 1 },
    { x: 3, y: 0, end: 1, arrow: 0, index: 3 }
  ]);
  assert.deepEqual(s.tally, []);
});

test('IBO winner exposes score and 11s columns plus the earned previous best for the same target count', () => {
  const prior = ibo('prior', 100, { a: Array(20).fill(10) });
  const otherLength = ibo('longer', 150, { a: Array(40).fill(11) });
  const round = ibo('group', 200, {
    a: [...Array(8).fill(11), ...Array(12).fill(10)],
    b: [...Array(6).fill(11), ...Array(12).fill(10), 8, 8],
    c: [...Array(5).fill(11), ...Array(10).fill(10), ...Array(5).fill(8)]
  });
  const s = summaryFor([otherLength, round, prior], round.id);
  assert.equal(s.title, 'Round winner');
  assert.equal(s.head, 'Josh Roper wins with a new best');
  assert.equal(s.roundLabel, 'IBO 3D');
  assert.equal(s.total, 208);
  assert.equal(s.bonus, 8);
  assert.equal(s.bonusMark, '11');
  assert.equal(s.arrowCount, 20);
  assert.equal(s.totalSlots, 20);
  assert.deepEqual(s.previousBest, { total: 200, bonus: 0 });
  assert.deepEqual(s.board.map(({ total, bonus, pb }) => ({ total, bonus, pb })), [
    { total: 208, bonus: 8, pb: true },
    { total: 202, bonus: 6, pb: false },
    { total: 195, bonus: 5, pb: false }
  ]);
  assert.deepEqual(s.tally, round.scores.a);
  assert.deepEqual(s.arrows, []);
});

test('solo PB can be earned through X count and compares the strongest earlier finished Vegas round', () => {
  const old = vegas('old', 100, { a: [[10, 10, 9]] });
  const best = vegas('best', 200, { a: [['X', 10, 9]] });
  const current = vegas('current', 300, { a: [['X', 'X', 9]] });
  const future = vegas('future', 400, { a: [['X', 'X', 'X']] });
  const unfinished = { ...vegas('unfinished', 250, { a: [['X', 'X', 'X']] }), status: 'in_progress' };
  const differentType = ibo('ibo', 200, { a: [11, 11, 11] });
  const s = summaryFor([future, unfinished, current, differentType, best, old], current.id);
  assert.equal(s.title, 'New personal best');
  assert.equal(s.head, 'New personal best');
  assert.equal(s.featuredName, 'Josh Roper');
  assert.equal(s.isSolo, true);
  assert.equal(s.total, 29);
  assert.equal(s.bonus, 2);
  assert.deepEqual(s.previousBest, { total: 29, bonus: 1 });
  assert.deepEqual(s.board, []);
});

test('a first round and an exact tie of a prior best do not claim a new personal best', () => {
  const first = vegas('first', 100, { a: [['X', 10, 9]] });
  const tied = vegas('tied', 200, { a: [['X', 10, 9]] });
  for (const [rounds, id] of [[[first], first.id], [[first, tied], tied.id]]) {
    const s = summaryFor(rounds, id);
    assert.equal(s.title, 'Round complete');
    assert.equal(s.head, 'Round complete');
    assert.equal('previousBest' in s, false);
  }
});

test('IBO blanks remain blank while a recorded miss counts toward the actual shot count', () => {
  const round = ibo('partial', 100, { a: [11, null, 0, 10] });
  const s = summaryFor([round], round.id);
  assert.equal(s.total, 21);
  assert.equal(s.bonus, 1);
  assert.equal(s.scored, 3);
  assert.equal(s.arrowCount, 3);
  assert.equal(s.totalSlots, 4);
  assert.deepEqual(s.tally, [11, null, 0, 10]);
  assert.equal(s.sub.includes('No misses'), false);
  assert.equal('previousBest' in s, false);
});

test('score-only and empty Vegas rounds never invent plotted arrows', () => {
  const scoreOnly = vegas('scores', 100, { a: [['X', 10, 9]] });
  const empty = vegas('empty', 200, { a: [] });
  const scored = summaryFor([scoreOnly], scoreOnly.id);
  assert.equal(scored.arrowCount, 3);
  assert.deepEqual(scored.arrows, []);
  const blank = summaryFor([empty], empty.id);
  assert.equal(blank.total, 0);
  assert.equal(blank.arrowCount, 0);
  assert.equal(blank.totalSlots, 30);
  assert.deepEqual(blank.arrows, []);
  assert.equal(blank.sub.includes('No misses'), false);
});
