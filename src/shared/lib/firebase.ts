import { supabase } from "@/shared/lib/supabase";

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || "";

function getSw(): ServiceWorkerContainer | null {
  if (typeof window === "undefined") return null;
  if (!("Notification" in window) || !("serviceWorker" in navigator)) return null;
  return navigator.serviceWorker;
}

export async function requestNotificationPermission(): Promise<string | null> {
  try {
    const sw = getSw();
    if (!sw) return null;

    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;

    const registration = await sw.register("/firebase-messaging-sw.js", { scope: "/" });

    if (registration.installing) {
      await new Promise<void>((resolve) => {
        registration.installing!.addEventListener("statechange", (e) => {
          if ((e.target as ServiceWorker).state === "activated") resolve();
        });
      });
    } else if (registration.waiting) {
      await new Promise<void>((resolve) => {
        registration.waiting!.addEventListener("statechange", (e) => {
          if ((e.target as ServiceWorker).state === "activated") resolve();
        });
      });
    }

    await sw.ready;

    // Request FCM token from the service worker via MessageChannel
    const token = await new Promise<string | null>((resolve) => {
      const channel = new MessageChannel();
      channel.port1.onmessage = (event) => {
        resolve(event.data?.token ?? null);
      };
      sw.controller?.postMessage({ type: "GET_FCM_TOKEN", vapidKey: VAPID_KEY }, [channel.port2]);
      setTimeout(() => resolve(null), 10000);
    });

    if (token) {
      console.log("FCM Token:", token);
    }
    return token;
  } catch (error) {
    console.error("Notification error:", error);
    return null;
  }
}

export async function saveFcmToken(token: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase.rpc("upsert_user_fcm_token", {
    p_user_id: user.id,
    p_token: token,
    p_device_type: "web",
  });
  if (error) {
    console.error("Failed to save FCM token:", error);
  }
}

type ForegroundCallback = (payload: {
  notification?: { title?: string; body?: string };
  data?: Record<string, string>;
}) => void;

export async function onForegroundMessage(callback: ForegroundCallback): Promise<() => void> {
  const sw = getSw();
  if (!sw) return () => {};

  const handler = (event: MessageEvent) => {
    if (event.data?.type === "FCM_FOREGROUND") {
      callback(event.data.payload);
    }
  };

  sw.addEventListener("message", handler);
  return () => sw.removeEventListener("message", handler);
}
