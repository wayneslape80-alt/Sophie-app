const CACHE_NAME = "sophie-app-v2-9-2-5-readable-logo";
const CONCEPT_CSS_URL = "./assets/concept-a.css?v=2.9.2.5-readable-logo";

const APP_FILES = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./assets/android-first.css?v=2.9.2.4-dpr-draft",
  CONCEPT_CSS_URL,
  "./assets/concept-a-base-v2924.css?v=2.9.2.4",
  "./assets/style-lab.js?v=2.9.2.3",
  "./assets/surreal-os-emblem.png",
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
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET" || !event.request.url.startsWith(self.location.origin)) return;

  const requestUrl = new URL(event.request.url);
  if (requestUrl.pathname.endsWith("/assets/concept-a.css")) {
    event.respondWith(
      fetch(CONCEPT_CSS_URL, { cache: "no-store" })
        .then(response => {
          if (!response.ok) throw new Error("concept css fetch failed");
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(CONCEPT_CSS_URL, copy));
          return response;
        })
        .catch(() => caches.open(CACHE_NAME).then(cache => cache.match(CONCEPT_CSS_URL)))
    );
    return;
  }

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
