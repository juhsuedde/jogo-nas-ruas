import type { Messaging, MessagePayload } from "firebase/messaging";

const getEnvVar = (key: string): string => {
  const value = import.meta.env[key];
  if (!value) {
    console.error(`Missing environment variable: ${key}`);
    return "";
  }
  return value;
};

const firebaseConfig = {
  apiKey: getEnvVar("VITE_FIREBASE_API_KEY"),
  authDomain: "jogo-nas-ruas.firebaseapp.com",
  projectId: "jogo-nas-ruas",
  storageBucket: "jogo-nas-ruas.firebasestorage.app",
  messagingSenderId: getEnvVar("VITE_FIREBASE_SENDER_ID"),
  appId: getEnvVar("VITE_FIREBASE_APP_ID"),
};

const VAPID_KEY = getEnvVar("VITE_FIREBASE_VAPID_KEY");

let firebaseApp: ReturnType<typeof import("firebase/app").initializeApp> | null = null;
let _messaging: Messaging | null = null;

async function getMessagingSafe(): Promise<Messaging | null> {
  if (typeof window === "undefined") return null;
  if (!("Notification" in window) || !("serviceWorker" in navigator)) return null;
  if (_messaging) return _messaging;

  try {
    const { initializeApp } = await import("firebase/app");
    const { getMessaging } = await import("firebase/messaging");

    if (!firebaseApp) {
      firebaseApp = initializeApp(firebaseConfig);
    }
    _messaging = getMessaging(firebaseApp);
    return _messaging;
  } catch (e) {
    console.error("FCM init failed:", e);
    return null;
  }
}

export async function requestNotificationPermission(): Promise<string | null> {
  try {
    const messaging = await getMessagingSafe();
    if (!messaging) return null;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;

    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");

    const { getToken } = await import("firebase/messaging");
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });
    console.log("FCM Token:", token);
    return token ?? null;
  } catch (error) {
    console.error("Notification error:", error);
    return null;
  }
}

export async function onForegroundMessage(callback: (payload: MessagePayload) => void) {
  const messaging = await getMessagingSafe();
  if (!messaging) return () => {};
  const { onMessage } = await import("firebase/messaging");
  return onMessage(messaging, callback);
}
