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

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || "Jogo nas Ruas";
  const options = {
    body: payload.notification?.body || "",
    icon: "/icon-192.svg",
    badge: "/icon-192.svg",
    data: payload.data || {},
  };
  self.registration.showNotification(title, options);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/mapa";
  event.waitUntil(clients.openWindow(url));
});
