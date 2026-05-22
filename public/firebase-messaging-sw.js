importScripts("https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyAj1yeQCze7e7aXCSLI3e4EcRCHKzeuESk",
  authDomain: "jogo-nas-ruas.firebaseapp.com",
  projectId: "jogo-nas-ruas",
  storageBucket: "jogo-nas-ruas.firebasestorage.app",
  messagingSenderId: "283883866697",
  appId: "1:283883866697:web:46998ec7a80acb089a0d98",
});

const messaging = firebase.messaging();

// Handle FCM token requests from the client
self.addEventListener("message", (event) => {
  if (event.data?.type === "GET_FCM_TOKEN") {
    const vapidKey = event.data.vapidKey;
    messaging
      .getToken({ vapidKey, serviceWorkerRegistration: self.registration })
      .then((token) => {
        event.ports[0].postMessage({ token });
      })
      .catch((err) => {
        event.ports[0].postMessage({ token: null });
        console.error("FCM getToken error in SW:", err);
      });
  }
});

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || "Jogo nas Ruas";
  const options = {
    body: payload.notification?.body || "",
    icon: "/icon-192.svg",
    badge: "/icon-192.svg",
    data: payload.data || {},
  };

  self.registration.showNotification(title, options);

  // Also forward to any focused clients for in-app toasts
  self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
    clients.forEach((client) => {
      client.postMessage({ type: "FCM_FOREGROUND", payload });
    });
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/mapa";
  event.waitUntil(clients.openWindow(url));
});
