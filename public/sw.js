
// =========================
// CACHE NAME
// =========================
const CACHE_NAME = "loved-chat-v1";

// =========================
// FILES TO CACHE (APP SHELL)
// =========================
const urlsToCache = [
  "/",
  "/index.html",
  "/app.jpg",
  "/manifest.json"
];

// =========================
// INSTALL EVENT
// =========================
self.addEventListener("install", (event) => {
  console.log("Service Worker Installing...");

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// =========================
// ACTIVATE EVENT
// =========================
self.addEventListener("activate", (event) => {
  console.log("Service Worker Activated");

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// ==========================================
// FETCH EVENT (FIXED WITH PLUG-IN SAFETY GAP)
// ==========================================
self.addEventListener("fetch", (event) => {
  // 🔥 CRITICAL FIX: Skip caching if it's a socket connect request or external API upload loop
  if (!event.request.url.startsWith(self.location.origin)) {
    return; // Let the hardware send it straight to the internet natively!
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// =========================
// PUSH NOTIFICATION EVENT
// =========================
self.addEventListener("push", (event) => {
  let data = {
    title: "New Message",
    body: "You have a new message",
    url: "/"
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: "/app.jpg",
    badge: "/app.jpg",
    data: {
      url: data.url || "/"
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// =========================
// CLICK NOTIFICATION
// =========================
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      // If window is already open, just focus it instead of spawning endless duplicate tabs
      for (const client of clientList) {
        if (client.url === event.notification.data.url && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data.url);
      }
    })
  );
});