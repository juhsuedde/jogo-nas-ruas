import type { Venue } from "@/data/venues";
import { Phone, Navigation2, Share2, Users, Tv, Sparkles, MapPin, ArrowLeft } from "lucide-react";

export function VenueDetail({
  venue,
  onBack,
  going,
  guests,
  onToggleGoing,
  onChangeGuests,
  onShare,
}: {
  venue: Venue;
  onBack: () => void;
  going: boolean;
  guests: number;
  onToggleGoing: () => void;
  onChangeGuests: (g: number) => void;
  onShare?: () => void;
}) {
  const count = venue.rsvps + (going ? guests : 0);

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm font-bold text-brasil-navy mb-3"
      >
        <ArrowLeft className="size-4" /> voltar
      </button>

      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-brasil-navy leading-tight">{venue.name}</h1>
          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
            <MapPin className="size-3.5" /> {venue.address}
          </p>
        </div>
        {venue.unverified && (
          <span className="text-[10px] font-bold uppercase px-2 py-1 rounded bg-muted text-muted-foreground shrink-0">
            Não verificado
          </span>
        )}
      </div>

      <div className="mt-4 rounded-2xl bg-secondary/60 border-2 border-brasil-navy/20 p-4">
        <div className="text-xs font-bold uppercase text-brasil-navy/70">Transmissão</div>
        <div className="font-display text-xl text-brasil-navy mt-1">{venue.match}</div>
        <div className="text-sm text-brasil-navy font-bold">Hoje · {venue.matchTime}</div>
        {venue.bigScreen && (
          <div className="flex items-center gap-1.5 text-xs font-bold text-brasil-navy mt-2">
            <Tv className="size-3.5" /> Telão confirmado
          </div>
        )}
      </div>

      <div className="mt-3 rounded-2xl bg-card border-2 border-brasil-navy/20 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="size-5 text-brasil-green" />
          <div>
            <div className="font-display text-2xl text-brasil-navy leading-none">{count}</div>
            <div className="text-xs text-muted-foreground">torcedores confirmados</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {going && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => onChangeGuests(Math.max(1, guests - 1))}
                aria-label="Diminuir número de acompanhantes"
                className="size-7 rounded-full bg-muted font-bold"
              >
                −
              </button>
              <span className="font-display text-base w-5 text-center">{guests}</span>
              <button
                onClick={() => onChangeGuests(guests + 1)}
                aria-label="Aumentar número de acompanhantes"
                className="size-7 rounded-full bg-muted font-bold"
              >
                +
              </button>
            </div>
          )}
          <button
            onClick={onToggleGoing}
            className={`rounded-xl px-4 py-2 font-display text-sm border-2 border-brasil-navy ${
              going ? "bg-brasil-yellow text-brasil-navy" : "bg-brasil-green text-white"
            }`}
          >
            {going ? "Tô indo ✓" : "Tô indo!"}
          </button>
        </div>
      </div>

      {venue.promo && (
        <div className="mt-3 rounded-2xl bg-brasil-yellow/40 border-2 border-brasil-navy/30 p-4 flex items-start gap-2.5">
          <Sparkles className="size-5 text-brasil-navy shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-bold uppercase text-brasil-navy/70">Promoção</div>
            <p className="text-sm text-brasil-navy font-semibold">{venue.promo}</p>
          </div>
        </div>
      )}

      <div className="mt-4 grid grid-cols-3 gap-2">
        {venue.phone && (
          <a
            href={`tel:${venue.phone}`}
            className="rounded-xl bg-card border-2 border-brasil-navy py-3 flex flex-col items-center gap-1 text-xs font-bold text-brasil-navy"
          >
            <Phone className="size-4" /> Ligar
          </a>
        )}
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${venue.lat},${venue.lng}`}
          target="_blank"
          rel="noreferrer"
          className="rounded-xl bg-card border-2 border-brasil-navy py-3 flex flex-col items-center gap-1 text-xs font-bold text-brasil-navy"
        >
          <Navigation2 className="size-4" /> Rotas
        </a>
        <button
          onClick={onShare}
          className="rounded-xl bg-card border-2 border-brasil-navy py-3 flex flex-col items-center gap-1 text-xs font-bold text-brasil-navy"
        >
          <Share2 className="size-4" /> Compartilhar
        </button>
      </div>
    </div>
  );
}
