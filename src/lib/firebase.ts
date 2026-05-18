import { initializeApp } from "firebase/app";
import {
  getMessaging,
  getToken,
  onMessage,
  type Messaging,
  type MessagePayload,
} from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyAj1yeQCze7e7aXCSLI3e4EcRCHKzeuESk",
  authDomain: "jogo-nas-ruas.firebaseapp.com",
  projectId: "jogo-nas-ruas",
  storageBucket: "jogo-nas-ruas.firebasestorage.app",
  messagingSenderId: "283883866697",
  appId: "1:283883866697:web:46998ec7a80acb089a0d98",
};

const VAPID_KEY =
  "BIjxcIaAsoIWrs2QTcDL5U6s3dBHHLG_ckABEdQF8Ez9jCoo7j5JdRk_DIbYgUT25zWvP2n4sVwBCAnyWtkW9KY";

const app =
  typeof window !== "undefined" ? initializeApp(firebaseConfig) : null;

let _messaging: Messaging | null = null;
function getMessagingSafe(): Messaging | null {
  if (typeof window === "undefined" || !app) return null;
  if (!("Notification" in window) || !("serviceWorker" in navigator))
    return null;
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

    const registration = await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js",
    );

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

export function onForegroundMessage(
  callback: (payload: MessagePayload) => void,
) {
  const messaging = getMessagingSafe();
  if (!messaging) return () => {};
  return onMessage(messaging, callback);
}
