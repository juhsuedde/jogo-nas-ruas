import { useEffect, useState } from "react";
import { X, Share, Plus } from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "jnr_a2hs_dismissed_at";
const DISMISS_DAYS = 14;

function recentlyDismissed() {
  if (typeof localStorage === "undefined") return false;
  const v = localStorage.getItem(DISMISS_KEY);
  if (!v) return false;
  const days = (Date.now() - Number(v)) / 86_400_000;
  return days < DISMISS_DAYS;
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // @ts-expect-error iOS
    window.navigator.standalone === true
  );
}

function isIos() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
}

export function PwaInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIos, setShowIos] = useState(false);

  useEffect(() => {
    if (isStandalone() || recentlyDismissed()) return;

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onBip);

    if (isIos()) {
      const t = setTimeout(() => setShowIos(true), 3000);
      return () => {
        clearTimeout(t);
        window.removeEventListener("beforeinstallprompt", onBip);
      };
    }
    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setDeferred(null);
    setShowIos(false);
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    dismiss();
  };

  if (deferred) {
    return (
      <div className="fixed inset-x-3 bottom-24 z-50 flex items-center gap-3 rounded-xl border-2 border-foreground bg-background p-3 shadow-[3px_3px_0_var(--foreground)]">
        <img src="/icon-192.svg" alt="" className="h-10 w-10 rounded-lg" />
        <div className="flex-1 text-sm">
          <p className="font-bold leading-tight">Instalar Jogo nas Ruas</p>
          <p className="text-xs text-muted-foreground">Acesso rápido, em tela cheia.</p>
        </div>
        <button
          onClick={install}
          className="rounded-md bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground"
        >
          Instalar
        </button>
        <button onClick={dismiss} aria-label="Fechar" className="p-1">
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  if (showIos) {
    return (
      <div className="fixed inset-x-3 bottom-24 z-50 rounded-xl border-2 border-foreground bg-background p-3 shadow-[3px_3px_0_var(--foreground)]">
        <div className="flex items-start gap-2">
          <img src="/icon-192.svg" alt="" className="h-10 w-10 rounded-lg" />
          <div className="flex-1 text-xs leading-snug">
            <p className="text-sm font-bold">Instalar no iPhone</p>
            <p className="mt-1 text-muted-foreground">
              Toque em <Share className="inline h-3.5 w-3.5" /> e depois em{" "}
              <span className="font-semibold">
                Adicionar à Tela de Início <Plus className="inline h-3 w-3" />
              </span>
              .
            </p>
          </div>
          <button onClick={dismiss} aria-label="Fechar" className="p-1">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return null;
}
