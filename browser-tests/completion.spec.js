const { test, expect } = require("@playwright/test");

const key = "ibo-scorer-v1";
function fixture({
  type = "vegas",
  status = "in_progress",
  archers = 1,
  blanks = false,
  plots = false,
} = {}) {
  const people = Array.from({ length: archers }, (_, i) => ({
    id: "a" + i,
    name: i ? "Archer " + i : "Josh",
    createdAt: 1,
  }));
  const round = {
    id: "round-one",
    createdAt: 1,
    note: "",
    type,
    targets: type === "vegas" ? 10 : 3,
    current: type === "vegas" ? 9 : 2,
    status,
    archerIds: people.map((p) => p.id),
    scores: {},
  };
  if (status === "finished") round.finishedAt = 123456;
  for (const p of people)
    round.scores[p.id] =
      type === "vegas"
        ? Array.from({ length: 10 }, () => [10, 9, "X"])
        : [11, 10, 0];
  if (blanks) round.scores.a0[9][2] = null;
  if (plots) {
    round.plots = {
      a0: Array.from({ length: 10 }, () => [
        { x: 1.9, y: 0 },
        null,
        { x: 0, y: -1.3 },
      ]),
    };
    round.plots.a0[9][2] = { x: 10.8, y: 0 };
    round.scores.a0[9][2] = 0;
  }
  return { archers: people, rounds: [round] };
}
async function open(
  page,
  db = fixture(),
  { renderer = "stub", reducedMotion = "no-preference" } = {},
) {
  await page.emulateMedia({ reducedMotion });
  await page.clock.install();
  await page.clock.pauseAt(new Date());
  if (renderer === "stub")
    await page.route("**/finish-scene.mjs", (route) =>
      route.fulfill({
        contentType: "text/javascript",
        body: `export function createScene(canvas,data){window.sceneInput=structuredClone(data);return {draw(){},dispose(){window.sceneDisposals=(window.sceneDisposals||0)+1;}};}`,
      }),
    );
  if (renderer === "missing")
    await page.route("**/finish-scene.mjs", (route) => route.abort());
  await page.addInitScript(
    ({ key, db }) => {
      if (!localStorage.getItem(key))
        localStorage.setItem(key, JSON.stringify(db));
    },
    { key, db },
  );
  await page.goto("/#/round/round-one");
  await page.evaluate(() => {
    window.feedback = [];
    Native.haptic.success = () => feedback.push("success");
    Native.haptic.place = () => feedback.push("impact");
  });
}
async function finish(page, name = "Finish") {
  await page.getByRole("button", { name: "Finish round", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name, exact: true })
    .click();
}
const celebration = (page) =>
  page.getByRole("dialog", { name: "Vegas 300 round complete" });
const saved = (page) =>
  page.evaluate((key) => JSON.parse(localStorage.getItem(key)), key);

test("saves before presenting, settles to exact results, and opens the real scorecard", async ({
  page,
}) => {
  await open(page);
  await finish(page);
  await expect(celebration(page)).toBeVisible();
  expect((await saved(page)).rounds[0].status).toBe("finished");
  await expect(
    page.getByRole("button", { name: "Skip", exact: true }),
  ).toBeFocused();
  await expect.poll(() => page.evaluate(() => !!window.sceneInput)).toBe(true);
  await page.clock.runFor(3650);
  await expect(celebration(page).getByLabel("290 points, 10 Xs")).toBeVisible();
  await expect(
    celebration(page).getByRole("button", { name: "See scorecard" }),
  ).toBeFocused();
  expect(await page.evaluate(() => feedback)).toEqual(["success", "impact"]);
  await page.getByRole("button", { name: "See scorecard" }).click();
  await expect(page).toHaveURL(/#\/card\/round-one$/);
  await expect(
    page.getByRole("heading", { name: "Scorecard", exact: true }),
  ).toBeVisible();
  await expect(celebration(page)).toHaveCount(0);
  expect(await page.evaluate(() => window.sceneDisposals)).toBe(1);
});

test("skip is immediate, contains focus, and suppresses the delayed impact", async ({
  page,
}) => {
  await open(page);
  await finish(page);
  await page.getByRole("button", { name: "Skip", exact: true }).click();
  const go = page.getByRole("button", { name: "See scorecard" });
  await expect(go).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    celebration(page).getByRole("region", { name: "Standings" }),
  ).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(go).toBeFocused();
  await page.clock.runFor(5000);
  expect(await page.evaluate(() => feedback)).toEqual(["success"]);
  await page.keyboard.press("Escape");
  await expect(page).toHaveURL(/#\/card\/round-one$/);
  expect(await page.locator("#app").evaluate((el) => el.inert)).toBe(false);
});

test("cancelling leaves status, blanks, and timestamps untouched", async ({
  page,
}) => {
  const db = fixture({ blanks: true });
  await open(page, db);
  await page.getByRole("button", { name: "Finish round", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Some arrows are blank");
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  expect(await saved(page)).toEqual(db);
  await expect(celebration(page)).toHaveCount(0);
});

test("accepted blanks remain misses, including the thirtieth arrow", async ({
  page,
}) => {
  await open(page, fixture({ blanks: true }));
  await finish(page, "Finish anyway");
  await expect.poll(() => page.evaluate(() => !!window.sceneInput)).toBe(true);
  const data = await page.evaluate(() => sceneInput);
  expect(data.arrows).toHaveLength(30);
  expect(data.arrows[29].value).toBe(0);
  expect(Math.hypot(data.arrows[29].x, data.arrows[29].y)).toBeGreaterThan(
    10.4,
  );
  expect((await saved(page)).rounds[0].scores.a0[9][2]).toBe(0);
  await page.getByRole("button", { name: "Skip", exact: true }).click();
  await expect(celebration(page).getByLabel("280 points, 9 Xs")).toBeVisible();
});

test("storage failure preserves editable input and permits a successful retry", async ({
  page,
}) => {
  const db = fixture({ blanks: true });
  await open(page, db);
  await page.evaluate(() => {
    window.originalWrite = Storage.prototype.setItem;
    Storage.prototype.setItem = () => {
      throw new DOMException("full", "QuotaExceededError");
    };
  });
  page.once("dialog", (dialog) => dialog.accept());
  await finish(page, "Finish anyway");
  await expect(celebration(page)).toHaveCount(0);
  expect(await saved(page)).toEqual(db);
  expect(await page.evaluate(() => feedback)).toEqual([]);
  await page.evaluate(() => {
    Storage.prototype.setItem = window.originalWrite;
  });
  await finish(page, "Finish anyway");
  await expect(celebration(page)).toBeVisible();
  expect((await saved(page)).rounds[0].status).toBe("finished");
});

test("already finished rounds retain their timestamp without replay", async ({
  page,
}) => {
  await open(page, fixture({ status: "finished" }));
  await page
    .getByRole("button", { name: "Done editing", exact: true })
    .first()
    .click();
  await expect(page).toHaveURL(/#\/card\/round-one$/);
  await expect(celebration(page)).toHaveCount(0);
  expect((await saved(page)).rounds[0].finishedAt).toBe(123456);
});

test("IBO finishes through the existing scorecard flow", async ({ page }) => {
  await open(page, fixture({ type: "ibo" }));
  await finish(page);
  await expect(page).toHaveURL(/#\/card\/round-one$/);
  await expect(celebration(page)).toHaveCount(0);
  expect((await saved(page)).rounds[0].scores.a0).toEqual([11, 10, 0]);
});

test("duplicate requests create one confirmation and one presentation", async ({
  page,
}) => {
  await open(page);
  await page
    .locator('[data-action="finish"]')
    .first()
    .evaluate((el) => {
      el.click();
      el.click();
    });
  await expect(page.getByRole("dialog")).toHaveCount(1);
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Finish", exact: true })
    .click();
  await page.evaluate(() => actions.finish());
  await expect(celebration(page)).toHaveCount(1);
  expect(await page.evaluate(() => feedback)).toEqual(["success"]);
});

test("navigation during confirmation cancels completion and does not block a later attempt", async ({
  page,
}) => {
  await open(page);
  await page.getByRole("button", { name: "Finish round", exact: true }).click();
  await page.evaluate(() => {
    location.hash = "#/history";
  });
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect((await saved(page)).rounds[0].status).toBe("in_progress");
  await page.goto("/#/round/round-one");
  await finish(page);
  await expect(celebration(page)).toBeVisible();
});

test("mixed positions, selected archer, misses, and tied ranks match saved data", async ({
  page,
}) => {
  const db = fixture({ archers: 3, plots: true });
  db.rounds[0].plotAid = "a0";
  db.rounds[0].plots.a0[0][0] = { x: 2.3, y: 0 }; // recorded line cutter
  db.rounds[0].plots.a0[1][0] = { x: "invalid", y: 0 };
  db.rounds[0].scores.a1 = structuredClone(db.rounds[0].scores.a0);
  await open(page, db);
  await finish(page);
  await expect.poll(() => page.evaluate(() => !!window.sceneInput)).toBe(true);
  const data = await page.evaluate(() => sceneInput);
  expect(data.arrows[0]).toEqual({
    value: 10,
    x: 2.3,
    y: 0,
    illustrative: false,
  });
  expect(data.arrows[29]).toEqual({
    value: 0,
    x: 10.8,
    y: 0,
    illustrative: false,
  });
  expect(data.arrows[3].illustrative).toBe(true);
  expect(data.standings.map((row) => row.rank)).toEqual([1, 2, 2]);
  await page.getByRole("button", { name: "Skip", exact: true }).click();
  await expect(celebration(page)).toContainText("Illustrative shot positions");
  const stored = (await saved(page)).rounds[0];
  expect(stored.plots).toEqual(db.rounds[0].plots);
  expect(stored.scores).toEqual(db.rounds[0].scores);
  expect(data.name).toBe("Josh");
});

test("reduced motion shows static accurate results without starting 3D", async ({
  page,
}) => {
  await open(page, fixture(), { reducedMotion: "reduce" });
  await finish(page);
  await expect(celebration(page).getByLabel("290 points, 10 Xs")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "See scorecard" }),
  ).toBeFocused();
  expect(await page.evaluate(() => window.sceneInput)).toBeUndefined();
  await page.clock.runFor(4000);
  expect(await page.evaluate(() => feedback)).toEqual(["success"]);
});

test("renderer load failure leaves usable saved results", async ({ page }) => {
  await open(page, fixture(), { renderer: "missing" });
  await finish(page);
  await expect(
    page.getByRole("button", { name: "See scorecard" }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "See scorecard" }).click();
  await expect(page).toHaveURL(/#\/card\/round-one$/);
});

test("context loss disposes the renderer and cannot trap the user", async ({
  page,
}) => {
  await open(page);
  await finish(page);
  await expect.poll(() => page.evaluate(() => !!window.sceneInput)).toBe(true);
  await page.locator(".finish-scene").dispatchEvent("webglcontextlost");
  await expect(
    page.getByRole("button", { name: "See scorecard" }),
  ).toBeFocused();
  expect(await page.evaluate(() => window.sceneDisposals)).toBe(1);
  await page.clock.runFor(4000);
  expect(await page.evaluate(() => feedback)).toEqual(["success"]);
});

test("hidden app settles without restarting or sending a delayed impact", async ({
  page,
}) => {
  await open(page);
  await finish(page);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.clock.runFor(5000);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: false,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(
    page.getByRole("button", { name: "See scorecard" }),
  ).toBeFocused();
  expect(await page.evaluate(() => feedback)).toEqual(["success"]);
});

test("route navigation disposes the scene and never redirects later", async ({
  page,
}) => {
  await open(page);
  await finish(page);
  await expect.poll(() => page.evaluate(() => !!window.sceneInput)).toBe(true);
  await page.evaluate(() => {
    location.hash = "#/history";
  });
  await expect(celebration(page)).toHaveCount(0);
  await page.clock.runFor(5000);
  await expect(page).toHaveURL(/#\/history$/);
  expect(await page.evaluate(() => window.sceneDisposals)).toBe(1);
  expect(await page.locator("#app").evaluate((el) => el.inert)).toBe(false);
});

test("native Back dismisses into the completed scorecard", async ({ page }) => {
  await open(page);
  await page.evaluate(() => {
    window.Capacitor = {
      isNativePlatform: () => true,
      Plugins: {
        App: {
          addListener: (_, fn) => {
            window.nativeBack = fn;
            return Promise.resolve({
              remove() {
                window.nativeBack = null;
              },
            });
          },
        },
      },
    };
  });
  await finish(page);
  await expect.poll(() => page.evaluate(() => !!window.nativeBack)).toBe(true);
  await page.evaluate(() => window.nativeBack());
  await expect(page).toHaveURL(/#\/card\/round-one$/);
  expect(await page.evaluate(() => window.nativeBack)).toBeNull();
});

test("small screens, enlarged text, and long standings keep the action reachable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 568 });
  const db = fixture({ archers: 24 });
  db.archers[0].name = "<Josh> & a very long archer name that must wrap safely";
  await open(page, db, { reducedMotion: "reduce" });
  await page.addStyleTag({ content: 'html { font-size: 24px; }' });
  await finish(page);
  const button = page.getByRole("button", { name: "See scorecard" });
  await expect(button).toBeInViewport();
  await expect(celebration(page).getByRole("row")).toHaveCount(25);
  const box = await button.boundingBox();
  expect(box.height).toBeGreaterThanOrEqual(48);
  expect(await celebration(page).locator('.finish-archer').evaluate(el => parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThan(20);
  const overflow = await page
    .locator(".finish-stage")
    .evaluate((el) => el.scrollWidth > el.clientWidth);
  expect(overflow).toBe(false);
  await button.click();
  await expect(page).toHaveURL(/#\/card\/round-one$/);
});

test("real locally bundled 3D renderer starts and completes without external requests", async ({
  page,
}) => {
  const errors = [],
    external = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    if (!request.url().startsWith("http://127.0.0.1:4173/"))
      external.push(request.url());
  });
  await open(page, fixture({ plots: true }), { renderer: "real" });
  await finish(page);
  await page.clock.runFor(32);
  await expect
    .poll(() => page.locator(".finish-scene").getAttribute("width"))
    .not.toBe("300");
  await expect(page.locator(".finish-static")).toBeHidden();
  await page.clock.fastForward(4000);
  await expect(celebration(page).getByLabel("280 points, 9 Xs")).toBeVisible();
  expect(errors).toEqual([]);
  expect(external).toEqual([]);
});

test("all recorded positions stay exact and the selected archer is featured", async ({
  page,
}) => {
  const db = fixture({ archers: 2 });
  const r = db.rounds[0];
  r.plotAid = "a1";
  r.plots = {
    a1: Array.from({ length: 10 }, () => [
      { x: 1.9, y: 0 },
      { x: -3, y: 0 },
      { x: 0, y: -1.3 },
    ]),
  };
  await open(page, db);
  await finish(page);
  await expect.poll(() => page.evaluate(() => !!window.sceneInput)).toBe(true);
  const data = await page.evaluate(() => sceneInput);
  expect(data.archerId).toBe("a1");
  expect(data.arrows.map((p) => ({ x: p.x, y: p.y }))).toEqual(
    r.plots.a1.flat(),
  );
  await page.getByRole("button", { name: "Skip", exact: true }).click();
  await expect(celebration(page).locator(".finish-archer")).toHaveText(
    "Archer 1",
  );
  await expect(celebration(page)).not.toContainText(
    "Illustrative shot positions",
  );
});

test("illustrative positions respect every stored score and do not alter plots", async ({
  page,
}) => {
  const db = fixture();
  const values = ["X", 10, 9, 8, 7, 6, 0];
  const scores = Array.from(
    { length: 30 },
    (_, i) => values[i % values.length],
  );
  db.rounds[0].scores.a0 = Array.from({ length: 10 }, (_, i) =>
    scores.slice(i * 3, i * 3 + 3),
  );
  await open(page, db);
  await finish(page);
  await expect.poll(() => page.evaluate(() => !!window.sceneInput)).toBe(true);
  const presented = await page.evaluate(() =>
    sceneInput.arrows.map((p) => {
      const hit = Target.scoreAt(p.x, p.y);
      return hit.x ? "X" : hit.score;
    }),
  );
  expect(presented).toEqual(scores);
  expect((await saved(page)).rounds[0].plots).toBeUndefined();
});

test("two different completions release their scenes independently", async ({
  page,
}) => {
  const db = fixture();
  db.rounds.push({ ...structuredClone(db.rounds[0]), id: "round-two" });
  await open(page, db);
  await finish(page);
  await expect.poll(() => page.evaluate(() => !!window.sceneInput)).toBe(true);
  await page.getByRole("button", { name: "Skip", exact: true }).click();
  await page.getByRole("button", { name: "See scorecard" }).click();
  await expect(page).toHaveURL(/#\/card\/round-one$/);
  await page.goto("/#/round/round-two");
  await finish(page);
  await expect
    .poll(() => page.evaluate(() => window.sceneInput?.roundId))
    .toBe("round-two");
  await page.getByRole("button", { name: "Skip", exact: true }).click();
  await page.getByRole("button", { name: "See scorecard" }).click();
  await expect(page).toHaveURL(/#\/card\/round-two$/);
  expect((await saved(page)).rounds.map((r) => r.status)).toEqual([
    "finished",
    "finished",
  ]);
});

test("changing reduced-motion preference settles playback immediately", async ({
  page,
}) => {
  await open(page);
  await finish(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(
    page.getByRole("button", { name: "See scorecard" }),
  ).toBeFocused();
  await page.clock.runFor(4000);
  expect(await page.evaluate(() => feedback)).toEqual(["success"]);
});

test.describe("offline web app", () => {
  test.use({ serviceWorkers: "allow" });
  test("precaches the celebration and completes after an offline reload", async ({
    page,
    context,
  }) => {
    await open(page, fixture(), { reducedMotion: "reduce", renderer: "real" });
    await page.evaluate(() => navigator.serviceWorker.ready);
    await page.reload();
    await expect
      .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
      .toBe(true);
    await context.setOffline(true);
    await page.reload();
    await finish(page);
    await expect(
      celebration(page).getByLabel("290 points, 10 Xs"),
    ).toBeVisible();
    await page.getByRole("button", { name: "See scorecard" }).click();
    await expect(page).toHaveURL(/#\/card\/round-one$/);
    expect((await saved(page)).rounds[0].status).toBe("finished");
  });
});
