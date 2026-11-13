// Service worker for the admin panel. Caches the app shell and static files so the panel opens fast and
// installs everywhere. API calls (/api/*) always go to the network: nothing private is ever cached.
const VERSION = 'dev'; // build.ts replaces this with a build id so every build installs a fresh worker
const SHELL = `ndx-shell-${VERSION}`;
const ASSETS = `ndx-assets-${VERSION}`;

// Bundles are named by hash and import each other, so read them out of the page and out of each other.
async function precache() {
  const shell = await caches.open(SHELL);
  const assets = await caches.open(ASSETS);
  const home = await fetch('/', { cache: 'no-cache' });
  await shell.put('/', home.clone());
  await shell.addAll(['/manifest.webmanifest', '/icons/icon-192.png']);

  const found = (text) => text.match(/\/?(?:chunk|logo)-[a-z0-9]+\.(?:js|css|png)/g) ?? [];
  const queue = found(await home.text()).map((n) => '/' + n.replace(/^\//, ''));
  const seen = new Set();
  while (queue.length && seen.size < 200) {
    const url = queue.pop();
    if (seen.has(url)) continue;
    seen.add(url);
    const res = await fetch(url);
    if (!res.ok) continue;
    await assets.put(url, res.clone());
    if (url.endsWith('.js')) queue.push(...found(await res.text()).map((n) => '/' + n.replace(/^\//, '')));
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(precache().then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('ndx-') && k !== SHELL && k !== ASSETS).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;

  // Page loads: network first so a new build shows up, the cached shell when offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(SHELL).then((cache) => cache.put('/', copy));
          return res;
        })
        .catch(() => caches.match('/'))
    );
    return;
  }

  // Hashed bundles and images never change under the same name: cache first.
  event.respondWith(
    caches.match(request).then((hit) => hit || fetch(request).then((res) => {
      if (res.ok) {
        const copy = res.clone();
        caches.open(ASSETS).then((cache) => cache.put(request, copy));
      }
      return res;
    }))
  );
});
