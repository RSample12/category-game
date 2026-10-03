/* Service worker: lets the game open instantly and work offline.
 * - App shell and pages are cached on install.
 * - Same-origin files (the hashed JS/CSS/font bundles) are cached as they are first used.
 * - Page loads try the network first, so a new deploy shows up right away, and fall back to
 *   the cached copy when offline. Bump VERSION to force old caches to be dropped. */
const VERSION = 'v1';
const CACHE = `cd-${VERSION}`;
const SHELL = ['/', '/privacy', '/about', '/favicon.svg', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    // add files one by one so a single missing file can never block the install
    caches
      .open(CACHE)
      .then((c) => Promise.all(SHELL.map((u) => c.add(u).catch(() => undefined))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || url.pathname.startsWith('/_vercel/')) return;

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((hit) => hit || caches.match('/'))),
    );
    return;
  }

  // static assets: cache first, fill the cache on first use
  event.respondWith(
    caches.match(req).then(
      (hit) =>
        hit ||
        fetch(req).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        }),
    ),
  );
});
