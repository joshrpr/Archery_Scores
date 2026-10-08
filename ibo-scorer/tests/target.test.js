'use strict';
// Run with: node --test ibo-scorer/tests/*.test.js
const test = require('node:test');
const assert = require('node:assert');
const T = require('../target.js');

test('scores by ring with line cutters counting up', () => {
  assert.deepStrictEqual(T.scoreAt(0, 0), { score: 10, x: true });
  assert.deepStrictEqual(T.scoreAt(1.3, 0), { score: 10, x: true });     // cuts the X line
  assert.deepStrictEqual(T.scoreAt(1.5, 0), { score: 10, x: false });
  assert.strictEqual(T.scoreAt(2.3, 0).score, 10);                       // cuts the 10 line
  assert.strictEqual(T.scoreAt(2.5, 0).score, 9);
  assert.strictEqual(T.scoreAt(0, 5).score, 8);
  assert.strictEqual(T.scoreAt(-7, 0).score, 7);
  assert.strictEqual(T.scoreAt(0, -10.3).score, 6);
  assert.deepStrictEqual(T.scoreAt(0, 10.5), { score: 0, x: false });
  assert.strictEqual(T.scoreAt(2.5, 0, 0).score, 9);
});

test('group centre, offset, spread and mean radius', () => {
  const g = T.group([{ x: 1, y: 1 }, { x: 3, y: 1 }, null, { x: 2, y: 4 }]);
  assert.strictEqual(g.n, 3);
  assert.strictEqual(g.cx, 2);
  assert.strictEqual(g.cy, 2);
  assert.ok(Math.abs(g.offset - Math.hypot(2, 2)) < 1e-9);
  assert.ok(Math.abs(g.spread - Math.hypot(1, 3)) < 1e-9);
  assert.ok(Math.abs(g.meanR - (Math.SQRT2 * 2 + 2) / 3) < 1e-9);
  assert.strictEqual(T.group([]), null);
  assert.strictEqual(T.group([null]), null);
});

test('direction names the side the group sits on', () => {
  assert.strictEqual(T.direction(0, 0), 'centred');
  assert.strictEqual(T.direction(-2, -2), 'high left');
  assert.strictEqual(T.direction(1, 0.2), 'right');
  assert.strictEqual(T.direction(0, 3), 'low');
});

test('face svg draws every arrow', () => {
  const svg = T.faceSvg({ arrows: [{ x: 1, y: 2, label: 1 }, { x: -3, y: 0 }] });
  assert.strictEqual((svg.match(/class="tf-arrow"/g) || []).length, 2);
  assert.match(svg, /viewBox="-12.5 -12.5 25 25"/);
});
