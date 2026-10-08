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
  assert.strictEqual((svg.match(/class="tf-arrow\b/g) || []).length, 2);
  assert.match(svg, /viewBox="-11 -11 22 22"/);
  assert.match(T.faceSvg({ view: 4 }), /viewBox="-4 -4 8 8"/);
});

test('fit frames the arrows, within limits', () => {
  assert.strictEqual(T.fit([{ x: 0.5, y: -1 }]), 4);
  assert.strictEqual(T.fit([{ x: 5, y: 1 }, null]), 7);
  assert.strictEqual(T.fit([{ x: 20, y: 0 }]), T.VIEW_R);
});

test('trim drops the farthest arrow from the centre, one at a time', () => {
  const pts = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: 9, y: 9 }, { x: -6, y: 0 }];
  const one = T.trim(pts, 1);
  assert.deepStrictEqual(one.removed, [{ x: 9, y: 9 }]);
  assert.strictEqual(one.kept.length, 4);
  const two = T.trim(pts, 2);
  assert.deepStrictEqual(two.removed, [{ x: 9, y: 9 }, { x: -6, y: 0 }]);
  assert.strictEqual(T.trim(pts, 0).kept.length, 5);
  assert.strictEqual(T.trim([{ x: 1, y: 1 }], 3).kept.length, 1);   // never empties the group
});

test('hull wraps the outside arrows only', () => {
  const h = T.hull([{ x: 0, y: 0 }, { x: 4, y: 0 }, { x: 4, y: 4 }, { x: 0, y: 4 }, { x: 2, y: 2 }, null]);
  assert.strictEqual(h.length, 4);
  assert.ok(!h.some(q => q.x === 2 && q.y === 2));
});

test('density peaks where arrows cluster', () => {
  const d = T.density([{ x: -2, y: 0 }, { x: -2, y: 0.2 }, { x: 3, y: 0 }], 5, 10, 0.8);
  const at = (x, y) => d[Math.floor((y + 5) / 1) * 10 + Math.floor((x + 5) / 1)];
  assert.strictEqual(Math.max(...d), 1);
  assert.ok(at(-2, 0) > at(3, 0));
  assert.ok(at(3, 0) > at(0, -4));
});
