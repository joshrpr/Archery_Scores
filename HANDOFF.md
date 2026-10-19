# Handoff: robustness fixes for Ropers Archery Scorecard

You are picking up five fixes found in a code review. Each one is self-contained;
do them in the order below, one commit each, and run the test suite between them.
B1–B4 are live bugs; B5 is a latent one you may drop if you run short on time.
Nothing here needs the Android toolchain.

## Project orientation

- `ibo-scorer/` is the whole app: vanilla ES2019 in classic `<script>` files, no
  bundler, no framework, no runtime dependencies. HTML is built as strings and
  assigned to `#app`.
- `target.js`, `stats.js` and `import.js` are UMD-ish modules —
  `const X = (() => {...})(); if (typeof module !== 'undefined') module.exports = X;`
  — which is why they can be tested under Node. `plot.js`, `groups.js` and
  `native.js` touch the DOM and export nothing; follow the `target.js` shape for any
  new module.
- `ibo-scorer/app.js` (1246 lines) is the untested core. **It touches `document`
  at top level and cannot be `require`d from Node.**
- `ibo-scorer/index.html` loads `native, target, plot, groups, stats, import, app`
  in that order (app last).
- `ibo-scorer/sw.js` has a hand-maintained `ASSETS` array. **Any new file loaded
  by `index.html` must be added there**, or the web app breaks offline.
- `scripts/build-web.mjs` copies all of `ibo-scorer/` into `www/` for Capacitor and
  skips only `tests`, `README.md`, `sw.js`, so new app files are copied
  automatically.
- Tests: `npm test` → `node --test ibo-scorer/tests/*.test.js`. It currently passes
  (25 tests) with **no install required** — `node_modules` is only for Capacitor.

Read `ibo-scorer/README.md` before you start; it documents the data model and the
"modules with no DOM are unit-tested" convention.

## Ground rules

- Keep round objects and the localStorage key (`ibo-scorer-v1`) backwards
  compatible. `BACKUP_FORMAT` stays at `1`; do not bump it.
- Do not refactor `isVegas`/round types, storage layout, CI, or Gradle signing.
  Those are out of scope even where tempting.
- Do not add dependencies (no jsdom, no test framework).
- Match the existing style: `const`/arrow functions, template literals, two-space
  indent, comments that explain *why*.
- Never weaken an existing test to make new code pass.
- Check syntax after editing: `node --check ibo-scorer/app.js` (and each other file
  you touch).

```bash
npm test          # must stay green
node --check ibo-scorer/app.js
```

---

## B1. Escape the SVG `aria-label` (stored XSS, do this first)

**Effort:** ~10 lines + one test.

**Where:** `ibo-scorer/target.js:123`, in `faceSvg()`:

```js
role="img" aria-label="${ariaLabel}">
```

**Why:** `ariaLabel` is interpolated raw. `app.js:604` builds it from an archer
name (`Target face for ${nameOf(aid)}, end ${t + 1}`), names allow `"`, and the
resulting string is assigned with `innerHTML` (`app.js:208`). A name like

```
Bob " onload="alert(1)
```

produces `<svg ... aria-label="Target face for Bob " onload="alert(1)">`, i.e. an
event handler on the SVG. Verified by generating the string; the browser firing of
`onload` was not exercised in the review environment, so treat the breakout itself
as the bug (it is also an accessibility defect — screen readers read the mangled
label).

The realistic entry point is a shared backup file: restore it and the name lands in
the DB, then opening any plotted round inserts the SVG.

**Required behaviour**

1. Escape `ariaLabel` inside `faceSvg` (defence in depth — do not rely on call
   sites). Add a local helper near `fmtCm`:
   ```js
   const escAttr = s => String(s).replace(/[&<>"']/g, c =>
     ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
   ```
   and use `${escAttr(ariaLabel)}`.
2. All other interpolated values in that function (`RINGS`, colours, numeric
   coordinates, `a.cls`, `a.color`) are internal — leave them alone.

**Test** (add to `ibo-scorer/tests/target.test.js`):

```js
test('face svg escapes its aria label', () => {
  const svg = T.faceSvg({ ariaLabel: 'Bob " onload="alert(1) <b>' });
  assert.ok(svg.includes('aria-label="Bob &quot; onload=&quot;alert(1) &lt;b&gt;"'));
  assert.ok(!svg.includes('" onload="'));          // the attribute breakout is gone
  assert.match(T.faceSvg({}), /aria-label="Target face"/);   // unchanged when benign
});
```

(Note: escaped output still contains the characters `onload=`, just no longer as a
live attribute — assert on the quoting, not on the word.)

**Done when:** test passes, suite green, and `faceSvg` output for normal labels is
byte-identical apart from the escaping (check `aria-label="Target face"`).

---

## B2. Validate round shapes in backups (crash after restore)

**Effort:** the largest of the five — one new module, ~120 lines, a new test file.

**Where:** `parseBackup` at `ibo-scorer/app.js:861`. Today it checks ids, that
`archerIds` is a string array, and that `scores[id]` is an array — nothing about
lengths, element types, or values.

**Why:** `slotDone` (`app.js:68`) does `r.scores[aid][i].every(...)` for Vegas and
`lastOpen`/`gapsOf` walk `0..targets-1`. A backup with `targets: 20` but only 10
recorded ends therefore throws `TypeError: Cannot read properties of undefined
(reading 'every')` inside `viewRound` during `render()`, leaving a blank screen. The
round is listed on the home screen under "Pick up where you left off", so the user
is stuck on a page that cannot render. The validator is the only gate.

**Required behaviour** — a restore must either produce a fully renderable DB or a
readable error naming the round, e.g. `Round 3 is damaged (it has 10 ends recorded
for a 20-end round).` Nothing may be written when validation fails (that already
holds: `importBackup` replaces `db` only after `parseBackup` returns).

**Make it testable.** Move the whole validator into a new
`ibo-scorer/backup.js` following the existing module pattern:

```js
const Backup = (() => {
  const APP = 'ropers-archery-scorecard', FORMAT = 1;
  function parse(obj, values) { /* values = { ibo: [...], vegas: [...] } */ }
  return { APP, FORMAT, parse };
})();
if (typeof module !== 'undefined') module.exports = Backup;
```

Then:

- `ibo-scorer/index.html`: add `<script src="backup.js"></script>` **before**
  `app.js` (after `import.js`).
- `ibo-scorer/sw.js`: add `'./backup.js'` to `ASSETS`.
- `ibo-scorer/app.js`: drop the old `parseBackup`/`BACKUP_APP`/`BACKUP_FORMAT` and
  call `Backup.parse(JSON.parse(text), { ibo: VALUES, vegas: VEGAS_VALUES })` at
  `app.js:921`. Keep `backupText()` in `app.js` but read `Backup.APP` /
  `Backup.FORMAT`.
- `ibo-scorer/README.md`: add `backup.js` wherever it describes the modules.

**Validation rules** (all errors: `Error` with a human sentence; keep the existing
messages for duplicate archers/ids and for `format > FORMAT`):

- Top level: existing checks unchanged (object, `app`, format, `archers`/`rounds`
  arrays). Accept a bare `{archers, rounds}` object as today.
- Archer ids: unique, non-empty strings (existing behaviour).
- Round: unique `id`; `archerIds` non-empty array of unique strings, **each present
  in `d.archers`** (the app only soft-deletes archers — `deleted: true` — so a
  real backup never has dangling ids); `createdAt` a finite number; `status` either
  `'in_progress'`, `'finished'`, or absent (absent renders as in progress — leave
  it absent rather than inventing a value); `type` either `'vegas'`, `'ibo'`, or
  absent (absent means IBO — old rounds predate `type`; fill it in as `'ibo'` in
  place, same as `migrate`).
- `targets`: integer `>= 1`. Do not cap the upper end — `add-target` lets a round
grow freely, so a legitimate long round must not be rejected; the length check
below is what protects the renderer.
- Per archer: `scores[aid]` is an array whose length **equals `targets`**.
  - IBO: every entry is `null` or one of `values.ibo`.
  - Vegas: every entry is an array of length 3 whose items are `null` or one of
    `values.vegas`.
- `current` (if present): integer in `0 .. targets - 1`. If absent, leave it. An
  out-of-range value must be **rejected, not clamped**: it means the file is
  internally inconsistent, and clamping would quietly move the user's scoring
  position.
- `plots` (if present): object; for each key that also exists in `scores`, an array
  of the same length whose entries are `null`/arrays matching the scores shape, and
  each non-null item an object with finite numeric `x` and `y`. Ignore unknown keys.
  Do not range-check against the face — old data may legitimately sit near the edge.
- `note` (if present): string. `source` (if present): object.

Do **not** reject unknown extra fields — `parseBackup` deliberately round-trips
newer round data.

**Tests** — new `ibo-scorer/tests/backup.test.js` (it will be picked up by the
existing glob). Cover:

1. A well-formed DB (`{archers:[{id:'a1',name:'Ann',deleted:false}], rounds:[…]}`
   with one finished IBO and one in-progress Vegas round) parses and is returned
   with `type` filled in for a round that omitted it.
2. `targets: 20` with 10 recorded ends → throws `/Round 1 is damaged/` and the
   message mentions the counts.
3. Vegas end of 2 arrows → throws; Vegas end containing `'Q'` → throws; IBO entry
   `9` → throws.
4. `scores` shorter than `targets` for one of two archers → throws.
5. `current: 25` with `targets: 20` → throws.
6. Round referencing an archer id not in `archers` → throws.
7. `format: 2` still gives the "newer version of the app" message; duplicate
   archer ids still rejected (regression for the old behaviour).
8. `plots` with `{x: NaN}` → throws; `plots` with an extra key not in `scores` is
   ignored.

**Acceptance (manual):** serve `python3 -m http.server 8000 --directory ibo-scorer`,
open `http://localhost:8000`, craft a backup JSON with a 20-target Vegas round with
10 ends, use Backup → Restore, and confirm a readable dialog appears and the
existing DB is untouched. Before the fix this same file restores silently and the
round page goes blank.

---

## B3. Settle modal promises when the dialog is removed

**Where:** `ibo-scorer/app.js:180-185` removes every `.modal-wrap` on `hashchange`
(phone back button) but `modal()` (`app.js:124`) only resolves inside its own
`finish()`. So the awaiting caller never continues.

**Why it matters:** `confirmBox`/`promptBox`/`alertBox` are awaited by `finish`,
`delete-round`, `remove-target`, `rename-archer`, `edit-note`, `importBackup` and
others. Dismissing by back leaves a suspended promise and a leaked async frame;
any state written after the `await` silently never happens. This is not a hard
freeze (the UI still responds), so describe it as "the guarded action never
resolves" rather than "the app hangs" in the commit message.

**Required behaviour**

1. Keep a single settle function per dialog that (a) removes the node and (b)
   resolves exactly once. Guard against double-resolve (`finish` after removal).
2. On `hashchange`, before removing dialogs, resolve each **as Cancel**:
   `{ value: false, text: null }` — the same shape a Cancel button produces, so
   every caller's existing `if (!ok) return;` works.
3. Escape closes the top-most dialog as Cancel. Ignore Escape when no dialog is
   open. (Nice-to-have, small: click on the backdrop outside `.modal` also cancels;
   skip if it risks a mis-tap.)
4. Do not change `alertBox` callers to care about the result — they ignore it.

Implementation sketch — expose the resolver on the node instead of adding a
registry:

```js
function modal({ ... }) {
  return new Promise(resolve => {
    const wrap = document.createElement('div');
    ...
    let done = false;
    const finish = btn => {
      if (done) return;
      done = true;
      wrap.remove();
      resolve({ value: btn.value, text: inp ? inp.value : null });
    };
    wrap.__cancel = () => { if (done) return; done = true; wrap.remove(); resolve({ value: false, text: null }); };
    ...
  });
}
```

and in `hashchange`:

```js
document.querySelectorAll('.modal-wrap').forEach(m => {
  if (m.__cancel) m.__cancel(); else m.remove();
});
```

**Verify by hand** (no test — there is no DOM in the test environment):

- Vegas round → Finish with a blank arrow → dialog → press browser back (or set
  `location.hash = '#/'` in the console) → dialog disappears, and pressing Finish
  again produces a working dialog (no duplicate/hung dialog).
- Same for Backup → Restore and Archers → Rename.
- Escape cancels; Cancel button still returns `false`; OK still returns `true`.

---

## B4. Restore focus after re-render (keyboard scoring)

**Where:** `render()` at `ibo-scorer/app.js:192` assigns `app.innerHTML = html`,
which destroys the focused button. Every `data-action="score"` / `"vscore"` /
`"vclear"` tap therefore drops focus to `<body>`.

**Repro:** desktop browser, keyboard only. Tab to a score button in a round, press
Enter — the score registers and focus is gone; you cannot score a second arrow
without re-tabbing from the top.

**Required behaviour**

1. Before replacing the markup, capture `document.activeElement` if it is inside
   `#app` and has a stable identity: `{ action, aid, v, k, to, t, i }` from its
   `dataset`, plus its `id`/tag. After render, re-focus the first element matching
   the same `data-action` + the same distinguishing dataset keys, with
   `{ preventScroll: true }`.
2. **Only when something was focused** (not `body`/`documentElement`) — do not
   steal focus on ordinary pointer-driven navigation.
3. Fallbacks, in order: the same button; the next `[data-action="score"]` with the
   same `data-aid`; the Next button (`[data-action="move"][data-d="1"]`) when the
   end/target is complete and that button is enabled; `#app h1` when the route
   changed.
4. On a route change, put focus on the new screen's `h1` (give it `tabindex="-1"`
   in `header()`/home) so screen readers announce the new page. Do not move focus
   when the dialog is open (B3 covers focus inside modals; leave `modal()`'s
   `inp.focus()` alone).
5. Keep the existing `scrollIntoView` behaviour for `.chip.cur`.

Do not restructure the render pipeline for this — a capture/restore pair around
`app.innerHTML = html` is enough.

**Verify by hand:** Tab to "10", press Enter twice, Enter again — the same button
keeps focus and all three clicks register. Vegas: after the third arrow the buttons
disable; focus should land on Next. Navigate with Enter on a nav button → focus is
on the new heading. Mouse/touch flows must not jump unexpectedly (click a score,
then check `document.activeElement` is the clicked button, not a heading).

---

## B5. Make `Target.toCm` honour the actual viewBox (latent)

**Where:** `ibo-scorer/target.js:135-141` hardcodes `VIEW_R`:

```js
const s = (VIEW_R * 2) / b.width;
x: ((clientX - b.left) * s - VIEW_R)
```

`faceSvg({view})` can render any half-width, and `fit()` returns 4–11. Today only
`plot.js` calls `toCm` and the plot panel uses the default view, so this is latent,
not a live bug — but it is a trap for the next feature and is cheap to fix in a
tested module.

**Required behaviour:** derive the viewBox from the element
(`svg.viewBox && svg.viewBox.baseVal`, falling back to parsing
`svg.getAttribute('viewBox')`, then to `VIEW_R`), and map using both extents so a
non-square element still maps correctly:

```
vb = {x, y, width, height}
x_cm = vb.x + (clientX - b.left)  * vb.width  / b.width
y_cm = vb.y + (clientY - b.top)   * vb.height / b.height
```

Keep the existing 2-decimal rounding and the `(svg, clientX, clientY)` signature.
Return `{x: 0, y: 0}`-ish safely when `b.width/height` is 0 (don't divide by zero).

**Test** (in `target.test.js`) with a fake element — no DOM needed:

```js
const fake = (w, h, vb) => ({ getBoundingClientRect: () => ({ left: 0, top: 0, width: w, height: h }),
                              getAttribute: n => (n === 'viewBox' ? vb : null) });
assert.deepStrictEqual(T.toCm(fake(220, 220, '-11 -11 22 22'), 110, 110), { x: 0, y: 0 });
assert.deepStrictEqual(T.toCm(fake(200, 200, '-4 -4 8 8'), 50, 150), { x: -2, y: 2 });
assert.deepStrictEqual(T.toCm(fake(220, 220, null), 110, 110), { x: 0, y: 0 }); // fallback
```

Also assert a 4 cm zoomed face maps a corner tap to roughly `±4`, which is the case
that is wrong today (it currently maps to `±11`).

---

## Finish checklist

```bash
npm test                 # all tests pass, including the new ones
node --check ibo-scorer/app.js
node --check ibo-scorer/target.js
node --check ibo-scorer/backup.js
```

- `ibo-scorer/index.html` and `ibo-scorer/sw.js` both list `backup.js`; script order
  is `… import.js, backup.js, app.js`.
- No new dependencies, no changes to `package-lock.json`.
- One commit per fix, in the order B1 → B5; skip B5 only if you are short on time,
  and say so. Run `npm test` before you start and confirm the baseline (25 passing,
  0 failing).
- Do not commit `www/` or anything generated by `npm run web`.
- Report anything you could not verify (browser-only behaviour: B3 and B4) as
  unverified rather than done.

## Not in scope (mentioned so you don't "fix" them)

- `plot.js`'s `cmPerPx` recomputation is correct; it matches `toCm`'s scale.
- `save()` writes the whole DB on every tap. At 600 rounds with plots that is
  ~1.85 MB and ~26 ms of `JSON.stringify` per save. Real, but a storage redesign —
  do not touch it here.
- `migrate()` only fills `type`; B2's validator takes over shape checking, but
  leave `migrate()` in place and callable.
- The committed Android signing key and the APK-per-PR workflow are deliberate.
