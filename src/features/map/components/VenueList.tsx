import { VenueCard } from "@/features/venues/components/VenueCard";
import { VenueCardSkeleton } from "@/features/venues/components/VenueCardSkeleton";
import { Link } from "@tanstack/react-router";
import { MapPin } from "lucide-react";
import type { Venue } from "@/data/venues";

interface VenueListProps {
  venues: Venue[];
  loading: boolean;
  activeId: string | null;
  onSelect: (id: string) => void;
}

export function VenueList({ venues, loading, activeId, onSelect }: VenueListProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <VenueCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (venues.length === 0) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="size-16 rounded-full bg-brasil-navy/10 flex items-center justify-center mx-auto">
          <MapPin className="size-7 text-brasil-navy/40" />
        </div>
        <div>
          <p className="text-sm font-bold text-brasil-navy">Nenhum local encontrado</p>
          <p className="text-sm text-muted-foreground mt-1">seja o primeiro a adicionar!</p>
        </div>
        <Link
          to="/add"
          className="inline-flex items-center gap-2 rounded-xl bg-brasil-green text-white font-bold px-6 py-3 text-sm uppercase tracking-wider"
        >
          ADICIONAR LOCAL
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {venues.map((v) => (
        <VenueCard key={v.id} venue={v} active={v.id === activeId} onClick={() => onSelect(v.id)} />
      ))}
    </div>
  );
}
