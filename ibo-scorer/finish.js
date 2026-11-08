"use strict";

const Celebration = (() => {
  const DURATION = 3600,
    STRIKE = 1560;
  const ease = (v) => 1 - Math.pow(1 - Math.max(0, Math.min(1, v)), 3);
  const escape = (text) =>
    String(text).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  let instance = null,
    sceneModule = null;
  const preload = () =>
    (sceneModule ||= (
      window.Capacitor?.getPlatform?.() === "android" ||
      /Android/i.test(navigator.userAgent)
        ? import("./finish-canvas.mjs")
        : import("./finish-scene.mjs")
    ).catch(() => null));

  function play(data, { go, impact }) {
    if (instance) return;
    const root = document.createElement("section");
    root.className = "finish-wrap";
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    root.setAttribute("aria-label", "Vegas 300 round complete");
    root.tabIndex = -1;
    root.innerHTML = `<div class="finish-stage">
      <canvas class="finish-scene" aria-hidden="true" hidden></canvas>
      <p class="finish-loading" role="status">Preparing celebration…</p>
      <div class="finish-static" aria-hidden="true" hidden></div>
      <button type="button" class="finish-skip">Skip</button>
      <div class="finish-impact" aria-hidden="true" hidden>Final arrow · ${data.arrows[29].value === 0 ? "Miss" : escape(data.arrows[29].value)}</div>
      <div class="finish-results" hidden>
        <h2>Round complete</h2>
        <p class="finish-archer">${escape(data.name)}</p>
        <div class="finish-total" role="group" aria-label="${data.total} points, ${data.xs} Xs">
          <strong aria-hidden="true">${data.total}</strong><span aria-hidden="true">${data.xs} Xs</span>
        </div>
        <p class="finish-sub">Vegas 300 · 30 arrows</p>
        ${data.illustrative ? '<p class="finish-sub finish-illustrative">Illustrative shot positions</p>' : ""}
        <div class="finish-standings" tabindex="0" role="region" aria-label="Standings">
          <table><thead><tr><th scope="col">Rank</th><th scope="col">Archer</th><th scope="col">Total</th><th scope="col">Xs</th></tr></thead>
          <tbody>${data.standings.map((row) => `<tr${row.id === data.archerId ? ' class="featured"' : ""}><td>${row.rank}</td><th scope="row">${escape(row.name)}</th><td>${row.total}</td><td>${row.xs}</td></tr>`).join("")}</tbody></table>
        </div>
        <button type="button" class="finish-go">See scorecard</button>
      </div>
      <p class="finish-sr" role="status" aria-live="polite"></p>
    </div>`;
    const app = document.getElementById("app"),
      previousFocus = document.activeElement;
    const previous = {
      inert: app.inert,
      aria: app.getAttribute("aria-hidden"),
      overflow: document.body.style.overflow,
    };
    const canvas = root.querySelector("canvas"),
      card = root.querySelector(".finish-results");
    const skip = root.querySelector(".finish-skip"),
      button = root.querySelector(".finish-go");
    const count = root.querySelector(".finish-total strong"),
      pill = root.querySelector(".finish-impact");
    const still = root.querySelector(".finish-static");
    const loading = root.querySelector(".finish-loading");
    const announcement = root.querySelector(".finish-sr");
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let scene = null,
      frame = 0,
      deadline = 0,
      stopped = false,
      sceneReady = false,
      disposed = false,
      hit = false,
      announced = false;
    let lastTime = 0,
      backHandle = null;
    let playbackStarted = null;
    const removeGraphics = () => {
      const old = scene;
      scene = null;
      try {
        old?.dispose();
      } catch (error) {
        console.warn("Graphics cleanup unavailable", error);
      }
    };
    const announce = () => {
      if (announced) return;
      announced = true;
      announcement.textContent = `Round complete. ${data.name}, ${data.total} points, ${data.xs} Xs.`;
    };
    const staticFace = () => {
      canvas.hidden = true;
      if (!still.firstChild)
        still.innerHTML = Target.faceSvg({
          arrows: data.arrows.map((p) => ({
            x: p.x,
            y: p.y,
            color: "#f2621a",
          })),
        });
      still.hidden = false;
    };
    function paint(time) {
      lastTime = time;
      const reveal = time >= DURATION ? 1 : ease((time - 2900) / 350);
      card.hidden = false;
      card.style.visibility = reveal > 0 ? "visible" : "hidden";
      card.inert = reveal === 0;
      card.style.opacity = String(reveal);
      card.style.transform = `translateY(${(1 - reveal) * 24}px)`;
      const from = Math.floor(data.total * 0.88);
      count.textContent = String(
        Math.round(from + (data.total - from) * ease((time - 2900) / 600)),
      );
      button.disabled = time < 3320;
      button.style.opacity = String(ease((time - 3200) / 250));
      skip.hidden = time >= DURATION;
      pill.hidden = time < STRIKE || time >= STRIKE + 600;
      pill.style.opacity = String(
        ease((time - STRIKE) / 100) * (1 - ease((time - STRIKE - 400) / 200)),
      );
      if (scene) {
        const w = root.querySelector(".finish-stage").clientWidth,
          h = root.clientHeight;
        const cardHeight = card.getBoundingClientRect().height;
        scene.draw(time, w, h, Math.max(85, (h - cardHeight - 28) * 0.5));
      }
    }
    function settle(focus = true, fallback = false) {
      if (disposed) return;
      stopped = true;
      loading.hidden = true;
      cancelAnimationFrame(frame);
      clearTimeout(deadline);
      if (fallback || !scene || !sceneReady) {
        removeGraphics();
        staticFace();
      }
      try {
        paint(DURATION);
      } catch {
        removeGraphics();
        staticFace();
        paint(DURATION);
      }
      announce();
      if (focus && !document.hidden) button.focus({ preventScroll: true });
    }
    function dispose(restore = true) {
      if (disposed) return;
      disposed = true;
      cancelAnimationFrame(frame);
      clearTimeout(deadline);
      canvas.removeEventListener("webglcontextlost", contextLost);
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("resize", resize);
      reduced.removeEventListener("change", motionChange);
      backHandle?.remove();
      removeGraphics();
      root.remove();
      app.inert = previous.inert;
      if (previous.aria === null) app.removeAttribute("aria-hidden");
      else app.setAttribute("aria-hidden", previous.aria);
      document.body.style.overflow = previous.overflow;
      if (instance?.root === root) instance = null;
      if (restore && previousFocus?.isConnected)
        previousFocus.focus({ preventScroll: true });
      document.dispatchEvent(new Event("celebrationend"));
    }
    function leave() {
      if (disposed) return;
      dispose(false);
      go("#/card/" + data.roundId);
      requestAnimationFrame(() => {
        const heading = app.querySelector("h1");
        if (heading && location.hash === "#/card/" + data.roundId) {
          heading.tabIndex = -1;
          heading.focus({ preventScroll: true });
        }
      });
    }
    function tick(now) {
      if (disposed || stopped) return;
      if (playbackStarted === null) playbackStarted = now;
      const time = Math.min(DURATION, Math.max(0, now - playbackStarted));
      try {
        paint(time);
        if (!hit && time >= STRIKE) {
          hit = true;
          if (time < STRIKE + 160 && !document.hidden) impact();
        }
        if (time >= DURATION) settle();
        else frame = requestAnimationFrame(tick);
      } catch {
        settle(true, true);
      }
    }
    function contextLost(event) {
      event.preventDefault();
      settle(true, true);
    }
    function visibility() {
      if (document.hidden) settle(false);
      else if (stopped) button.focus({ preventScroll: true });
    }
    function resize() {
      try {
        paint(lastTime);
      } catch {
        settle(true, true);
      }
    }
    function motionChange() {
      if (reduced.matches) settle(true, true);
    }

    instance = { root, dispose };
    document.body.appendChild(root);
    app.inert = true;
    app.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "hidden";
    skip.focus({ preventScroll: true });
    skip.addEventListener("click", () => settle());
    button.addEventListener("click", leave);
    root.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        leave();
      }
      if (event.key !== "Tab") return;
      const controls = [
        ...root.querySelectorAll('button, [tabindex="0"]'),
      ].filter(
        (el) =>
          !el.disabled && el.offsetParent !== null && !el.closest("[inert]"),
      );
      const first = controls[0],
        last = controls[controls.length - 1];
      if (
        event.shiftKey &&
        (document.activeElement === first || document.activeElement === root)
      ) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    });
    canvas.addEventListener("webglcontextlost", contextLost);
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("resize", resize);
    reduced.addEventListener("change", motionChange);
    const nativeApp =
      window.Capacitor?.isNativePlatform?.() && window.Capacitor.Plugins?.App;
    if (nativeApp)
      Promise.resolve(nativeApp.addListener("backButton", leave))
        .then((handle) => {
          if (disposed) handle.remove();
          else backHandle = handle;
        })
        .catch(() => {});
    if (reduced.matches || document.hidden) {
      settle(!document.hidden, true);
      return;
    }
    // Preparation has its own timeout. Driver setup and shader warm-up must
    // not consume the user's 3.6-second sequence, especially on a second round.
    deadline = setTimeout(() => settle(true, true), 8000);
    preload().then(async (module) => {
      if (disposed || stopped) return;
      if (!module) {
        settle(true, true);
        return;
      }
      try {
        scene = module.createScene(canvas, data);
        const stage = root.querySelector(".finish-stage");
        await scene.prepare?.(stage.clientWidth, root.clientHeight, 100);
        if (disposed || stopped) return;
        // Render the opening state while hidden: all expensive first-frame
        // work finishes before either the clock or the visible scene starts.
        paint(0);
        sceneReady = true;
        clearTimeout(deadline);
        loading.hidden = true;
        canvas.hidden = false;
        deadline = setTimeout(() => settle(), 3900);
        frame = requestAnimationFrame(tick);
      } catch (error) {
        if (!disposed && !stopped) {
          console.warn("Celebration preparation failed", error);
          settle(true, true);
        }
      }
    });
  }
  return {
    play,
    preload,
    get active() {
      return instance !== null;
    },
    dispose() {
      instance?.dispose();
    },
  };
})();
