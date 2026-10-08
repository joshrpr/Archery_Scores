// Offline cache for Ropers Archery Scorecard.
// Serves the app from cache instantly (works with no signal). Whenever the app
// is opened or brought back to the screen with a connection, it asks this
// worker to check GitHub for changed files. If any changed, the new copies are
// cached together and the app is told to reload, so updates appear on their own.
// The cache name no longer needs bumping by hand: changes are found by content.
const CACHE = 'ibo-scorer-v10';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './target.js',
  './plot.js',
  './groups.js',
  './stats.js',
  './import.js',
  './stats.css',
  './manifest.webmanifest',
  './icons/logo.webp',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-512.png'
];

// 'no-cache' revalidates with the server (a cheap 304 when nothing changed)
// instead of trusting the browser's own HTTP cache, which can hold old files.
const fresh = url => fetch(url, { cache: 'no-cache' });

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE)
    .then(c => Promise.all(ASSETS.map(a => fresh(a).then(res => {
      if (!res.ok) throw new Error('Could not fetch ' + a);
      return c.put(a, res);
    }))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  event.respondWith(caches.open(CACHE).then(async cache => {
    const key = req.mode === 'navigate' ? './index.html' : req;
    const cached = await cache.match(key, { ignoreSearch: true });
    if (cached) return cached;
    // Not cached yet (first visit, or a new file): fetch it and keep a copy.
    const res = await fetch(req).catch(() => null);
    if (res && res.ok) cache.put(key, res.clone());
    return res || new Response('Offline', { status: 503 });
  }));
});

// Compare every app file with the server. Only when all of them download is the
// cache swapped, so the app never runs a mix of old and new files.
let checking = null;
async function checkForUpdate() {
  const cache = await caches.open(CACHE);
  const latest = await Promise.all(ASSETS.map(async a => {
    const res = await fresh(a);
    if (!res.ok) throw new Error('Could not fetch ' + a);
    return { a, res, body: await res.clone().arrayBuffer() };
  }));
  let changed = false;
  for (const { a, body } of latest) {
    const old = await cache.match(a);
    if (!old || !same(body, await old.arrayBuffer())) { changed = true; break; }
  }
  if (!changed) return false;
  await Promise.all(latest.map(({ a, res }) => cache.put(a, res)));
  return true;
}
function same(x, y) {
  if (x.byteLength !== y.byteLength) return false;
  const a = new Uint8Array(x), b = new Uint8Array(y);
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

self.addEventListener('message', event => {
  if (!event.data || event.data.type !== 'check-update') return;
  if (!checking) checking = checkForUpdate().catch(() => false).finally(() => { checking = null; });
  event.waitUntil(checking.then(async updated => {
    if (!updated) return;
    const all = await self.clients.matchAll({ type: 'window' });
    all.forEach(c => c.postMessage({ type: 'updated' }));
  }));
});
