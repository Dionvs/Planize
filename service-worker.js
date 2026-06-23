const CACHE_NAME = "gezinslijst-compact-ui-v2";
const APP_SHELL = [
  "./",
  "./index.html",
  "./style.css?v=compact-ui-v2",
  "./script.js?v=compact-ui-v2",
  "./firebase-config.js",
  "./manifest.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).catch(() => {
        if (event.request.mode === "navigate") {
          return caches.match("./index.html");
        }
        throw new Error("Netwerkverzoek mislukt");
      });
    })
  );
});
