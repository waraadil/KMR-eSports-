/* KMR eSports service worker — minimal + safe.
   Only GET static assets are cached; pages are network-first; /api is never intercepted. */
const CACHE = "kmr-static-v1";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api")) return; // auth, payments — always live

  if (url.pathname.startsWith("/_next/static") || url.pathname.startsWith("/assets") || url.pathname.startsWith("/icons")) {
    // static assets: cache-first with background refresh
    event.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const hit = await cache.match(request);
        const fresh = fetch(request)
          .then((res) => {
            if (res.ok) cache.put(request, res.clone());
            return res;
          })
          .catch(() => hit);
        return hit || fresh;
      })
    );
    return;
  }

  // pages: network-first, fall back to cache when offline
  event.respondWith(
    fetch(request).catch(async () => {
      const hit = await caches.match(request);
      return hit || Response.error();
    })
  );
});
