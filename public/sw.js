const CACHE_NAME = "central-zumba-do-cris-fase-4-20260612";
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

// Future push providers can send JSON with title, body, icon and url.
self.addEventListener("push", (event) => {
  const fallback = {
    title: "Zumba do Cris",
    body: "Tem novidade no Mural da Comunidade 💖",
    icon: "/icons/icon-192.png?v=20260609",
    badge: "/icons/icon-192.png?v=20260609",
    url: "/avisos"
  };

  let data = fallback;

  if (event.data) {
    try {
      data = { ...fallback, ...event.data.json() };
    } catch {
      data = { ...fallback, body: event.data.text() };
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      data: { url: data.url },
      vibrate: [120, 60, 120]
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/avisos";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        const existingClient = clients.find((client) =>
          client.url.includes(targetUrl)
        );

        if (existingClient) return existingClient.focus();
        return self.clients.openWindow(targetUrl);
      })
  );
});
