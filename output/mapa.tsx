import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback, Suspense, lazy } from "react";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { useVenues } from "@/shared/lib/venues";
import { useMapLocation } from "@/features/map/hooks/useMapLocation";
import { VenueList } from "@/features/map/components/VenueList";
import { FilterBar } from "@/features/map/components/FilterBar";
import { RadiusSelector } from "@/features/map/components/RadiusSelector";
import { LocationButton } from "@/features/map/components/LocationButton";
import { AddVenueButton } from "@/features/map/components/AddVenueButton";
import { SearchBar } from "@/features/map/components/SearchBar";
import { VenueCardSkeleton } from "@/features/venues/components/VenueCardSkeleton";
import { FILTERS, DEFAULT_RADIUS, type FilterId } from "@/data/venues";
import type { Venue } from "@/data/venues";
import { Search, X, MapPin } from "lucide-react";
import { LazyAddVenueModal } from "@/features/venues/components/LazyAddVenueModal";

// ✅ FIX: lazy load do MapView — não entra no bundle inicial
const MapView = lazy(() => import("@/features/map/components/MapView").then(m => ({ default: m.MapView })));

function haversine(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export const Route = createFileRoute("/mapa")({
  component: MapaPage,
});

function MapaPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: venues = [], isLoading } = useVenues();
  const { location: userLocation, error: locError, isLocating, centerOnUser } = useMapLocation();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterId>("today");
  const [radius, setRadius] = useState(DEFAULT_RADIUS);
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Array<{ place_id: string; description: string }>>([]);
  const [selectedPlace, setSelectedPlace] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const mapFlyToRef = useRef<((lat: number, lng: number, zoom?: number) => void) | null>(null);

  const filteredVenues = venues.filter((v: Venue) => {
    if (activeFilter === "brazil" && !v.isBrazilMatch) return false;
    if (activeFilter === "screen" && !v.bigScreen) return false;
    if (userLocation) {
      const dist = haversine(userLocation[0], userLocation[1], v.lat, v.lng);
      if (dist > radius) return false;
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      return (
        v.name.toLowerCase().includes(q) ||
        v.match.toLowerCase().includes(q) ||
        v.address.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleSelectVenue = useCallback((id: string) => {
    setActiveId(id);
    const v = venues.find((x: Venue) => x.id === id);
    if (v && mapFlyToRef.current) {
      mapFlyToRef.current(v.lat, v.lng, 16);
    }
  }, [venues]);

  const handleSearch = useCallback(async (q: string) => {
    setQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
      setSelectedPlace(null);
      return;
    }
    setIsSearching(true);
    try {
      // Google Places autocomplete via your existing logic
      const res = await fetch(`/api/places-autocomplete?input=${encodeURIComponent(q)}`);
      const data = await res.json();
      setSearchResults(data.predictions || []);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const handleSelectPlace = useCallback(async (placeId: string) => {
    try {
      const res = await fetch(`/api/places-details?place_id=${placeId}`);
      const data = await res.json();
      const { lat, lng, name } = data.result.geometry.location;
      setSelectedPlace({ lat, lng, name });
      setQuery(name);
      setSearchResults([]);
      if (mapFlyToRef.current) {
        mapFlyToRef.current(lat, lng, 16);
      }
    } catch {
      // ignore
    }
  }, []);

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="relative z-10 px-4 pt-3 pb-2">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="buscar bar, jogo ou bairro"
            aria-label="Buscar bar, jogo ou bairro"
            className="w-full pl-10 pr-10 py-3 rounded-2xl bg-white/95 backdrop-blur border-2 border-brasil-navy shadow-lg text-sm placeholder:text-muted-foreground outline-none"
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-brasil-navy border-t-transparent rounded-full animate-spin" />
          )}
          {selectedPlace && !isSearching && (
            <button
              onClick={() => { setQuery(""); setSelectedPlace(null); setSearchResults([]); }}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Google Places Dropdown */}
        {!selectedPlace && searchResults.length > 0 && (
          <div className="absolute left-4 right-4 mt-1 bg-white rounded-xl shadow-lg border border-brasil-navy/20 overflow-hidden z-20">
            {searchResults.map((place) => (
              <button
                key={place.place_id}
                onClick={() => handleSelectPlace(place.place_id)}
                className="w-full text-left px-4 py-3 text-sm hover:bg-brasil-yellow/20 flex items-center gap-2"
              >
                <MapPin className="w-4 h-4 text-brasil-navy shrink-0" />
                {place.description}
              </button>
            ))}
          </div>
        )}

        {/* Brand pill */}
        <div className="flex justify-center mt-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brasil-navy text-brasil-yellow text-xs font-bold">
            <span>⚽</span>JOGO NAS RUAS<span className="text-brasil-green">·</span> copa 2026
          </div>
        </div>

        {/* Filters */}
        <div className="mt-2">
          <FilterBar
            filters={FILTERS}
            active={activeFilter}
            onChange={setActiveFilter}
          />
        </div>

        {/* Radius */}
        {userLocation && (
          <div className="mt-2">
            <RadiusSelector value={radius} onChange={setRadius} />
          </div>
        )}
      </div>

      {/* Map */}
      <div className="flex-1 relative min-h-0">
        {/* ✅ FIX: Suspense + lazy — MapView só carrega quando necessário */}
        <Suspense fallback={
          <div className="w-full h-full bg-muted animate-pulse flex items-center justify-center">
            <span className="text-brasil-navy font-display">carregando mapa…</span>
          </div>
        }>
          <MapView
            venues={filteredVenues}
            activeId={activeId}
            onSelect={handleSelectVenue}
            center={userLocation || undefined}
            zoom={userLocation ? 14 : 13}
            selectedPlace={selectedPlace}
            onFlyTo={(fn) => { mapFlyToRef.current = fn; }}
          />
        </Suspense>

        {/* Location button */}
        <div className="absolute bottom-4 right-4 z-10">
          <LocationButton onClick={centerOnUser} isLocating={isLocating} />
        </div>

        {/* Add venue button */}
        {user && (
          <div className="absolute bottom-4 left-4 z-10">
            <AddVenueButton onClick={() => setShowAddModal(true)} />
          </div>
        )}
      </div>

      {/* Venue list bottom sheet */}
      <div className="shrink-0 bg-background border-t border-brasil-navy/10 max-h-[40vh] overflow-y-auto">
        {isLoading ? (
          <div className="p-4 space-y-3">
            <VenueCardSkeleton />
            <VenueCardSkeleton />
          </div>
        ) : filteredVenues.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground text-sm">
            Nenhum local encontrado{nuserLocation ? " nessa área" : ""}.
          </div>
        ) : (
          <VenueList
            venues={filteredVenues}
            activeId={activeId}
            onSelect={handleSelectVenue}
          />
        )}
      </div>

      {locError && (
        <div className="absolute bottom-[40vh] left-0 right-0 z-10 px-4">
          <div className="bg-red-50 text-red-600 text-xs px-3 py-2 rounded-xl text-center">
            {locError}
          </div>
        </div>
      )}

      {showAddModal && (
        <LazyAddVenueModal
          open={showAddModal}
          onClose={() => setShowAddModal(false)}
          defaultLocation={userLocation || undefined}
        />
      )}
    </div>
  );
}
