// DigiKim service worker — caches the app shell so it installs and opens offline.
// API calls (chat completions) are always network-only and never cached.
const CACHE = "digikim-v1";
const SHELL = ["./", "./index.html", "./manifest.json", "./icon.svg"];

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
  const req = e.request;
  // Never cache API traffic; let it hit the network directly.
  if (req.method !== "GET" || new URL(req.url).pathname.includes("/chat/completions")) return;
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req)));
});
