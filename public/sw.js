// JADRAN Service Worker v7 — App Shell Cache + Push Notifications + Offline Page
// Strategy: Network-first for HTML, Cache-first for hashed assets, Never cache API
const CACHE = "jadran-v7";
const SHELL = ["/", "/ai", "/explore", "/landing", "/offline.html"];

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
        .catch(() => caches.match(e.request).then((cached) => cached || caches.match("/offline.html")))
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

// ─── Push Notifications ────────────────────────────────────────────────

self.addEventListener("push", e => {
  let data = { title: "JADRAN AI", body: "Nova obavijest", icon: "/icon-192.svg", tag: "jadran" };
  try { data = { ...data, ...e.data.json() }; } catch {}
  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || "/icon-192.svg",
      badge: "/icon-192.svg",
      tag: data.tag || "jadran",
      data: data.url ? { url: data.url } : {},
      requireInteraction: data.requireInteraction || false,
    })
  );
});

// ─── GPS Alert Notifications (from main thread when app is in background) ──
self.addEventListener("message", e => {
  if (e.data?.type === "show_alert") {
    self.registration.showNotification(e.data.title || "JADRAN AI", {
      body: e.data.body || "",
      icon: "/icon-192.svg",
      badge: "/icon-192.svg",
      tag: e.data.tag || "jadran-gps",
      requireInteraction: e.data.urgent || false,
    });
  }
});

self.addEventListener("notificationclick", e => {
  e.notification.close();
  const url = e.notification.data?.url || "/";
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(clients => {
      const existing = clients.find(c => c.url.includes(self.location.origin));
      if (existing) return existing.focus();
      return self.clients.openWindow(url);
    })
  );
});
