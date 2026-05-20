import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Star,
  CheckCircle2,
  Clock,
  MapPin,
  LogOut,
  Calendar,
  Users,
  Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useProfileData } from "@/features/profile/hooks/use-profile-data";
import { useAddReview } from "@/features/profile/hooks/use-reviews";
import { supabase } from "@/shared/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import type { Review } from "@/features/profile/hooks/use-reviews";

export const Route = createFileRoute("/perfil")({
  head: () => ({
    meta: [
      { title: "Meu perfil — Jogo nas Ruas" },
      {
        name: "description",
        content: "Seu perfil no Jogo nas Ruas: jogos confirmados, histórico e locais cadastrados.",
      },
    ],
  }),
  component: PerfilPage,
});

function PerfilPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { data: profileData, isLoading, error } = useProfileData();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [cityName, setCityName] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setUserLocation({ lat, lng });

        try {
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
          const response = await fetch(`${supabaseUrl}/functions/v1/reverse-geocode`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lat, lng }),
          });
          const data = await response.json();
          if (data.city) {
            setCityName(data.city);
          }
        } catch {
          // Ignore reverse geocoding errors
        }
      },
      () => {
        // Location denied/unavailable
      },
    );
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate({ to: "/login" });
  };

  if (!user) {
    return (
      <main className="absolute inset-0 overflow-y-auto pb-24">
        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b-2 border-brasil-navy/10">
          <div className="max-w-md mx-auto flex items-center justify-between p-4">
            <Link
              to="/"
              className="size-10 rounded-full bg-card handmade-border flex items-center justify-center"
              aria-label="Voltar"
            >
              <ArrowLeft className="size-4 text-brasil-navy" />
            </Link>
            <h1 className="font-display text-base text-brasil-navy tracking-wider">MEU PERFIL</h1>
            <div className="size-10" />
          </div>
        </div>
        <div className="max-w-md mx-auto px-4 pt-10 text-center space-y-6">
          <div className="text-6xl">👤</div>
          <h2 className="font-display text-xl text-brasil-navy">Faça login para ver seu perfil</h2>
          <p className="text-muted-foreground">
            Veja seus locais cadastrados, confirmações e histórico de jogos.
          </p>
          <Link
            to="/login"
            className="inline-block w-full rounded-2xl bg-brasil-green text-white font-bold py-3 text-center"
          >
            Entrar
          </Link>
        </div>
      </main>
    );
  }

  const displayName = user?.email?.split("@")[0] ?? "Usuário";
  const initials = (user?.email?.slice(0, 2) ?? "U").toUpperCase();

  return (
    <main className="absolute inset-0 overflow-y-auto pb-24">
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
          <h1 className="font-display text-base text-brasil-navy tracking-wider">MEU PERFIL</h1>
          <div className="size-10" />
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-5 space-y-6">
        {/* Avatar + identity */}
        <section className="flex items-center gap-4">
          <div className="relative">
            <div className="size-20 rounded-full bg-brasil-green handmade-border flex items-center justify-center">
              <span className="font-display text-2xl text-white">{initials}</span>
            </div>
            <div className="absolute -bottom-1 -right-1 size-7 rounded-full bg-brasil-yellow border-2 border-brasil-navy flex items-center justify-center text-sm">
              ⚽
            </div>
          </div>
          <div className="min-w-0">
            <p className="font-display text-lg text-brasil-navy truncate">{displayName}</p>
            <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
            {(cityName || userLocation) && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                <MapPin className="size-3" /> {cityName ?? "Localização obtida"}
              </p>
            )}
          </div>
        </section>

        {/* Stats */}
        {isLoading ? (
          <div className="rounded-3xl bg-brasil-navy handmade-border-yellow p-8 flex items-center justify-center">
            <Loader2 className="size-6 text-brasil-yellow animate-spin" />
          </div>
        ) : profileData ? (
          <section className="rounded-3xl bg-brasil-navy handmade-border-yellow p-4 grid grid-cols-3 gap-2 text-center text-white">
            <Stat label="Jogos" value={profileData.stats.jogos} />
            <div className="border-x border-white/15">
              <Stat label="Bares" value={profileData.stats.bares} />
            </div>
            <Stat label="Confirmados" value={profileData.stats.confirmados} />
          </section>
        ) : (
          <div className="rounded-3xl bg-card border-2 border-destructive/40 p-4 text-center text-destructive">
            Erro ao carregar dados
          </div>
        )}

        {/* Upcoming */}
        <section>
          <SectionTitle icon={<Calendar className="size-4" />}>PRÓXIMOS JOGOS</SectionTitle>
          <div className="-mx-4 px-4 mt-3 flex gap-3 overflow-x-auto pb-2 scrollbar-none">
            {profileData?.upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">Nenhum jogo confirmado</p>
            ) : (
              profileData?.upcoming.map((m) => (
                <article
                  key={m.id}
                  className="shrink-0 w-64 rounded-2xl bg-card handmade-border p-4"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{m.flag}</span>
                    <div className="min-w-0">
                      <p className="font-bold text-brasil-navy text-sm truncate">{m.teams}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="size-3" /> {m.time}
                      </p>
                    </div>
                  </div>
                  <div className="rounded-xl bg-background border-2 border-brasil-navy/15 p-2.5 mt-2">
                    <p className="text-xs font-bold text-brasil-navy truncate">📍 {m.venue}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Users className="size-3" /> Vai com {m.guests}{" "}
                      {m.guests === 1 ? "pessoa" : "pessoas"}
                    </p>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <section>
          <SectionTitle icon={<Clock className="size-4" />}>HISTÓRICO</SectionTitle>
          <div className="mt-3 space-y-2">
            {profileData?.history.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">Nenhum histórico ainda</p>
            ) : (
              profileData?.history.map((m) => <HistoryRow key={m.id} match={m} />)
            )}
          </div>
        </section>

        {/* My venues */}
        <section>
          <SectionTitle icon={<MapPin className="size-4" />}>LOCAIS QUE ADICIONEI</SectionTitle>
          <div className="mt-3 space-y-2">
            {profileData?.myVenues.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2">Nenhum local adicionado</p>
            ) : (
              profileData?.myVenues.map((v) => (
                <article
                  key={v.id}
                  className="rounded-2xl bg-card handmade-border p-3 flex items-center gap-3"
                >
                  <div className="size-11 rounded-xl bg-brasil-yellow/40 flex items-center justify-center shrink-0">
                    <MapPin className="size-5 text-brasil-navy" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-brasil-navy text-sm truncate">{v.name}</p>
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
                    <p className="text-xs text-muted-foreground truncate">{v.address}</p>
                    <p className="text-[11px] text-brasil-navy/70 mt-0.5">
                      {v.rsvps} pessoas confirmadas
                    </p>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        {/* Logout */}
        {user ? (
          <button
            onClick={handleSignOut}
            className="w-full rounded-2xl bg-card border-2 border-destructive/40 text-destructive font-bold py-3 flex items-center justify-center gap-2"
          >
            <LogOut className="size-4" />
            Sair da conta
          </button>
        ) : (
          <Link
            to="/login"
            className="block w-full rounded-2xl bg-brasil-green text-white font-bold py-3 text-center"
          >
            Entrar
          </Link>
        )}

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
      <p className="text-[11px] font-bold uppercase tracking-wider text-white/80">{label}</p>
    </div>
  );
}

function SectionTitle({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
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
  match: { id: string; teams: string; date: string; venue: string; venueId: string; score: string };
}) {
  const { data: review, isLoading } = useQuery({
    queryKey: ["my-review", match.venueId],
    queryFn: async (): Promise<Review | null> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("venue_id", match.venueId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    staleTime: 30_000,
  });

  const addReview = useAddReview();
  const currentRating = review?.rating ?? 0;
  const [optimisticRating, setOptimisticRating] = useState<number | null>(null);

  const displayRating = optimisticRating ?? currentRating;

  const handleRating = async (rating: number) => {
    setOptimisticRating(rating);
    try {
      await addReview.mutateAsync({ venueId: match.venueId, rating });
    } catch {
      setOptimisticRating(null);
    }
  };

  if (isLoading) {
    return (
      <article className="rounded-2xl bg-card handmade-border p-3">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="font-bold text-brasil-navy text-sm truncate">{match.teams}</p>
            <p className="text-xs text-muted-foreground truncate">
              {match.date} · {match.venue}
            </p>
          </div>
          <div className="shrink-0 rounded-lg bg-brasil-navy text-brasil-yellow font-display text-sm px-2.5 py-1">
            {match.score}
          </div>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">Avaliar o local:</span>
          <Loader2 className="size-4 text-brasil-navy/30 animate-spin" />
        </div>
      </article>
    );
  }

  return (
    <article className="rounded-2xl bg-card handmade-border p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="font-bold text-brasil-navy text-sm truncate">{match.teams}</p>
          <p className="text-xs text-muted-foreground truncate">
            {match.date} · {match.venue}
          </p>
        </div>
        <div className="shrink-0 rounded-lg bg-brasil-navy text-brasil-yellow font-display text-sm px-2.5 py-1">
          {match.score}
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground">Avaliar o local:</span>
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => handleRating(n)}
              disabled={addReview.isPending}
              aria-label={`${n} estrelas`}
            >
              <Star
                className={`size-4 transition-colors ${
                  n <= displayRating
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
