'use strict';

/* =========================================================
   The few things that work differently inside the Android app
   (Capacitor) than in a browser: haptics, keeping the screen on,
   saving files, and checking for a newer APK. In a browser every
   call falls back to the web way of doing it, so the same files
   run as the installed web app and as the Android app.
   ========================================================= */

const Native = (() => {
  const cap = window.Capacitor;
  const isApp = !!(cap && cap.isNativePlatform && cap.isNativePlatform());
  const P = isApp ? cap.Plugins : {};

  // Plugin calls return promises; a haptic or a missing plugin must never break scoring.
  const call = fn => { try { const p = fn(); if (p && p.catch) p.catch(() => {}); } catch (e) { /* ignore */ } };
  const vibrate = ms => { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) { /* unsupported */ } };
  const native = fn => { if (isApp && P.Haptics) call(fn); };

  /* ---------- haptics ---------- */
  // In a browser only plotting buzzes (a short vibration), as before. The app
  // uses the phone's own haptic effects, which feel crisper and can differ in
  // strength, and adds light feedback to scoring, undo and finishing.
  const haptic = {
    dragStart: () => native(() => P.Haptics.selectionStart()),
    tick: () => (isApp ? native(() => P.Haptics.selectionChanged()) : vibrate(4)),     // crossed a ring line
    dragEnd: () => native(() => P.Haptics.selectionEnd()),
    place: () => (isApp ? native(() => P.Haptics.impact({ style: 'MEDIUM' })) : vibrate(12)), // arrow placed
    tap: () => native(() => P.Haptics.impact({ style: 'LIGHT' })),                       // score entered
    undo: () => native(() => P.Haptics.notification({ type: 'WARNING' })),
    success: () => native(() => P.Haptics.notification({ type: 'SUCCESS' }))
  };

  /* ---------- keep the screen on ---------- */
  let wakeLock = null, awake = false;
  async function keepAwake(on) {
    if (isApp && P.KeepAwake) {
      // The app's setting lasts until changed, so only tell Android when it changes.
      if (on !== awake) call(() => (on ? P.KeepAwake.keepAwake() : P.KeepAwake.allowSleep()));
      awake = on;
      return;
    }
    if (!('wakeLock' in navigator)) return;
    try {
      if (on && !wakeLock) {
        wakeLock = await navigator.wakeLock.request('screen');
        wakeLock.addEventListener('release', () => { wakeLock = null; });
      } else if (!on && wakeLock) {
        await wakeLock.release();
        wakeLock = null;
      }
    } catch (e) { /* not allowed right now; ignore */ }
  }

  /* ---------- saving a file ---------- */
  // A browser downloads it. The app can't download, so it writes the file and
  // opens Android's share sheet, where it can go to Google Drive, Files, email
  // or a message.
  async function saveFile(name, text, type) {
    if (!isApp) {
      const url = URL.createObjectURL(new Blob([text], { type }));
      const a = document.createElement('a');
      a.href = url; a.download = name;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      return;
    }
    const { uri } = await P.Filesystem.writeFile({ path: name, data: text, directory: 'CACHE', encoding: 'utf8' });
    try {
      await P.Share.share({ title: name, files: [uri], dialogTitle: 'Save or send ' + name });
    } catch (e) {
      if (!/cancel/i.test(e && e.message)) throw e;   // closing the share sheet is fine
    }
  }

  /* ---------- app updates ---------- */
  // The web app updates itself; the Android app updates by installing a newer
  // APK. Each APK is published as a GitHub release tagged android-<build>, so
  // compare the latest one with this app's build number and offer it if newer.
  const RELEASES = 'https://api.github.com/repos/joshrpr/Archery_Scores/releases/latest';
  const APK_URL = 'https://github.com/joshrpr/Archery_Scores/releases/latest/download/ropers-archery.apk';
  let lastCheck = 0, offered = 0;

  async function checkForUpdate() {
    if (!isApp || !P.App || !navigator.onLine || Date.now() - lastCheck < 60 * 60 * 1000) return;
    lastCheck = Date.now();
    try {
      const [info, res] = await Promise.all([P.App.getInfo(), fetch(RELEASES, { cache: 'no-cache' })]);
      if (!res.ok) return;
      const m = /^android-(\d+)$/.exec((await res.json()).tag_name || '');
      const latest = m ? Number(m[1]) : 0, mine = Number(info.build) || 0;
      if (latest > mine && latest !== offered) { offered = latest; showUpdate(); }
    } catch (e) { /* offline or rate limited; try again later */ }
  }

  function showUpdate() {
    if (document.querySelector('.app-update')) return;
    const bar = document.createElement('div');
    bar.className = 'app-update';
    bar.setAttribute('role', 'status');
    // Opening the link leaves the app for the browser, which downloads the APK.
    // Installing it over this app keeps every score.
    bar.innerHTML = `<span>A new version of the app is ready.</span>
      <a class="btn primary" href="${APK_URL}">Get it</a>
      <button class="app-update-x" aria-label="Not now">✕</button>`;
    bar.querySelector('button').addEventListener('click', () => bar.remove());
    document.body.appendChild(bar);
  }

  if (isApp) {
    document.documentElement.classList.add('native-app');
    window.addEventListener('load', checkForUpdate);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') checkForUpdate();
    });
  }

  return { isApp, haptic, keepAwake, saveFile };
})();
