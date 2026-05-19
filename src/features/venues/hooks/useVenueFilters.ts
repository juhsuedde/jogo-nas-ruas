import { useState, useMemo } from "react";
import type { FilterId, RadiusOption } from "@/data/venues";
import type { Venue } from "@/data/venues";

interface UseVenueFiltersOptions {
  defaultRadius?: RadiusOption;
}

interface UseVenueFiltersReturn {
  filters: Set<FilterId>;
  radius: RadiusOption;
  toggleFilter: (filterId: FilterId) => void;
  setRadius: (radius: RadiusOption) => void;
  getFilteredVenues: (venues: Venue[], userLocation: [number, number] | null) => Venue[];
}

export function useVenueFilters({ defaultRadius = 5 }: UseVenueFiltersOptions = {}): UseVenueFiltersReturn {
  const [filters, setFilters] = useState<Set<FilterId>>(new Set(["today"]));
  const [radius, setRadius] = useState<RadiusOption>(defaultRadius as RadiusOption);

  const toggleFilter = (filterId: FilterId) => {
    setFilters((prev) => {
      const next = new Set(prev);
      if (next.has(filterId)) {
        next.delete(filterId);
      } else {
        next.add(filterId);
      }
      return next;
    });
  };

  const getFilteredVenues = useMemo(() => {
    return (venues: Venue[], userLocation: [number, number] | null): Venue[] => {
      let filtered = venues;

      // Filter by radius if user location is available
      if (userLocation) {
        filtered = filtered.filter((venue) => {
          const distance = calculateDistance(
            userLocation[0],
            userLocation[1],
            venue.lat,
            venue.lng
          );
          return distance <= radius;
        });
      }

      // Filter by active filters
      if (filters.size > 0) {
        filtered = filtered.filter((venue) => {
          // "today" = has match scheduled
          if (filters.has("today") && venue.matchTime) {
            return true;
          }
          // "brasil" = Brazil match
          if (filters.has("brasil") && venue.isBrazilMatch) {
            return true;
          }
          // "telao" = has big screen
          if (filters.has("telao") && venue.bigScreen) {
            return true;
          }
          // "promo" = has promotion
          if (filters.has("promo") && venue.promo) {
            return true;
          }
          return filters.size === 0;
        });
      }

      return filtered;
    };
  }, [filters, radius]);

  return {
    filters,
    radius,
    toggleFilter,
    setRadius,
    getFilteredVenues,
  };
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}