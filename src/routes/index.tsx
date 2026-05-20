import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => {
    const url = "https://jogonasruas.lovable.app/";
    const title = "Jogo nas Ruas — Mapa da Copa 2026";
    const description =
      "Mapa colaborativo de bares, restaurantes e praças transmitindo os jogos da Copa do Mundo 2026.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        {
          name: "viewport",
          content: "width=device-width, initial-scale=1, maximum-scale=1",
        },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: url },
      ],
      links: [
        { rel: "canonical", href: url },
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Bungee&family=Nunito:wght@400;600;700;800;900&display=block",
        },
      ],
    };
  },
  component: Splash,
});

const HAS_SEEN_SPLASH_KEY = "jnr_has_seen_splash";

function Splash() {
  const navigate = useNavigate();
  const [showSplash, setShowSplash] = useState(false);

  useEffect(() => {
    const hasSeen = localStorage.getItem(HAS_SEEN_SPLASH_KEY);

    if (hasSeen) {
      navigate({ to: "/mapa", replace: true });
    } else {
      setShowSplash(true);
      localStorage.setItem(HAS_SEEN_SPLASH_KEY, "true");

      const t = setTimeout(() => {
        navigate({ to: "/mapa", replace: true });
      }, 2500);

      return () => clearTimeout(t);
    }
  }, [navigate]);

  if (!showSplash) return null;

  return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-brasil-cream relative overflow-hidden animate-fade-in">
      {/* Decorative dot pattern */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: "radial-gradient(circle, var(--brasil-navy) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      />

      {/* Yellow blob */}
      <div className="absolute top-1/4 -left-20 w-64 h-64 bg-brasil-yellow/30 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-20 w-64 h-64 bg-brasil-green/20 rounded-full blur-3xl" />

      <div className="relative z-10 flex flex-col items-center gap-6">
        <div className="w-24 h-24 bg-brasil-yellow rounded-3xl flex items-center justify-center shadow-lg border-4 border-brasil-navy rotate-3">
          <span className="text-5xl">⚽</span>
        </div>

        <div className="text-center space-y-2">
          <h1 className="font-display text-4xl text-brasil-navy tracking-tight">JOGO NAS RUAS</h1>
          <p className="text-lg text-muted-foreground font-medium">copa 2026 · brasil</p>
        </div>
      </div>
    </div>
  );
}
