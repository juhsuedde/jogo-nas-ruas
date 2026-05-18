// Jogo nas Ruas — service worker
// Caches: app shell (network-first HTML), OSM map tiles (cache-first), static assets.
const VERSION = "v1";
const SHELL_CACHE = `shell-${VERSION}`;
const TILES_CACHE = `tiles-${VERSION}`;
const ASSETS_CACHE = `assets-${VERSION}`;
const DATA_CACHE = `data-${VERSION}`;

const TILES_MAX = 300;

self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => ![SHELL_CACHE, TILES_CACHE, ASSETS_CACHE, DATA_CACHE].includes(k))
          .map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

async function trimCache(name, max) {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  if (keys.length > max) {
    await Promise.all(keys.slice(0, keys.length - max).map((k) => cache.delete(k)));
  }
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // OSM map tiles — cache-first
  if (/tile\.openstreetmap\.org$/.test(url.hostname)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(TILES_CACHE);
        const hit = await cache.match(req);
        if (hit) return hit;
        try {
          const res = await fetch(req);
          if (res.ok) {
            cache.put(req, res.clone());
            trimCache(TILES_CACHE, TILES_MAX);
          }
          return res;
        } catch {
          return hit || Response.error();
        }
      })()
    );
    return;
  }

  // Supabase REST (venues data) — stale-while-revalidate
  if (url.hostname.endsWith(".supabase.co") && url.pathname.startsWith("/rest/")) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(DATA_CACHE);
        const hit = await cache.match(req);
        const network = fetch(req)
          .then((res) => {
            if (res.ok) cache.put(req, res.clone());
            return res;
          })
          .catch(() => hit);
        return hit || network;
      })()
    );
    return;
  }

  // Same-origin navigations — network-first, fall back to cached shell
  if (req.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const res = await fetch(req);
          const cache = await caches.open(SHELL_CACHE);
          cache.put(req, res.clone());
          return res;
        } catch {
          const cache = await caches.open(SHELL_CACHE);
          const hit = await cache.match(req);
          return hit || (await cache.match("/mapa")) || Response.error();
        }
      })()
    );
    return;
  }

  // Same-origin static assets — cache-first
  if (url.origin === self.location.origin) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(ASSETS_CACHE);
        const hit = await cache.match(req);
        if (hit) return hit;
        try {
          const res = await fetch(req);
          if (res.ok && (res.type === "basic" || res.type === "default")) {
            cache.put(req, res.clone());
          }
          return res;
        } catch {
          return hit || Response.error();
        }
      })()
    );
  }
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});
