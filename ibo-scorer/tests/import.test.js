'use strict';
// Run with: node --test ibo-scorer/tests/*.test.js
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const I = require('../import.js');

const fixture = () => I.readTable(new Uint8Array(fs.readFileSync(path.join(__dirname, 'fixtures/old-app-export.xlsx'))));
const HEAD = ['EntryID', 'EntryDate', 'EntryType', 'RoundName', 'RoundMaxArrowCount', 'Score', 'RoundArrows', 'DeviceID'];

test('reads every round of the old app export with matching totals', async () => {
  const { entries, skipped } = I.parse(await fixture());
  assert.strictEqual(entries.length, 10);
  assert.deepStrictEqual(skipped, []);
  for (const e of entries) assert.strictEqual(e.total, e.listedScore);
  assert.deepStrictEqual(entries.map(e => e.total), [271, 278, 287, 279, 279, 277, 282, 284, 280, 144]);
  const first = entries[0];
  assert.deepStrictEqual(first.ends[0], [8, 9, 8]);
  assert.deepStrictEqual(first.ends[9], ['X', 'X', 'X']);
  assert.strictEqual(first.xs, 6);
  const d = new Date(first.createdAt);
  assert.deepStrictEqual([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes()], [2026, 5, 28, 8, 54]);
  assert.strictEqual(first.note, 'Practice, imported');
});

test('a round stopped part way imports unfinished at its first open end', async () => {
  const last = I.parse(await fixture()).entries.at(-1);
  assert.strictEqual(last.complete, false);
  assert.strictEqual(last.shot, 15);
  assert.strictEqual(last.current, 5);
  const r = I.toRound(last, 'a1', 'r1');
  assert.strictEqual(r.status, 'in_progress');
  assert.strictEqual(r.type, 'vegas');
  assert.deepStrictEqual(r.scores.a1[5], [null, null, null]);
  assert.strictEqual(r.source.key, 'e7b18272-1e0a-4e1f-8430-e07631ba899f:31');
});

test('CSV with the same columns works, and other round types are skipped', () => {
  const csv = [HEAD.join(','),
    '1,2026-07-01 10:00,Round,Vegas 300 (Single),30,30,"X \t10 \tM",dev',
    '2,2026-07-02 10:00,Round,WA 18m,60,500,"10 \t9",dev',
    '3,2026-07-03 10:00,Note,,,,,dev'].join('\r\n');
  const { entries, skipped } = I.parse(I.parseCsv(csv));
  assert.strictEqual(entries.length, 1);
  assert.deepStrictEqual(entries[0].ends[0], ['X', 10, 0]);
  assert.strictEqual(entries[0].total, 20);
  assert.deepStrictEqual(skipped.map(s => s.reason), ['Only Vegas 300 rounds can be imported', 'Not a scored round']);
});

test('per-end text is used when the arrow list is missing', () => {
  const rows = [['RoundName', 'EntryDate', 'RoundEnds'],
    ['Vegas 300', '2026-07-01', 'Dist #1 \tEnd #1 \tX \t9 \t10 \tArrowAvg \t9.7\r\nDist #1 \tEnd #2 \t8 \tM \t7 \tArrowAvg \t5']];
  const e = I.parse(rows).entries[0];
  assert.deepStrictEqual(e.ends.slice(0, 2), [['X', 9, 10], [8, 0, 7]]);
});

test('files that are not score exports are refused', () => {
  assert.throws(() => I.parse([['Name', 'Score']]), /does not look like a score export/);
});
