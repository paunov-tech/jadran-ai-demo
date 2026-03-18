// JADRAN Service Worker v5 — App Shell Cache
// Strategy: Network-first for HTML, Cache-first for hashed assets, Never cache API
const CACHE = "jadran-v5";
const SHELL = ["/", "/ai"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  // Never cache: API calls, Stripe, Firebase, analytics, external
  if (url.pathname.startsWith("/api/") || url.origin !== self.location.origin) return;

  // Hashed assets (immutable) — cache-first
  if (url.pathname.startsWith("/assets/")) {
    e.respondWith(
      caches.match(e.request).then((cached) => cached || fetch(e.request).then((res) => {
        if (res.ok) { const clone = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, clone)); }
        return res;
      }))
    );
    return;
  }

  // HTML / navigation — network-first, cache fallback
  if (e.request.mode === "navigate" || e.request.headers.get("accept")?.includes("text/html")) {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          if (res.ok) { const clone = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, clone)); }
          return res;
        })
        .catch(() => caches.match(e.request).then((cached) => cached || caches.match("/")))
    );
    return;
  }

  // Everything else (icons, manifest, images) — stale-while-revalidate
  e.respondWith(
    caches.match(e.request).then((cached) => {
      const fetched = fetch(e.request).then((res) => {
        if (res.ok) { const clone = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, clone)); }
        return res;
      }).catch(() => cached);
      return cached || fetched;
    })
  );
});
