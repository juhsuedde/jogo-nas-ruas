import { createFileRoute, useNavigate, useParams, Link } from "@tanstack/react-router";
import { useState, useEffect, useCallback } from "react";
import { VenueDetail } from "@/components/VenueDetail";
import { BottomNav } from "@/components/BottomNav";
import { useVenue, useToggleRsvp, useMyRsvp } from "@/lib/venues";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { requestNotificationPermission } from "@/lib/firebase";
import { supabase } from "@/lib/supabase";


export const Route = createFileRoute("/venue/$id")({
  loader: async ({ params }) => {
    const { data } = await supabase
      .from("venues")
      .select("id,name,address,city,phone,lat,lng,match,match_time")
      .eq("id", params.id)
      .maybeSingle();
    return { venueMeta: data };
  },
  head: ({ params, loaderData }) => {
    const v = loaderData?.venueMeta as
      | {
          name: string;
          address: string;
          city: string;
          phone: string | null;
          lat: number;
          lng: number;
          match: string;
          match_time: string;
        }
      | null
      | undefined;
    const url = `https://jogonasruas.lovable.app/venue/${params.id}`;
    const title = v
      ? `${v.name} — ${v.match} ao vivo | Jogo nas Ruas`
      : "Local — Jogo nas Ruas";
    const description = v
      ? `Assista ${v.match} no ${v.name} (${v.address}). Confirme presença e veja quem mais vai.`
      : "Veja onde assistir aos jogos da Copa 2026 perto de você.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: url },
        { property: "og:type", content: "article" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
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
                addressLocality: v.city,
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
  const { data: venue, isLoading } = useVenue(id);
  const { data: myRsvp } = useMyRsvp(id);
  const toggleRsvp = useToggleRsvp(id);

  const [going, setGoing] = useState(false);
  const [guests, setGuests] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/venue/${id}`
    : `https://jogonasruas.lovable.app/venue/${id}`;

  const handleShare = useCallback(() => {
    if (!venue) return;
    const title = `Vou assistir ${venue.match} no ${venue.name}!`;
    const text = "Encontrei esse lugar no Jogo nas Ruas. Bora?";
    const url = shareUrl;

    if ((navigator as any).share) {
      (navigator as any)
        .share({ title, text, url })
        .catch(() => {});
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
      setGuests(myRsvp.guests ?? 1);
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
      <main className="absolute inset-0 bg-background grid place-items-center p-6">
        <p className="font-display text-xl text-brasil-navy text-center">
          local não encontrado
        </p>
      </main>
    );
  }

  const handleToggle = async (next: boolean, nextGuests: number) => {
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    setError(null);
    const wasGoing = going;
    setGoing(next);
    setGuests(nextGuests);
    try {
      await toggleRsvp.mutateAsync({ going: next, guests: nextGuests });
      if (next && !wasGoing) {
        // Register for push reminders on first opt-in
        const token = await requestNotificationPermission();
        if (token) {
          const { error: insErr } = await supabase
            .from("fcm_tokens")
            .upsert(
              { user_id: user.id, token },
              { onConflict: "token" },
            );
          if (insErr) console.error("fcm_tokens upsert:", insErr);
          toast.success("Você receberá um lembrete 1h antes do jogo!");
        }
      }
    } catch (e: any) {
      setError(e?.message ?? "Erro ao confirmar.");
      setGoing(!next);
    }
  };

  return (
    <main className="absolute inset-0 overflow-y-auto bg-background pb-28">
      <div className="max-w-md mx-auto px-4 pt-5">
        <VenueDetail
          venue={venue}
          going={going}
          guests={guests}
          onBack={() => navigate({ to: "/mapa" })}
          onToggleGoing={() => handleToggle(!going, guests)}
          onChangeGuests={(g) => handleToggle(true, Math.max(1, g))}
          onShare={handleShare}
        />
        {!user && (
          <div className="mt-3 rounded-2xl bg-brasil-yellow/30 border-2 border-brasil-navy/20 p-3 text-center text-sm">
            <Link to="/login" className="font-bold text-brasil-navy underline">
              entre
            </Link>{" "}
            pra confirmar presença
          </div>
        )}
        {error && (
          <p className="mt-2 text-sm text-red-600 text-center">{error}</p>
        )}
      </div>
      <BottomNav />
    </main>
  );
}
