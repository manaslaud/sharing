self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open("shared-space-v2").then((cache) =>
      cache.addAll(["/offline"]),
    ),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key !== "shared-space-v2")
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

function shouldBypass(url) {
  return (
    url.pathname.startsWith("/_next/") ||
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/serwist")
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin || shouldBypass(url)) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("/offline")),
    );
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        caches.open("shared-space-v2").then((cache) => cache.put(request, copy));
        return response;
      })
      .catch(() => caches.match(request)),
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
