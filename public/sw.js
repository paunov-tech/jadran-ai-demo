// JADRAN Service Worker — RESET v4
// Clears all caches and unregisters itself.
// After all users get clean state, we deploy proper SW.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .then(() => self.registration.unregister())
      .then(() => self.clients.matchAll())
      .then((clients) => clients.forEach((c) => c.navigate(c.url)))
  );
});

// Do NOT intercept any fetches
self.addEventListener("fetch", () => {});
