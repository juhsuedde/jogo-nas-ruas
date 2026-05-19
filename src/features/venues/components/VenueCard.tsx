import type { Venue } from "@/data/venues";
import { Users, Tv, Sparkles, MapPin } from "lucide-react";

export function VenueCard({
  venue,
  active,
  onClick,
}: {
  venue: Venue;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-2xl bg-card p-4 transition-all ${
        active ? "handmade-border-yellow" : "handmade-border"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-display text-lg text-brasil-navy truncate">{venue.name}</h3>
            {venue.unverified && (
              <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
                Novo
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
            <MapPin className="size-3 shrink-0" /> {venue.address}
          </p>
        </div>
        <div className="flex flex-col items-center shrink-0 rounded-xl bg-brasil-green text-white px-2.5 py-1.5">
          <Users className="size-3.5" />
          <span className="font-display text-sm leading-none mt-1">{venue.rsvps}</span>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2 flex-wrap">
        <span
          className={`text-xs font-bold px-2.5 py-1 rounded-full ${
            venue.isBrazilMatch ? "bg-secondary text-brasil-navy" : "bg-muted text-foreground"
          }`}
        >
          {venue.matchTime} · {venue.match}
        </span>
        {venue.bigScreen && (
          <span className="text-xs font-bold text-brasil-navy flex items-center gap-1">
            <Tv className="size-3" /> Telão
          </span>
        )}
      </div>

      {venue.promo && (
        <div className="mt-3 flex items-start gap-2 text-xs bg-secondary/50 rounded-lg px-2.5 py-2 border border-brasil-navy/15">
          <Sparkles className="size-3.5 text-brasil-navy shrink-0 mt-px" />
          <span className="text-brasil-navy font-semibold">{venue.promo}</span>
        </div>
      )}
    </button>
  );
}
