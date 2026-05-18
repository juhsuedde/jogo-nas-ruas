import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

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
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Bungee&family=Nunito:wght@400;600;700;800;900&display=swap",
        },
      ],
    };
  },
  component: Splash,
});

function Splash() {
  const navigate = useNavigate();
  useEffect(() => {
    const t = setTimeout(() => navigate({ to: "/mapa" }), 2000);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <main className="absolute inset-0 bg-brasil-green flex flex-col items-center justify-center overflow-hidden">
      {/* Decorative dot pattern */}
      <div
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            "radial-gradient(oklch(0.88 0.18 95) 1.5px, transparent 1.5px)",
          backgroundSize: "22px 22px",
        }}
      />
      {/* Yellow blob */}
      <div className="absolute -top-20 -right-20 size-72 rounded-full bg-brasil-yellow/30 blur-2xl" />
      <div className="absolute -bottom-24 -left-16 size-72 rounded-full bg-brasil-navy/40 blur-2xl" />

      <div className="relative flex flex-col items-center gap-4 px-8 text-center">
        <div className="size-24 rounded-3xl bg-brasil-yellow handmade-border flex items-center justify-center text-5xl animate-bounce">
          ⚽
        </div>
        <h1 className="font-display text-4xl text-white leading-tight tracking-wide">
          JOGO NAS RUAS
          <br />
          <span className="text-brasil-yellow text-2xl">Mapa da Copa 2026</span>
        </h1>
        <p className="text-white/90 font-bold text-sm">copa 2026 · brasil</p>

        <div className="mt-6 flex gap-1">
          <span className="size-2 rounded-full bg-brasil-yellow animate-pulse" />
          <span
            className="size-2 rounded-full bg-brasil-yellow animate-pulse"
            style={{ animationDelay: "150ms" }}
          />
          <span
            className="size-2 rounded-full bg-brasil-yellow animate-pulse"
            style={{ animationDelay: "300ms" }}
          />
        </div>
      </div>
    </main>
  );
}
