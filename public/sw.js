// JADRAN Service Worker — Offline-first for campers with spotty signal
const CACHE_NAME = "jadran-v2";
const SHELL = [
  "/",
  "/ai",
  "/manifest.json",
  "/icon-192.svg",
];

// Install — pre-cache shell
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL))
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — network-first for API, cache-first for assets
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  // SKIP: Let browser handle JS/CSS modules directly (hashed filenames = immutable)
  if (url.pathname.startsWith("/assets/")) return;

  // API calls: network-first, cache fallback for weather
  if (url.pathname.startsWith("/api/")) {
    if (url.pathname === "/api/weather") {
      e.respondWith(
        fetch(e.request)
          .then((res) => {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(e.request, clone));
            return res;
          })
          .catch(() => caches.match(e.request))
      );
    }
    return; // Other API calls: always network
  }

  // Google Fonts: cache-first (they don't change)
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    e.respondWith(
      caches.match(e.request).then((cached) =>
        cached || fetch(e.request).then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(e.request, clone));
          return res;
        })
      )
    );
    return;
  }

  // City images: cache-first
  if (url.pathname.startsWith("/api/cityimg")) {
    e.respondWith(
      caches.match(e.request).then((cached) =>
        cached || fetch(e.request).then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(e.request, clone));
          return res;
        })
      )
    );
    return;
  }

  // Everything else: cache-first, network fallback, then offline page
  e.respondWith(
    caches.match(e.request).then((cached) =>
      cached || fetch(e.request).then((res) => {
        // Cache successful GET responses for static assets
        if (res.ok && e.request.method === "GET" && url.origin === self.location.origin) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(e.request, clone));
        }
        return res;
      }).catch(() => {
        // Offline fallback for navigation
        if (e.request.mode === "navigate") {
          return caches.match("/ai") || caches.match("/");
        }
      })
    )
  );
});
