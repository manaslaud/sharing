self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open("shared-space-v1").then((cache) =>
      cache.addAll(["/", "/offline", "/notes", "/journal", "/calendar"]),
    ),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match(request).then((cached) => cached || caches.match("/offline")),
      ),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const networked = fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open("shared-space-runtime").then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => cached);
      return cached || networked;
    }),
  );
});

self.addEventListener("push", (event) => {
  let data = { title: "Shared Space", body: "", url: "/" };
  try {
    data = { ...data, ...event.data.json() };
  } catch {
    data.body = event.data?.text() ?? "";
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      data,
      icon: "/icon",
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(self.clients.openWindow(url));
});
