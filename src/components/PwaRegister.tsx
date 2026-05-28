import { useEffect, useState } from "react";

export function PwaRegister() {
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const inIframe = (() => {
      try {
        return window.self !== window.top;
      } catch {
        return true;
      }
    })();
    const host = window.location.hostname;
    const isPreview =
      host.includes("id-preview--") ||
      host.includes("lovableproject.com") ||
      host === "localhost" ||
      host === "127.0.0.1";

    if (inIframe || isPreview) {
      navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => r.unregister()));
      return;
    }

    navigator.serviceWorker.register("/sw.js").catch(() => {});
    navigator.serviceWorker.register("/firebase-messaging-sw.js").catch(() => {});

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!deferredPrompt) return null;

  return (
    <div className="fixed bottom-20 inset-x-0 z-[800] px-4 pointer-events-none">
      <div className="mx-auto max-w-md bg-brasil-navy rounded-2xl handmade-border-yellow p-4 pointer-events-auto flex items-center gap-3 shadow-xl">
        <div className="size-10 shrink-0 bg-brasil-yellow rounded-xl flex items-center justify-center text-lg">
          ⚽
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm">Instale o app</p>
          <p className="text-white/60 text-xs">Adicione à tela inicial</p>
        </div>
        <button
          onClick={() => {
            (deferredPrompt as Event & { prompt: () => void; userChoice: Promise<{ outcome: string }> }).prompt();
            setDeferredPrompt(null);
          }}
          className="shrink-0 rounded-lg bg-brasil-yellow text-brasil-navy font-bold px-4 py-2 text-xs font-display tracking-wider"
        >
          Instalar
        </button>
        <button
          onClick={() => setDeferredPrompt(null)}
          className="shrink-0 text-white/50 hover:text-white text-lg leading-none"
          aria-label="Fechar"
        >
          ×
        </button>
      </div>
    </div>
  );
}
