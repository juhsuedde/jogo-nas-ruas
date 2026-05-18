import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Star,
  CheckCircle2,
  Clock,
  MapPin,
  LogOut,
  Calendar,
  Users,
} from "lucide-react";
import { useState } from "react";
import { BottomNav } from "@/components/BottomNav";

export const Route = createFileRoute("/perfil")({
  head: () => ({
    meta: [
      { title: "Meu perfil — Jogo nas Ruas" },
      {
        name: "description",
        content:
          "Seu perfil no Jogo nas Ruas: jogos confirmados, histórico e locais cadastrados.",
      },
    ],
  }),
  component: PerfilPage,
});

const USER = {
  name: "Lucas Andrade",
  handle: "@lucasdrade",
  city: "São Paulo · SP",
  initials: "LA",
  stats: { jogos: 12, bares: 5, confirmados: 38 },
};

const UPCOMING = [
  {
    id: "u1",
    teams: "Brasil x Argentina",
    time: "Hoje · 16:00",
    venue: "Boteco do Zé",
    flag: "🇧🇷",
    guests: 4,
  },
  {
    id: "u2",
    teams: "França x Alemanha",
    time: "Hoje · 13:00",
    venue: "Veloso Bar",
    flag: "🇫🇷",
    guests: 2,
  },
  {
    id: "u3",
    teams: "Brasil x México",
    time: "Quinta · 16:00",
    venue: "Praça Roosevelt",
    flag: "🇧🇷",
    guests: 6,
  },
];

const HISTORY = [
  {
    id: "h1",
    teams: "Brasil x Sérvia",
    date: "12 jun",
    venue: "Empório Alto dos Pinheiros",
    score: "2x0",
  },
  {
    id: "h2",
    teams: "Argentina x Holanda",
    date: "08 jun",
    venue: "Bar Brahma",
    score: "3x2",
  },
  {
    id: "h3",
    teams: "Portugal x Coreia",
    date: "05 jun",
    venue: "Quitanda da Esquina",
    score: "1x1",
  },
];

const MY_VENUES = [
  {
    id: "v1",
    name: "Boteco do Zé",
    address: "R. Augusta, 1200 · Consolação",
    verified: true,
    rsvps: 24,
  },
  {
    id: "v2",
    name: "Quitanda da Esquina",
    address: "R. Cardeal Arcoverde, 500 · Pinheiros",
    verified: true,
    rsvps: 11,
  },
  {
    id: "v3",
    name: "Praça Roosevelt — Telão",
    address: "Praça Roosevelt · República",
    verified: false,
    rsvps: 3,
  },
];

function PerfilPage() {
  return (
    <main className="min-h-screen pb-28">
      <BottomNav />
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b-2 border-brasil-navy/10">
        <div className="max-w-md mx-auto flex items-center justify-between p-4">
          <Link
            to="/"
            className="size-10 rounded-full bg-card handmade-border flex items-center justify-center"
            aria-label="Voltar"
          >
            <ArrowLeft className="size-4 text-brasil-navy" />
          </Link>
          <h1 className="font-display text-base text-brasil-navy tracking-wider">
            MEU PERFIL
          </h1>
          <div className="size-10" />
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-5 space-y-6">
        {/* Avatar + identity */}
        <section className="flex items-center gap-4">
          <div className="relative">
            <div className="size-20 rounded-full bg-brasil-green handmade-border flex items-center justify-center">
              <span className="font-display text-2xl text-white">
                {USER.initials}
              </span>
            </div>
            <div className="absolute -bottom-1 -right-1 size-7 rounded-full bg-brasil-yellow border-2 border-brasil-navy flex items-center justify-center text-sm">
              ⚽
            </div>
          </div>
          <div className="min-w-0">
            <p className="font-display text-lg text-brasil-navy truncate">
              {USER.name}
            </p>
            <p className="text-sm text-muted-foreground">{USER.handle}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
              <MapPin className="size-3" /> {USER.city}
            </p>
          </div>
        </section>

        {/* Stats */}
        <section className="rounded-3xl bg-brasil-navy handmade-border-yellow p-4 grid grid-cols-3 gap-2 text-center text-white">
          <Stat label="Jogos" value={USER.stats.jogos} />
          <div className="border-x border-white/15">
            <Stat label="Bares" value={USER.stats.bares} />
          </div>
          <Stat label="Confirmados" value={USER.stats.confirmados} />
        </section>

        {/* Upcoming */}
        <section>
          <SectionTitle icon={<Calendar className="size-4" />}>
            PRÓXIMOS JOGOS
          </SectionTitle>
          <div className="-mx-4 px-4 mt-3 flex gap-3 overflow-x-auto pb-2 scrollbar-none">
            {UPCOMING.map((m) => (
              <article
                key={m.id}
                className="shrink-0 w-64 rounded-2xl bg-card handmade-border p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{m.flag}</span>
                  <div className="min-w-0">
                    <p className="font-bold text-brasil-navy text-sm truncate">
                      {m.teams}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="size-3" /> {m.time}
                    </p>
                  </div>
                </div>
                <div className="rounded-xl bg-background border-2 border-brasil-navy/15 p-2.5 mt-2">
                  <p className="text-xs font-bold text-brasil-navy truncate">
                    📍 {m.venue}
                  </p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                    <Users className="size-3" /> Vai com {m.guests}{" "}
                    {m.guests === 1 ? "pessoa" : "pessoas"}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* History */}
        <section>
          <SectionTitle icon={<Clock className="size-4" />}>
            HISTÓRICO
          </SectionTitle>
          <div className="mt-3 space-y-2">
            {HISTORY.map((m) => (
              <HistoryRow key={m.id} match={m} />
            ))}
          </div>
        </section>

        {/* My venues */}
        <section>
          <SectionTitle icon={<MapPin className="size-4" />}>
            LOCAIS QUE ADICIONEI
          </SectionTitle>
          <div className="mt-3 space-y-2">
            {MY_VENUES.map((v) => (
              <article
                key={v.id}
                className="rounded-2xl bg-card handmade-border p-3 flex items-center gap-3"
              >
                <div className="size-11 rounded-xl bg-brasil-yellow/40 flex items-center justify-center shrink-0">
                  <MapPin className="size-5 text-brasil-navy" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-bold text-brasil-navy text-sm truncate">
                      {v.name}
                    </p>
                    {v.verified ? (
                      <span
                        className="inline-flex items-center gap-0.5 text-[10px] font-bold text-brasil-green"
                        title="Verificado"
                      >
                        <CheckCircle2 className="size-3.5" />
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold uppercase bg-brasil-yellow text-brasil-navy px-1.5 py-0.5 rounded-full border border-brasil-navy">
                        novo
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {v.address}
                  </p>
                  <p className="text-[11px] text-brasil-navy/70 mt-0.5">
                    {v.rsvps} pessoas confirmadas
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Logout */}
        <button className="w-full rounded-2xl bg-card border-2 border-destructive/40 text-destructive font-bold py-3 flex items-center justify-center gap-2">
          <LogOut className="size-4" />
          Sair da conta
        </button>

        <p className="text-center text-[11px] text-muted-foreground pt-2">
          jogo nas ruas · copa 2026
        </p>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="font-display text-2xl text-brasil-yellow">{value}</p>
      <p className="text-[11px] font-bold uppercase tracking-wider text-white/80">
        {label}
      </p>
    </div>
  );
}

function SectionTitle({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 text-brasil-navy">
      {icon}
      <h2 className="font-display text-sm tracking-wider">{children}</h2>
    </div>
  );
}

function HistoryRow({
  match,
}: {
  match: { id: string; teams: string; date: string; venue: string; score: string };
}) {
  const [rating, setRating] = useState(0);
  return (
    <article className="rounded-2xl bg-card handmade-border p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="font-bold text-brasil-navy text-sm truncate">
            {match.teams}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            {match.date} · {match.venue}
          </p>
        </div>
        <div className="shrink-0 rounded-lg bg-brasil-navy text-brasil-yellow font-display text-sm px-2.5 py-1">
          {match.score}
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground">
          Avaliar o local:
        </span>
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => setRating(n)}
              aria-label={`${n} estrelas`}
            >
              <Star
                className={`size-4 transition-colors ${
                  n <= rating
                    ? "fill-brasil-yellow text-brasil-yellow"
                    : "text-brasil-navy/30"
                }`}
              />
            </button>
          ))}
        </div>
      </div>
    </article>
  );
}
