import { createFileRoute, Link } from "@tanstack/react-router";
import { MapPin, MapPinCheck, MapPinPlusInside } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => {
    const url = "https://jogonasruas.vercel.app/";
    const title = "Jogo nas Ruas — Mapa da Copa 2026";
    const description =
      "Mapa colaborativo de bares, restaurantes e praças transmitindo os jogos da Copa do Mundo 2026. Encontre onde assistir perto de você.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        {
          name: "viewport",
          content: "width=device-width, initial-scale=1",
        },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: url },
        { property: "og:image", content: "https://jogonasruas.vercel.app/og.jpg" },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="h-full w-full flex flex-col bg-brasil-cream overflow-y-auto">
      {/* Hero */}
      <section className="relative min-h-[50dvh] flex flex-col items-center justify-center px-6 pt-16 pb-10 overflow-hidden">
        {/* Decorative elements */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, var(--brasil-navy) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />
        <div className="absolute top-1/4 -left-20 w-72 h-72 bg-brasil-yellow/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/3 -right-20 w-72 h-72 bg-brasil-green/20 rounded-full blur-3xl pointer-events-none" />

        {/* Brand */}
        <div className="relative z-10 flex flex-col items-center gap-5 mb-8">
          <div className="size-20 bg-brasil-yellow rounded-3xl flex items-center justify-center shadow-lg border-4 border-brasil-navy -rotate-3">
            <span className="text-4xl leading-none translate-y-px">⚽</span>
          </div>
          <div className="text-center">
            <h1 className="font-display text-4xl sm:text-5xl text-brasil-navy tracking-tight leading-tight">
              JOGO NAS RUAS
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground font-semibold mt-1">
              copa 2026 · brasil
            </p>
          </div>
        </div>

        {/* Headline */}
        <div className="relative z-10 text-center max-w-sm mb-8">
          <h2 className="font-display text-xl sm:text-2xl text-brasil-navy leading-snug mb-3">
            Onde você vai ver o Brasil jogar hoje?
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground font-medium leading-relaxed">
            Mapa colaborativo de bares, restaurantes e praças que estão transmitindo os jogos da
            Copa do Mundo. Encontre, confirme presença e reúna a galera.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 pb-24">
        <div className="max-w-xs mx-auto space-y-4">
          <div className="bg-card rounded-2xl handmade-border p-4 flex items-start gap-3">
            <div className="size-10 rounded-full bg-brasil-yellow/20 flex items-center justify-center shrink-0">
              <MapPin className="size-5 text-brasil-navy" />
            </div>
            <div>
              <h3 className="font-display text-sm text-brasil-navy tracking-wider mb-0.5">
                Encontre perto de você
              </h3>
              <p className="text-xs text-muted-foreground">
                Bares, restaurantes e praças que estão transmitindo os jogos, mapeados pela
                comunidade.
              </p>
            </div>
          </div>

          <div className="bg-card rounded-2xl handmade-border p-4 flex items-start gap-3">
            <div className="size-10 rounded-full bg-brasil-yellow/20 flex items-center justify-center shrink-0">
              <MapPinCheck className="size-5 text-brasil-navy" />
            </div>
            <div>
              <h3 className="font-display text-sm text-brasil-navy tracking-wider mb-0.5">
                Confirme presença
              </h3>
              <p className="text-xs text-muted-foreground">
                Veja quem mais vai e avise a galera. Nunca assista um jogo sozinho.
              </p>
            </div>
          </div>

          <div className="bg-card rounded-2xl handmade-border p-4 flex items-start gap-3">
            <div className="size-10 rounded-full bg-brasil-yellow/20 flex items-center justify-center shrink-0">
              <MapPinPlusInside className="size-5 text-brasil-navy" />
            </div>
            <div>
              <h3 className="font-display text-sm text-brasil-navy tracking-wider mb-0.5">
                Adicione um local
              </h3>
              <p className="text-xs text-muted-foreground">
                Sabia de um lugar que vai passar o jogo e não está no mapa? Adicione você mesmo.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center mt-8">
          <Link
            to="/mapa"
            className="inline-block rounded-xl bg-brasil-green text-white font-bold px-8 py-3 font-display tracking-wider text-sm shadow-lg hover:bg-brasil-green/90 active:scale-95 transition-all"
          >
            VER O MAPA
          </Link>
        </div>

        <p className="text-center text-[11px] text-muted-foreground mt-8">
          jogo nas ruas · copa 2026
        </p>
      </section>
    </div>
  );
}
