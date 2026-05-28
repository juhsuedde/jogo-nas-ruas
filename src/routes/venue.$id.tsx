import { createFileRoute, useNavigate, useParams, Link } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { VenueDetail } from "@/features/venues/components/VenueDetail";
import { VenuePhotos } from "@/features/venues/components/VenuePhotos";
import { useVenue, useToggleRsvp, useMyRsvp, useClaimVenue } from "@/shared/lib/venues";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { toast } from "sonner";
import { supabase } from "@/shared/lib/supabase";

interface VenueMeta {
  name: string;
  address: string;
  neighborhood: string | null;
  city_name: string;
  state: string | null;
  phone: string | null;
  lat: number;
  lng: number;
  match_ids: string[] | null;
}

const OG_IMAGE = "https://jogonasruas.vercel.app/og.jpg";

export const Route = createFileRoute("/venue/$id")({
  loader: async ({ params }) => {
    const { data } = await supabase
      .from("venues")
      .select(
        `id, name, address, neighborhood, city_name, state, phone, lat, lng,
        has_big_screen, has_promotion, has_parking, promotions,
        match_ids, shows_all_matches, verified, status`,
      )
      .eq("id", params.id)
      .eq("status", "approved")
      .maybeSingle();
    return { venueMeta: (data ?? null) as VenueMeta | null };
  },
  head: ({ params, loaderData }) => {
    const v = loaderData?.venueMeta;
    const url = `https://jogonasruas.vercel.app/venue/${params.id}`;
    const title = v ? `${v.name} em ${v.city_name} | Jogo nas Ruas` : "Local — Jogo nas Ruas";
    const description = v
      ? `Assista aos jogos da Copa 2026 no ${v.name} (${v.address}). Confirme presença e veja quem mais vai.`
      : "Veja onde assistir aos jogos da Copa 2026 perto de você.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: url },
        { property: "og:image", content: OG_IMAGE },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: OG_IMAGE },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: v
        ? [
            {
              type: "application/ld+json",
              children: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "LocalBusiness",
                name: v.name,
                address: v.address,
                ...(v.phone ? { telephone: v.phone } : {}),
                geo: {
                  "@type": "GeoCoordinates",
                  latitude: v.lat,
                  longitude: v.lng,
                },
                url,
              }),
            },
          ]
        : [],
    };
  },
  component: VenuePage,
});

function VenuePage() {
  const { id } = useParams({ from: "/venue/$id" });
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: venue, isLoading } = useVenue(id, user?.id);
  const { data: myRsvp } = useMyRsvp(id);
  const toggleRsvp = useToggleRsvp(id);

  const claimVenue = useClaimVenue();

  const [going, setGoing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/venue/${id}`
      : `https://jogonasruas.vercel.app/venue/${id}`;

  const handleShare = useCallback(() => {
    if (!venue) return;
    const title = `Vou assistir aos jogos da Copa 2026 no ${venue.name}!`;
    const text = "Encontrei esse lugar no Jogo nas Ruas. Bora?";
    const url = shareUrl;

    if ("share" in navigator && typeof navigator.share === "function") {
      navigator.share({ title, text, url }).catch(() => {});
    } else {
      navigator.clipboard
        .writeText(`${title}\n${text}\n${url}`)
        .then(() => toast.success("Link copiado!"))
        .catch(() => toast.error("Erro ao copiar link."));
    }
  }, [venue, shareUrl]);

  useEffect(() => {
    if (myRsvp) {
      setGoing(true);
    } else {
      setGoing(false);
    }
  }, [myRsvp]);

  if (isLoading) {
    return (
      <main className="absolute inset-0 bg-background grid place-items-center">
        <div className="animate-pulse text-brasil-navy">carregando…</div>
      </main>
    );
  }

  if (!venue) {
    return (
      <main className="absolute inset-0 bg-brasil-cream flex flex-col items-center justify-center text-center px-6 pb-24">
        <div className="size-20 rounded-full bg-brasil-navy handmade-border-yellow flex items-center justify-center text-3xl mb-4">
          ⚽
        </div>
        <h1 className="font-display text-xl text-brasil-navy mb-2">Local não encontrado</h1>
        <p className="text-sm text-muted-foreground mb-6">Esse local não existe, foi removido ou ainda está pendente de aprovação.</p>
        <Link
          to="/mapa"
          className="rounded-xl bg-brasil-green text-white font-bold px-6 py-3 font-display text-sm tracking-wider"
        >
          VER MAPA
        </Link>
      </main>
    );
  }

  const handleToggle = async (next: boolean) => {
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    setError(null);
    const wasGoing = going;
    setGoing(next);
    try {
      await toggleRsvp.mutateAsync({ going: next, guests: 1 });
      if (next && !wasGoing) {
        // Register for push reminders on first opt-in
        const { requestNotificationPermission } = await import("@/shared/lib/firebase");
        const token = await requestNotificationPermission();
        if (token) {
          const { error: insErr } = await supabase.rpc("upsert_user_fcm_token", {
            p_user_id: user.id,
            p_token: token,
          });
          if (insErr) console.error("upsert_user_fcm_token:", insErr);
          toast.success("Você receberá um lembrete 1h antes do jogo!");
        }
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Erro ao confirmar.";
      setError(message);
      setGoing(wasGoing);
    }
  };

  return (
    <main className="absolute inset-0 overflow-y-auto bg-background pb-28">
      <div className="max-w-md mx-auto px-4 pt-5">
        <VenueDetail
          venue={venue}
          going={going}
          onBack={() => navigate({ to: "/mapa" })}
          onToggleGoing={() => handleToggle(!going)}
          onShare={handleShare}
        />
        <VenuePhotos venueId={id} />
        {user && venue && !venue.claimed_by && user.id !== venue.created_by && (
          <div className="mt-3">
            <button
              onClick={() =>
                claimVenue.mutate(
                  { venueId: id },
                  { onSuccess: () => toast.success("Local reivindicado com sucesso!") },
                )
              }
              disabled={claimVenue.isPending}
              className="w-full rounded-xl border-2 border-brasil-navy/20 bg-card py-3 text-center text-sm font-bold text-brasil-navy hover:bg-brasil-navy/5 transition-colors disabled:opacity-50"
            >
              {claimVenue.isPending ? "Reivindicando…" : "Reivindicar este local"}
            </button>
          </div>
        )}
        {venue?.claimed_by && (
          <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-brasil-navy/50">
            <span className="size-2 rounded-full bg-brasil-green" />
            Local verificado pelo proprietário
          </div>
        )}
        {!user && (
          <div className="mt-3 rounded-2xl bg-brasil-yellow/30 border-2 border-brasil-navy/20 p-3 text-center text-sm">
            <Link to="/login" className="font-bold text-brasil-navy underline">
              entre
            </Link>{" "}
            pra confirmar presença
          </div>
        )}
        {error && <p className="mt-2 text-sm text-red-600 text-center">{error}</p>}
      </div>
    </main>
  );
}
