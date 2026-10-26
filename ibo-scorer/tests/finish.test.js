'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const Finish = require('../finish.js');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const vm = require('node:vm');

const vegas = (overrides = {}) => ({
  type: 'vegas', title: 'Round winner', head: 'Josh Roper takes the round',
  featuredName: 'Josh Roper', roundLabel: 'Vegas 300', isSolo: false,
  total: 294, bonus: 18, bonusMark: 'X', scored: 30, arrowCount: 30, totalSlots: 30,
  sub: [], previousBest: null,
  board: [
    { rank: 1, name: 'Josh Roper', total: 294, bonus: 18 },
    { rank: 2, name: 'Maya Chen', total: 291, bonus: 14 }
  ],
  arrows: [
    { x: -2.75, y: 0.4, index: 0, end: 0, arrow: 0 },
    { x: 0.5, y: -1.25, index: 10, end: 3, arrow: 1 },
    { x: 0.7, y: 0.35, index: 28, end: 9, arrow: 1 }
  ],
  tally: [], ...overrides
});

const ibo = (tally, overrides = {}) => vegas({
  type: 'ibo', roundLabel: 'IBO 3D', bonusMark: '11', arrows: [], tally,
  totalSlots: tally.length, scored: tally.filter(v => v != null).length,
  ...overrides
});

const attrs = tag => Object.fromEntries(
  [...tag.matchAll(/([\w-]+)="([^"]*)"/g)].map(m => [m[1], m[2]])
);
const marks = html => [...html.matchAll(/<g\b[^>]*\bdata-shot="[^"]+"[^>]*>/g)].map(m => attrs(m[0]));

test('Vegas replay preserves saved coordinates and chronology without mutating input', () => {
  const input = vegas();
  input.arrows = [input.arrows[2], input.arrows[0], input.arrows[1]];
  const before = structuredClone(input);
  const plan = Finish.shotPlan(input);

  assert.equal(plan.kind, 'vegas');
  assert.equal(plan.symbolic, false);
  assert.deepEqual(plan.shots.map(s => [s.index, s.x, s.y]), [
    [0, -2.75, 0.4], [10, 0.5, -1.25], [28, 0.7, 0.35]
  ]);
  assert.deepEqual(plan.prior.map(s => s.index), [0, 10]);
  assert.equal(plan.last.index, 28);
  assert.deepEqual(input, before);
});

test('last plotted arrow is rendered once at its saved position, never as an extra center hit', () => {
  const rendered = marks(Finish.html(vegas()));
  assert.equal(rendered.length, 3);
  assert.deepEqual(rendered.map(s => s['data-shot']).sort(), ['0', '10', '28']);
  const last = rendered.find(s => s['data-shot'] === '28');
  assert.equal(Number(last['data-x']), 0.7);
  assert.equal(Number(last['data-y']), 0.35);
  assert.match(last.class, /\bfin-last\b/);
  assert.doesNotMatch(last.class, /\bfin-pin\b/);
});

test('overlapping plots remain distinct recorded arrows', () => {
  const input = vegas({ arrows: [
    { x: 0.25, y: -0.5, index: 0 },
    { x: 0.25, y: -0.5, index: 29 }
  ] });
  assert.equal(Finish.shotPlan(input).shots.length, 2);
  assert.equal(marks(Finish.html(input)).length, 2);
});

test('score-only Vegas rounds have no fabricated recorded marker', () => {
  const input = vegas({ arrows: [] });
  const plan = Finish.shotPlan(input);
  assert.equal(plan.symbolic, true);
  assert.equal(plan.last, null);
  assert.deepEqual(plan.shots, []);
  assert.deepEqual(plan.prior, []);
  assert.equal(marks(Finish.html(input)).length, 0);
});

test('invalid Vegas coordinates are excluded without changing the remaining plot', () => {
  const input = vegas({ arrows: [
    { x: NaN, y: 1, index: 0 }, { x: 1, y: Infinity, index: 1 },
    { x: '1', y: 0, index: 2 }, { x: -0.4, y: 0.8, index: 3 }
  ] });
  const plan = Finish.shotPlan(input);
  assert.equal(plan.shots.length, 1);
  assert.equal(plan.last.index, 3);
  assert.equal(plan.last.x, -0.4);
  assert.equal(plan.last.y, 0.8);
});

test('IBO medallion includes misses, excludes blank targets, and replays the last recorded category', () => {
  const input = ibo([11, null, 10, 8, 5, 0, null]);
  const plan = Finish.shotPlan(input);
  assert.equal(plan.kind, 'ibo');
  assert.equal(plan.symbolic, true);
  assert.deepEqual(plan.shots.map(s => [s.index, s.value]), [[0, 11], [2, 10], [3, 8], [4, 5], [5, 0]]);
  assert.equal(plan.last.index, 5);
  assert.equal(plan.last.value, 0);
  assert.equal(plan.prior.length, 4);
  const rendered = marks(Finish.html(input));
  assert.equal(rendered.length, 5);
  assert.deepEqual(rendered.map(s => Number(s['data-score'])).sort((a, b) => a - b), [0, 5, 8, 10, 11]);
});

test('IBO empty rounds produce no score pins', () => {
  const input = ibo([null, null, null], { total: 0, bonus: 0 });
  assert.deepEqual(Finish.shotPlan(input).shots, []);
  assert.equal(Finish.shotPlan(input).last, null);
  assert.equal(marks(Finish.html(input)).length, 0);
});

test('rendered results escape archer-controlled text', () => {
  const input = vegas({
    featuredName: '<img src=x onerror="bad()">',
    head: 'Winner <script>bad()</script>',
    title: '<svg onload="bad()">',
    board: [
      { rank: 1, name: 'A & B <script>bad()</script>', total: 294, bonus: 18 },
      { rank: 2, name: 'Maya Chen', total: 291, bonus: 14 }
    ]
  });
  const html = Finish.html(input);
  assert.doesNotMatch(html, /<script>|<img src=x|<svg onload=/);
  assert.match(html, /A &amp; B &lt;script&gt;bad\(\)&lt;\/script&gt;/);
  assert.match(html, /&lt;img src=x onerror=&quot;bad\(\)&quot;&gt;/);
});

test('results preserve a zero score and zero bonus instead of treating them as absent', () => {
  const html = Finish.html(ibo([0], {
    total: 0, bonus: 0, isSolo: true, board: [],
    title: 'Round complete', featuredName: 'Josh Roper'
  }));
  assert.doesNotMatch(html, /undefined|NaN/);
  assert.match(html, /11s/);
  assert.match(html, />0<\/b>/);
  assert.match(html, /See scorecard/);
});

// A narrow browser-boundary double: the real play() owns all phase, timer,
// focus and cleanup decisions. Layout and animation appearance are browser QA.
function browser({ reducedMotion = false } = {}) {
  const events = () => {
    const listeners = new Map();
    return {
      addEventListener(type, fn) {
        if (!listeners.has(type)) listeners.set(type, new Set());
        listeners.get(type).add(fn);
      },
      removeEventListener(type, fn) { listeners.get(type)?.delete(fn); },
      dispatch(type, event = {}) { for (const fn of [...(listeners.get(type) || [])]) fn(event); },
      listenerCount() { return [...listeners.values()].reduce((n, set) => n + set.size, 0); }
    };
  };
  const document = { ...events() };
  const app = { inert: false };
  const focusable = (tagName, parent = null) => ({
    tagName, parent, connected: true, attributes: {},
    get isConnected() { return this.connected && (!parent || !parent.removed); },
    setAttribute(name, value) { this.attributes[name] = value; },
    focus() { document.activeElement = this; }
  });
  const previous = focusable('BUTTON');
  const heading = focusable('H1');
  const dialogs = [];
  document.activeElement = previous;
  document.body = {
    style: { overflow: 'auto' },
    appendChild(node) { dialogs.push(node); }
  };
  document.getElementById = id => id === 'app' ? app : null;
  document.querySelector = () => heading;
  document.createElement = () => {
    const classes = new Set(['fin']);
    const el = {
      ...events(), removed: false,
      classList: { add: (...names) => names.forEach(n => classes.add(n)), contains: n => classes.has(n) },
      remove() {
        this.removed = true;
        if (document.activeElement?.parent === this) document.activeElement = document.body;
      }
    };
    const go = Object.assign(focusable('BUTTON', el), { disabled: true, dataset: { fin: 'go' } });
    const skip = Object.assign(focusable('BUTTON', el), { hidden: false, dataset: { fin: 'skip' } });
    for (const control of [go, skip]) control.closest = () => control;
    const copy = focusable('DIV', el), result = focusable('DIV', el);
    const main = Object.assign(focusable('DIV', el), { tabIndex: -1 });
    const nodes = { '.fin-go': go, '.fin-skip': skip, '.fin-copy': copy, '.fin-result-head': result, '.fin-main': main };
    el.querySelector = selector => nodes[selector] || null;
    el.controls = { go, skip, copy, result, main };
    el.click = control => el.dispatch('click', { target: control || { closest: () => null } });
    return { firstElementChild: el, innerHTML: '' };
  };
  const query = { ...events(), matches: reducedMotion };
  const window = { ...events(), matchMedia: () => query };
  const location = { hash: '#/scorecard/example' };
  let now = 0, nextId = 0;
  const timers = new Map();
  const context = vm.createContext({
    document, window, location, Target: require('../target.js'), module: { exports: {} },
    setTimeout(fn, delay) { const id = ++nextId; timers.set(id, { at: now + delay, fn }); return id; },
    clearTimeout(id) { timers.delete(id); }
  });
  vm.runInContext(readFileSync(join(__dirname, '..', 'finish.js'), 'utf8'), context, { filename: 'finish.js' });
  function advance(to) {
    while (true) {
      const due = [...timers].filter(([, t]) => t.at <= to).sort((a, b) => a[1].at - b[1].at)[0];
      if (!due) break;
      timers.delete(due[0]);
      now = due[1].at;
      due[1].fn();
    }
    now = to;
  }
  return {
    api: context.module.exports, document, window, query, location, dialogs, app, previous, heading,
    advance, pending: () => timers.size,
    key(key, options = {}) { const event = { key, ...options, prevented: false, preventDefault() { this.prevented = true; } }; document.dispatch('keydown', event); return event; },
    motion(matches) { query.matches = matches; query.dispatch('change', { matches }); }
  };
}

test('reduced motion opens usable results directly and restores page state on close', async () => {
  const b = browser({ reducedMotion: true });
  let haptics = 0;
  const done = b.api.play(vegas(), { tap: () => haptics++ });
  const dialog = b.dialogs[0], { go, skip, copy } = dialog.controls;
  assert.equal(dialog.classList.contains('results'), true);
  assert.equal(dialog.classList.contains('settled'), true);
  assert.equal(copy.attributes['aria-hidden'], 'false');
  assert.equal(go.disabled, false);
  assert.equal(skip.hidden, true);
  assert.equal(b.document.activeElement, go);
  assert.equal(b.app.inert, true);
  assert.equal(b.document.body.style.overflow, 'hidden');
  assert.equal(b.pending(), 0);
  assert.equal(haptics, 0);

  dialog.click(go);
  await done;
  assert.equal(dialog.removed, true);
  assert.equal(b.app.inert, false);
  assert.equal(b.document.body.style.overflow, 'auto');
  assert.equal(b.document.activeElement, b.previous);
  assert.equal(b.document.listenerCount() + b.window.listenerCount() + b.query.listenerCount(), 0);
});

test('Skip cancels the remaining reveal and haptic and keeps See scorecard usable', async () => {
  const b = browser();
  let haptics = 0;
  const done = b.api.play(vegas(), { tap: () => haptics++ });
  const dialog = b.dialogs[0];
  assert.equal(b.document.activeElement, dialog.controls.skip);
  assert.equal(dialog.controls.go.disabled, true);
  b.advance(1500);
  dialog.click(dialog.controls.skip);
  assert.equal(dialog.classList.contains('settled'), true);
  assert.equal(dialog.controls.go.disabled, false);
  assert.equal(b.document.activeElement, dialog.controls.go);
  b.advance(5000);
  assert.equal(haptics, 0);
  assert.equal(b.pending(), 0);
  dialog.click(dialog.controls.go);
  await done;
  b.advance(5200);
  assert.equal(dialog.removed, true);
});

test('keyboard focus cycles through the scrollable results region and scorecard action', async () => {
  const input = vegas({ board: Array.from({ length: 8 }, (_, i) => ({
    rank: i + 1, name: `Archer ${i + 1}`, total: 294 - i, bonus: 18 - i
  })) });
  const region = attrs(Finish.html(input).match(/<div\b[^>]*class="fin-main"[^>]*>/)[0]);
  assert.equal(region.role, 'region');
  assert.ok(region['aria-label']);
  assert.equal(region.tabindex, '-1');

  const b = browser();
  const done = b.api.play(input);
  const dialog = b.dialogs[0], { main, go, skip } = dialog.controls;
  assert.equal(main.tabIndex, -1);
  assert.equal(b.key('Tab').prevented, true);
  assert.equal(b.document.activeElement, skip);

  b.advance(1900);
  assert.equal(main.tabIndex, 0);
  assert.equal(b.document.activeElement, go);
  assert.equal(b.key('Tab').prevented, true);
  assert.equal(b.document.activeElement, main);
  assert.equal(b.key('ArrowDown').prevented, false); // Leave scrolling to the browser.
  assert.equal(b.document.activeElement, main);
  b.key('Tab');
  assert.equal(b.document.activeElement, go);
  b.key('Tab', { shiftKey: true });
  assert.equal(b.document.activeElement, main);
  b.key('Tab', { shiftKey: true });
  assert.equal(b.document.activeElement, go);
  dialog.click(go);
  await done;
});

for (const exit of ['Escape', 'Back']) {
  test(`${exit} cancels pending work, releases background controls and removes listeners`, async () => {
    const b = browser();
    let haptics = 0;
    const done = b.api.play(vegas(), { tap: () => haptics++ });
    const dialog = b.dialogs[0];
    b.advance(500);
    if (exit === 'Escape') assert.equal(b.key('Escape').prevented, true);
    else { b.location.hash = '#/'; b.window.dispatch('hashchange'); }
    await done;
    b.advance(5000);
    assert.equal(haptics, 0);
    assert.equal(dialog.removed, true);
    assert.equal(b.app.inert, false);
    assert.equal(b.document.body.style.overflow, 'auto');
    assert.equal(b.pending(), 0);
    assert.equal(b.document.listenerCount() + b.window.listenerCount() + b.query.listenerCount(), 0);
  });
}

test('normal playback reveals actionable results after contact even if haptics fail', async () => {
  const b = browser();
  let haptics = 0;
  const done = b.api.play(vegas(), { tap() { haptics++; throw new Error('Unavailable hardware'); } });
  const dialog = b.dialogs[0];
  b.advance(1800);
  assert.equal(haptics, 1);
  assert.equal(dialog.classList.contains('landed'), true);
  assert.equal(dialog.controls.go.disabled, true);
  b.advance(1900);
  assert.equal(dialog.controls.go.disabled, false);
  assert.equal(dialog.classList.contains('results'), true);
  assert.equal(b.document.activeElement, dialog.controls.go);
  b.advance(2650);
  assert.equal(dialog.classList.contains('settled'), true);
  dialog.click(dialog.controls.go);
  await done;
});

test('enabling reduced motion during playback cancels motion and focuses the results action', async () => {
  const b = browser();
  let haptics = 0;
  const done = b.api.play(vegas(), { tap: () => haptics++ });
  b.advance(800);
  b.motion(true);
  const dialog = b.dialogs[0];
  assert.equal(dialog.classList.contains('settled'), true);
  assert.equal(b.pending(), 0);
  b.advance(5000);
  assert.equal(haptics, 0);
  assert.equal(b.document.activeElement, dialog.controls.go);
  dialog.click(dialog.controls.go);
  await done;
});

test('replacing a celebration resolves the old view without leaking timers or losing the new background lock', async () => {
  const b = browser();
  let oldHaptics = 0;
  const oldDone = b.api.play(vegas(), { tap: () => oldHaptics++ });
  const oldDialog = b.dialogs[0];
  b.advance(1000);
  const newDone = b.api.play(ibo([11, 10]));
  await oldDone;
  const newDialog = b.dialogs[1];
  assert.equal(oldDialog.removed, true);
  assert.equal(b.app.inert, true);
  assert.equal(b.document.body.style.overflow, 'hidden');
  assert.equal(b.pending(), 5);
  newDialog.click(newDialog.controls.skip);
  b.advance(5000);
  assert.equal(oldHaptics, 0);
  b.previous.connected = false;
  newDialog.click(newDialog.controls.go);
  await newDone;
  b.advance(5200);
  assert.equal(b.app.inert, false);
  assert.equal(b.document.body.style.overflow, 'auto');
  assert.equal(b.document.activeElement, b.heading);
  assert.equal(b.heading.attributes.tabindex, '-1');
  assert.equal(b.document.listenerCount() + b.window.listenerCount() + b.query.listenerCount(), 0);
});
