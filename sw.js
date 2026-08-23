const CACHE_NAME = "sophie-app-v2-9-2-6-android-visual";

const APP_FILES = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./assets/android-first.css?v=2.9.2.6-android-visual",
  "./assets/concept-a.css?v=2.9.2.6-android-visual",
  "./assets/style-lab.js?v=2.9.2.3",
  "./assets/surreal-os-emblem.png?v=2.9.2.6-android-visual",
  "./assets/skill-pathways-v28.js",
  "./assets/skill-pathways-v28-choice.js",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_FILES)));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET" || !event.request.url.startsWith(self.location.origin)) return;
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        }
        return response;
      })
      .catch(() => caches.match(event.request).then(cached => cached || caches.match("./index.html")))
  );
});
