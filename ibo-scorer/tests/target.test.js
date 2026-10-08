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

test('ellipse follows the shape of the group', () => {
  // Arrows strung out left to right: long axis horizontal.
  const wide = T.ellipse([{ x: -4, y: 0 }, { x: -2, y: 0.5 }, { x: 0, y: -0.5 }, { x: 2, y: 0.5 }, { x: 4, y: -0.5 }]);
  assert.ok(wide.rx > wide.ry * 3);
  assert.ok(Math.abs(wide.ang) < 10 || Math.abs(wide.ang - 180) < 10);
  // Same arrows turned upright: long axis vertical.
  const tall = T.ellipse([{ x: 0, y: -4 }, { x: 0.5, y: -2 }, { x: -0.5, y: 0 }, { x: 0.5, y: 2 }, { x: -0.5, y: 4 }]);
  assert.ok(Math.abs(Math.abs(tall.ang) - 90) < 10);
  assert.ok(Math.abs(tall.rx - wide.rx) < 1e-9);
  // Centre is the average position; too few arrows gives no shape.
  assert.ok(Math.abs(wide.cx) < 1e-9 && Math.abs(wide.cy) < 1e-9);
  assert.strictEqual(T.ellipse([{ x: 1, y: 1 }, { x: 2, y: 2 }, null]), null);
});

test('ellipse holds about the share of arrows asked for', () => {
  let seed = 3; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const gauss = () => Math.sqrt(-2 * Math.log(rnd() + 1e-9)) * Math.cos(2 * Math.PI * rnd());
  const pts = Array.from({ length: 2000 }, () => ({ x: 1 + gauss() * 2, y: -1 + gauss() }));
  const e = T.ellipse(pts, 0.8);
  const t = -e.ang * Math.PI / 180;
  const inside = pts.filter(q => {
    const dx = q.x - e.cx, dy = q.y - e.cy;
    const u = dx * Math.cos(t) - dy * Math.sin(t), v = dx * Math.sin(t) + dy * Math.cos(t);
    return (u / e.rx) ** 2 + (v / e.ry) ** 2 <= 1;
  }).length / pts.length;
  assert.ok(inside > 0.77 && inside < 0.83, `inside ${inside}`);
});
