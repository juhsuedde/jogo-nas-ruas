import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Shield, CheckCircle2, XCircle, Loader2, MapPin, Star, StarOff } from "lucide-react";
import { useAuth } from "@/features/auth/hooks/use-auth";
import {
  useIsAdmin,
  usePendingVenues,
  useModerateVenue,
  useAllVenues,
  useSetSponsoredVenue,
} from "@/shared/lib/admin";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Moderação — Jogo nas Ruas" },
      {
        name: "description",
        content: "Painel de moderação para aprovar ou rejeitar locais cadastrados.",
      },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: pendingVenues, isLoading: venuesLoading } = usePendingVenues();
  const { data: allVenues, isLoading: allVenuesLoading } = useAllVenues();
  const moderate = useModerateVenue();
  const setSponsored = useSetSponsoredVenue();
  const [sponsorDays, setSponsorDays] = useState(30);

  if (!user) {
    navigate({ to: "/login", search: { redirectTo: "/admin" } });
    return null;
  }

  if (adminLoading) {
    return (
      <main className="absolute inset-0 overflow-y-auto pb-24">
        <div className="flex items-center justify-center h-full">
          <Loader2 className="size-8 animate-spin text-brasil-navy" />
        </div>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="absolute inset-0 overflow-y-auto pb-24">
        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b-2 border-brasil-navy/10">
          <div className="max-w-md mx-auto flex items-center justify-between p-4">
            <Link
              to="/perfil"
              className="size-10 rounded-full bg-card handmade-border flex items-center justify-center"
              aria-label="Voltar"
            >
              <ArrowLeft className="size-4 text-brasil-navy" />
            </Link>
            <h1 className="font-display text-base text-brasil-navy tracking-wider">MODERAÇÃO</h1>
            <div className="size-10" />
          </div>
        </div>
        <div className="max-w-md mx-auto px-4 pt-20 text-center">
          <Shield className="size-12 mx-auto text-brasil-navy/30 mb-3" />
          <p className="text-brasil-navy/60 font-semibold">Acesso restrito a administradores.</p>
        </div>
      </main>
    );
  }

  function handleApprove(id: string) {
    moderate.mutate(
      { venueId: id, status: "approved" },
      { onSuccess: () => toast.success("Local aprovado!") },
    );
  }

  function handleReject(id: string) {
    moderate.mutate(
      { venueId: id, status: "rejected" },
      { onSuccess: () => toast.success("Local rejeitado.") },
    );
  }

  return (
    <main className="absolute inset-0 overflow-y-auto pb-24">
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b-2 border-brasil-navy/10">
        <div className="max-w-md mx-auto flex items-center justify-between p-4">
          <Link
            to="/perfil"
            className="size-10 rounded-full bg-card handmade-border flex items-center justify-center"
            aria-label="Voltar"
          >
            <ArrowLeft className="size-4 text-brasil-navy" />
          </Link>
          <h1 className="font-display text-base text-brasil-navy tracking-wider">MODERAÇÃO</h1>
          <div className="size-10" />
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 pt-5 space-y-4">
        <p className="text-sm text-brasil-navy/60 font-semibold">
          {pendingVenues?.length ?? 0} local(ns) pendente(s)
        </p>

        {venuesLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="size-8 animate-spin text-brasil-navy" />
          </div>
        ) : !pendingVenues || pendingVenues.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="size-12 mx-auto text-brasil-navy/30 mb-3" />
            <p className="text-brasil-navy/60 font-semibold">Nenhum local pendente de moderação.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingVenues.map((venue) => (
              <div
                key={venue.id}
                className="bg-card rounded-xl handmade-border p-4 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-display text-sm text-brasil-navy truncate">
                      {venue.name}
                    </h3>
                    <p className="text-xs text-brasil-navy/50 mt-0.5 truncate">
                      {venue.address}
                      {venue.neighborhood ? `, ${venue.neighborhood}` : ""}
                      {venue.city_name ? ` — ${venue.city_name}` : ""}
                    </p>
                  </div>
                  <span className="shrink-0 text-[10px] font-bold uppercase text-brasil-yellow bg-brasil-yellow/10 px-2 py-0.5 rounded-full">
                    Pendente
                  </span>
                </div>

                <div className="flex items-center gap-1 text-[11px] text-brasil-navy/50">
                  {venue.has_big_screen && <span>📺 Telão</span>}
                  {venue.has_promotion && <span>🎉 Promoção</span>}
                  {venue.has_parking && <span>🅿️ Estacionamento</span>}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => handleApprove(venue.id)}
                    disabled={moderate.isPending}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-green-600 text-white text-xs font-bold uppercase hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    <CheckCircle2 className="size-4" />
                    Aprovar
                  </button>
                  <button
                    onClick={() => handleReject(venue.id)}
                    disabled={moderate.isPending}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-red-600 text-white text-xs font-bold uppercase hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    <XCircle className="size-4" />
                    Rejeitar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="pt-8">
          <div className="flex items-center gap-2 mb-4">
            <Star className="size-5 text-brasil-yellow" />
            <h2 className="font-display text-sm text-brasil-navy tracking-wider">PINS PATROCINADOS</h2>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <label className="text-xs text-brasil-navy/60">Duração (dias):</label>
            <select
              value={sponsorDays}
              onChange={(e) => setSponsorDays(Number(e.target.value))}
              className="rounded-lg border-2 border-brasil-navy/20 bg-card px-3 py-1.5 text-xs font-semibold text-brasil-navy"
            >
              <option value={7}>7</option>
              <option value={14}>14</option>
              <option value={30}>30</option>
              <option value={60}>60</option>
              <option value={90}>90</option>
            </select>
          </div>

          {allVenuesLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="size-6 animate-spin text-brasil-navy" />
            </div>
          ) : !allVenues || allVenues.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-brasil-navy/60 font-semibold text-xs">Nenhum local aprovado.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {allVenues.map((venue) => {
                const isSponsored = venue.sponsored;
                const expires = venue.sponsored_until
                  ? new Date(venue.sponsored_until)
                  : null;
                const expired = expires && expires < new Date();
                return (
                  <div
                    key={venue.id}
                    className="bg-card rounded-xl handmade-border p-3 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-display text-brasil-navy truncate">
                        {venue.name}
                      </p>
                      <p className="text-[10px] text-brasil-navy/50 truncate">
                        {venue.city_name}
                      </p>
                      {expires && (
                        <p className="text-[10px] text-brasil-navy/40">
                          {expired ? "Expirado" : `Até ${expires.toLocaleDateString("pt-BR")}`}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() =>
                        setSponsored.mutate({
                          venueId: venue.id,
                          sponsored: !isSponsored || expired,
                          days: sponsorDays,
                        })
                      }
                      disabled={setSponsored.isPending}
                      className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-colors disabled:opacity-50 ${
                        isSponsored && !expired
                          ? "bg-brasil-yellow text-brasil-navy"
                          : "bg-brasil-navy/10 text-brasil-navy/50"
                      }`}
                    >
                      {isSponsored && !expired ? (
                        <>
                          <Star className="size-3.5" /> Ativo
                        </>
                      ) : (
                        <>
                          <StarOff className="size-3.5" /> Patrocinar
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
