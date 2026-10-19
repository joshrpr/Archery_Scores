'use strict';
// Run with: node --test ibo-scorer/tests/*.test.js
const test = require('node:test');
const assert = require('node:assert');
const B = require('../backup.js');

const VALUES = { ibo: [11, 10, 8, 5, 0], vegas: ['X', 10, 9, 8, 7, 6, 0] };
const ends = (n, end = ['X', 10, 9]) => Array.from({ length: n }, () => end.slice());
const parse = d => B.parse(d, VALUES);

function fixture() {
  const plots = Array.from({ length: 10 }, () => null);
  plots[0] = [{ x: 0, y: 0 }, { x: 0.5, y: 1 }, { x: -1, y: 0.25 }];
  return {
    archers: [
      { id: 'a1', name: 'Ann', deleted: false, createdAt: 1 },
      { id: 'a2', name: 'Bob', deleted: true, createdAt: 2 }
    ],
    rounds: [
      { id: 'r1', type: 'ibo', status: 'finished', createdAt: 10, targets: 3, current: 2,
        archerIds: ['a1', 'a2'], scores: { a1: [11, 8, 0], a2: [null, 5, 10] }, note: 'Club shoot' },
      { id: 'r2', type: 'vegas', status: 'in_progress', createdAt: 20, targets: 10, current: 0,
        archerIds: ['a1'], scores: { a1: ends(10) }, plots: { a1: plots } }
    ]
  };
}

test('a well-formed backup comes back as-is, old rounds marked IBO', () => {
  const d = fixture();
  delete d.rounds[0].type;
  assert.strictEqual(parse(d), d);
  assert.strictEqual(d.rounds[0].type, 'ibo');
  // The wrapped export and the bare data object are both accepted.
  assert.strictEqual(parse({ app: B.APP, format: B.FORMAT, data: fixture() }).rounds.length, 2);

  // A round just started from the new-round screen is all blanks.
  const fresh = fixture();
  fresh.rounds[1].scores.a1 = ends(10, [null, null, null]);
  fresh.rounds[1].plots = {};
  assert.doesNotThrow(() => parse(fresh));
});

test('a round with fewer ends or targets than it claims is refused', () => {
  const short = fixture();
  short.rounds[1].scores.a1 = ends(6);
  assert.throws(() => parse(short), /Round 2 is damaged \(6 ends recorded for a 10-end round\)/);

  const missing = fixture();
  missing.rounds[0].scores.a2.pop();
  assert.throws(() => parse(missing), /Round 1 is damaged \(2 targets recorded for a 3-target round\)/);
});

test('ends must hold three arrows and scores must be on the face', () => {
  const twoArrows = fixture();
  twoArrows.rounds[1].scores.a1[3] = ['X', 10];
  assert.throws(() => parse(twoArrows), /Round 2 is damaged \(end 4 does not have 3 arrows\)/);

  const badVegas = fixture();
  badVegas.rounds[1].scores.a1[0] = ['X', 10, 9.5];
  assert.throws(() => parse(badVegas), /end 1 has a score that is not on the face/);

  const badIbo = fixture();
  badIbo.rounds[0].scores.a1[0] = 9;
  assert.throws(() => parse(badIbo), /target 1 has a score that is not on the face/);
});

test('the scoring position and round metadata are checked', () => {
  const past = fixture();
  past.rounds[1].current = 10;
  assert.throws(() => parse(past), /it is on end 11 of 10/);

  const unknownStatus = fixture();
  unknownStatus.rounds[0].status = 'paused';
  assert.throws(() => parse(unknownStatus), /unknown status "paused"/);

  const unknownType = fixture();
  unknownType.rounds[0].type = 'wa18';
  assert.throws(() => parse(unknownType), /unknown round type "wa18"/);

  const noTargets = fixture();
  noTargets.rounds[0].targets = 0;
  assert.throws(() => parse(noTargets), /no target count/);
});

test('rounds must point at archers in the same file', () => {
  const dangling = fixture();
  dangling.rounds[1].archerIds = ['a9'];
  dangling.rounds[1].scores = { a9: ends(10) };
  assert.throws(() => parse(dangling), /Round 2 is damaged \(it names an archer that is not in the backup\)/);

  const twice = fixture();
  twice.rounds[0].archerIds = ['a1', 'a1'];
  assert.throws(() => parse(twice), /Round 1 is damaged \(an archer appears twice\)/);
});

test('plotted arrows must be drawable, and extra keys are ignored', () => {
  const ragged = fixture();
  ragged.rounds[1].plots.a1[2] = [{ x: 0, y: 0 }];
  assert.throws(() => parse(ragged), /plotted arrows for end 3 do not match its scores/);

  const lost = fixture();
  lost.rounds[1].plots.a1[1] = [{ x: 0, y: NaN }, null, null];
  assert.throws(() => parse(lost), /a plotted arrow on end 2 has no position/);

  const extra = fixture();
  extra.rounds[1].plots.a9 = 'not mine';
  assert.doesNotThrow(() => parse(extra));
});

test('the old checks still hold', () => {
  assert.throws(() => parse([]), /The file is not a backup/);
  assert.throws(() => parse({ nope: true }), /no archers or rounds/);
  assert.throws(() => parse({ app: 'something-else', data: fixture() }), /different app/);
  assert.throws(() => parse({ app: B.APP, format: B.FORMAT + 1, data: fixture() }), /newer version of the app/);

  const duplicateArchers = fixture();
  duplicateArchers.archers.push({ id: 'a1', name: 'Ann again' });
  assert.throws(() => parse(duplicateArchers), /Archer "Ann again" appears twice/);

  const duplicateRounds = fixture();
  duplicateRounds.rounds.push({ ...fixture().rounds[0] });
  assert.throws(() => parse(duplicateRounds), /Round 3 is damaged \(it appears twice\)/);
});
