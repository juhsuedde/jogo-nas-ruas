import { VenueCard } from "@/features/venues/components/VenueCard";
import { VenueCardSkeleton } from "@/features/venues/components/VenueCardSkeleton";
import type { Venue } from "@/data/venues";

interface VenueListProps {
  venues: Venue[];
  activeId: string | null;
  onSelect: (id: string) => void;
  isLoading: boolean;
}

export function VenueList({ venues, activeId, onSelect, isLoading }: VenueListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3 px-4 pb-4">
        <VenueCardSkeleton />
        <VenueCardSkeleton />
        <VenueCardSkeleton />
      </div>
    );
  }

  if (venues.length === 0) {
    return (
      <div className="px-4 pb-4 text-center">
        <p className="text-brasil-navy/50 text-sm">Nenhum local encontrado nessa área.</p>
        <p className="text-brasil-navy/40 text-xs mt-1">Tente aumentar o raio de busca.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 px-4 pb-4">
      {venues.map((venue) => (
        <VenueCard
          key={venue.id}
          venue={venue}
          active={venue.id === activeId}
          onClick={() => onSelect(venue.id)}
        />
      ))}
    </div>
  );
}