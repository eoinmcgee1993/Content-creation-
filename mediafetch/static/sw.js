// Minimal service worker — required for PWA installability.
// Caches the app shell so the UI opens instantly; downloads always hit the network.
const CACHE = "mediafetch-v1";
const SHELL = ["/", "/index.html", "/manifest.webmanifest", "/icon-192.png", "/icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const { request } = e;
  // Never cache the download API; always go to the network.
  if (request.method !== "GET" || request.url.includes("/api/")) return;
  e.respondWith(caches.match(request).then((cached) => cached || fetch(request)));
});
