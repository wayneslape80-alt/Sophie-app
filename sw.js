const CACHE_PREFIX = "sophie-app-";
const BUILD_ID = "v2-9-2-9-wave1-school-overdue-rc1";
const CACHE_NAME = `${CACHE_PREFIX}${BUILD_ID}`;
const INDEX_URL = "./index.html";

const APP_FILES = [
  "./",
  INDEX_URL,
  "./manifest.webmanifest",
  "./assets/android-first.css?v=2.9.2.6-android-visual",
  "./assets/concept-a.css?v=2.9.2.6-android-visual",
  "./assets/style-lab.js?v=2.9.2.3",
  "./assets/surreal-os-emblem.png?v=2.9.2.6-android-visual",
  "./assets/skill-pathways-v28.js",
  "./assets/skill-pathways-v28-choice.js",
  "./assets/skill-pathways-v28-choice-core.js",
  "./assets/issue50-school-status.js",
  "./assets/issue50-school-status-focus.js",
  "./assets/wave1-pwa-trust.js?v=wave1-pwa-trust-draft",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_FILES)));
});

self.addEventListener("message", event => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

function unavailableResponse() {
  return new Response("", {
    status: 503,
    statusText: "Offline"
  });
}

self.addEventListener("fetch", event => {
  const request = event.request;
  const requestUrl = new URL(request.url);
  if (request.method !== "GET" || requestUrl.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cachedIndex = await cache.match(INDEX_URL);
      if (cachedIndex) return cachedIndex;
      try {
        return await fetch(request);
      } catch {
        return unavailableResponse();
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    if (cached) return cached;
    try {
      return await fetch(request);
    } catch {
      return unavailableResponse();
    }
  })());
});
