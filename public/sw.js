importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");

const CACHE_NAME = "central-zumba-do-cris-push-20260623";
const APP_SHELL = [
  "/",
  "/turmas",
  "/planos",
  "/avisos",
  "/minha-area",
  "/cadastro",
  "/entrar",
  "/manifest.webmanifest?v=20260609",
  "/icons/icon-192.png?v=20260609",
  "/icons/icon-512.png?v=20260609",
  "/icons/apple-touch-icon.png?v=20260609",
  "/icons/favicon.ico?v=20260609"
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
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  const requestUrl = new URL(event.request.url);
  if (
    requestUrl.pathname.startsWith("/api/") ||
    requestUrl.pathname.startsWith("/professor")
  ) {
    event.respondWith(fetch(event.request));
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match("/")))
  );
});
