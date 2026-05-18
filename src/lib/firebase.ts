import { initializeApp } from "firebase/app";
import {
  getMessaging,
  getToken,
  onMessage,
  type Messaging,
  type MessagePayload,
} from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: "jogo-nas-ruas.firebaseapp.com",
  projectId: "jogo-nas-ruas",
  storageBucket: "jogo-nas-ruas.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
};

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || "";

const app = typeof window !== "undefined" ? initializeApp(firebaseConfig) : null;

let _messaging: Messaging | null = null;
function getMessagingSafe(): Messaging | null {
  if (typeof window === "undefined" || !app) return null;
  if (!("Notification" in window) || !("serviceWorker" in navigator)) return null;
  if (!_messaging) {
    try {
      _messaging = getMessaging(app);
    } catch (e) {
      console.error("FCM init failed:", e);
      return null;
    }
  }
  return _messaging;
}

export async function requestNotificationPermission(): Promise<string | null> {
  try {
    const messaging = getMessagingSafe();
    if (!messaging) return null;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;

    const registration = await navigator.serviceWorker.register("/firebase-messaging-sw.js");

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

export function onForegroundMessage(callback: (payload: MessagePayload) => void) {
  const messaging = getMessagingSafe();
  if (!messaging) return () => {};
  return onMessage(messaging, callback);
}
