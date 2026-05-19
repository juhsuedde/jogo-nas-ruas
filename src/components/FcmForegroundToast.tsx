import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { onForegroundMessage } from "@/shared/lib/firebase";

type Notif = { title: string; body: string };

export function FcmForegroundToast() {
  const [notif, setNotif] = useState<Notif | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let unsub: (() => void) | undefined;
    let cancelled = false;
    onForegroundMessage((payload) => {
      const n = payload.notification;
      if (!n) return;
      setNotif({ title: n.title ?? "Jogo nas Ruas", body: n.body ?? "" });
    }).then((u) => {
      if (cancelled) {
        try { u?.(); } catch { /* ignore */ }
      } else {
        unsub = u;
      }
    }).catch(() => { /* ignore */ });
    return () => {
      cancelled = true;
      try { unsub?.(); } catch { /* ignore */ }
    };
  }, []);

  if (!notif) return null;

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[100] w-[min(92vw,420px)]">
      <div className="rounded-2xl bg-brasil-navy text-white border-2 border-brasil-yellow shadow-2xl p-3 flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="font-display text-lg leading-tight text-brasil-yellow">{notif.title}</div>
          {notif.body && <div className="text-sm text-white/90 mt-0.5">{notif.body}</div>}
        </div>
        <button
          aria-label="Fechar"
          onClick={() => setNotif(null)}
          className="text-brasil-yellow shrink-0 p-1"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
