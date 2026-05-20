import { VenueCard } from "@/features/venues/components/VenueCard";
import { VenueCardSkeleton } from "@/features/venues/components/VenueCardSkeleton";
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
      <div className="text-center py-8">
        <p className="text-4xl mb-2">😶‍🌫️</p>
        <p className="text-sm text-muted-foreground">
          Nenhum local com esses filtros. Que tal cadastrar um?
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {venues.map((v) => (
        <VenueCard
          key={v.id}
          venue={v}
          isActive={v.id === activeId}
          onClick={() => onSelect(v.id)}
        />
      ))}
    </div>
  );
}
