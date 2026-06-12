
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
});

// =========================
// FETCH EVENT (CACHE FIRST)
// =========================
self.addEventListener("fetch", (event) => {
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
    data = event.data.json();
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
    clients.openWindow(event.notification.data.url)
  );
});