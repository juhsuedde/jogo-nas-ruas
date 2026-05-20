import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Search, X, Loader2, Navigation, MapPin } from "lucide-react";
import { MapView } from "@/features/map/components/MapView";
import { FilterBar } from "@/features/map/components/FilterBar";
import { RadiusSelector } from "@/features/map/components/RadiusSelector";
import { VenueList } from "@/features/map/components/VenueList";
import { LocationButton } from "@/features/map/components/LocationButton";
import { AddVenueButton } from "@/features/map/components/AddVenueButton";
import { useVenues } from "@/features/venues/hooks/useVenues";
import { useCreateVenue } from "@/features/venues/hooks/useCreateVenue";
import { searchPlaces, getPlaceDetails } from "@/shared/lib/google-places";
import { calculateDistance, getZoomForRadius } from "@/shared/lib/utils";
import type { GooglePlace } from "@/shared/lib/google-places";
import { ClientOnly } from "@/shared/components/ClientOnly";

const FILTERS = [
  { id: "today" as const, label: "Hoje" },
  { id: "brazil" as const, label: "Jogos do Brasil" },
  { id: "screen" as const, label: "Telão" },
];

const RADIUS_OPTIONS = [1, 3, 5, 10];
const DEFAULT_RADIUS = 5;

type FilterId = (typeof FILTERS)[number]["id"];

export const Route = createFileRoute("/mapa")({
  head: () => ({
    meta: [
      { title: "Mapa da Copa 2026 — Jogo nas Ruas" },
      { name: "description", content: "Encontre bares e locais para assistir aos jogos da Copa 2026." },
    ],
  }),
  component: MapaPage,
});

function MapaPage() {
  const navigate = useNavigate();
  const [activeId, setActive] = useState<string | null>(null);
  const [filters, setFilters] = useState<Set<FilterId>>(new Set(["today"]));
  const [query, setQuery] = useState("");
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [radius, setRadius] = useState(DEFAULT_RADIUS);
  const [searchResults, setSearchResults] = useState<GooglePlace[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<GooglePlace | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flyToFnRef = useRef<((lat: number, lng: number, zoom?: number) => void) | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const { data: allVenues = [], isLoading: loading } = useVenues();
  const queryClient = useQueryClient();

  const createVenue = useCreateVenue();

  const handleCenterOnUser = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocalização não suportada");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation([latitude, longitude]);
        setLocationError(null);
        flyToFnRef.current?.(latitude, longitude, 15);
        setIsLocating(false);
      },
      (error) => {
        setIsLocating(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError("Permita o acesso à localização");
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError("GPS indisponível");
            break;
          case error.TIMEOUT:
            setLocationError("Tempo esgotado. Tente novamente.");
            break;
          default:
            setLocationError("Erro ao obter localização");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  const handleAddVenue = async (venue: {
    name: string;
    address: any;
    perks: string[];
    matches: string[];
    googlePlaceId: string;
  }) => {
    try {
      await createVenue.mutateAsync(venue);
      setShowAddModal(false);
      if (venue.address.lat && venue.address.lng) {
        flyToFnRef.current?.(venue.address.lat, venue.address.lng, 16);
      }
    } catch (err) {
      console.error("Failed to create venue:", err);
    }
  };

  const clearSearch = useCallback(() => {
    setSelectedPlace(null);
    setQuery("");
    setSearchResults([]);
  }, []);

  const handleSelectPlace = useCallback(async (place: GooglePlace) => {
    setSelectedPlace(place);
    setQuery(place.name);
    setSearchResults([]);
    try {
      const details = await getPlaceDetails(place.place_id);
      if (details) setSelectedPlace(details);
    } catch (err) {
      console.error("Failed to load place details", err);
    }
  }, []);

  useEffect(() => {
    if (selectedPlace) return;
    if (!query || query.trim().length < 3) {
      setSearchResults([]);
      return;
    }
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchPlaces(query, userLocation);
        setSearchResults(results);
      } catch (err) {
        console.error("Search failed", err);
      } finally {
        setIsSearching(false);
      }
    }, 350);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [query, selectedPlace, userLocation]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError("Geolocalização não suportada");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation([position.coords.latitude, position.coords.longitude]);
        setLocationError(null);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 5000 }
    );
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setUserLocation([position.coords.latitude, position.coords.longitude]);
        setLocationError(null);
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError("Permissão negada");
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError("Localização indisponível");
            break;
          case error.TIMEOUT:
            setLocationError("Tempo esgotado");
            break;
          default:
            setLocationError("Erro desconhecido");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  const toggle = (id: string) => {
    const fid = id as FilterId;
    const next = new Set(filters);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setFilters(next);
  };

  const venues = useMemo(() => {
    return allVenues.filter((v) => {
      if (filters.has("brazil") && !v.isBrazilMatch) return false;
      if (filters.has("screen") && !v.bigScreen) return false;
      if (query && !`${v.name} ${v.address} ${v.match}`.toLowerCase().includes(query.toLowerCase()))
        return false;
      if (userLocation) {
        const distance = calculateDistance(userLocation[0], userLocation[1], v.lat, v.lng);
        if (distance > radius) return false;
      }
      return true;
    });
  }, [allVenues, filters, query, userLocation, radius]);

  const mapCenter = userLocation ?? undefined;
  const mapZoom = userLocation ? getZoomForRadius(radius) : undefined;

  return (
    <div className="h-full flex flex-col relative">
      {/* Map */}
      <div className="flex-1 relative">
        <ClientOnly>
          <MapView
            venues={venues}
            activeId={activeId}
            onSelect={setActive}
            center={mapCenter}
            zoom={mapZoom}
            selectedPlace={selectedPlace}
            onFlyTo={(fn) => { flyToFnRef.current = fn; }}
          />
        </ClientOnly>

        {/* Location button */}
        <div className="absolute bottom-4 right-4 z-[1000]">
          <LocationButton onClick={handleCenterOnUser} isLocating={isLocating} />
        </div>

        {/* Location error toast */}
        {locationError && (
          <div className="absolute top-4 left-4 right-4 z-[1000] bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 flex items-center gap-2">
            <MapPin className="w-4 h-4 shrink-0" />
            {locationError}
          </div>
        )}
      </div>

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-[1000] p-4 space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="buscar bar, jogo ou bairro"
            aria-label="Buscar bar, jogo ou bairro"
            className="w-full pl-10 pr-10 py-3 rounded-2xl bg-white/95 backdrop-blur border-2 border-brasil-navy shadow-lg text-sm placeholder:text-muted-foreground outline-none"
          />
          {isSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />}
          {selectedPlace && !isSearching && (
            <button onClick={clearSearch} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Google Places Dropdown */}
        {!selectedPlace && searchResults.length > 0 && (
          <div className="bg-white/95 backdrop-blur rounded-2xl border-2 border-brasil-navy shadow-lg overflow-hidden">
            {searchResults.map((place) => (
              <button
                key={place.place_id}
                onClick={() => handleSelectPlace(place)}
                className="w-full text-left px-4 py-3 hover:bg-brasil-cream flex items-center gap-3 border-b border-border last:border-0"
              >
                <MapPin className="w-4 h-4 text-brasil-navy shrink-0" />
                <div className="min-w-0">
                  <p className="font-bold text-sm text-brasil-navy truncate">{place.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{place.formatted_address}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Brand pill */}
        <div className="inline-flex items-center gap-2 bg-brasil-navy text-white rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider">
          <span>⚽</span>
          <span>JOGO NAS RUAS</span>
          <span className="text-brasil-yellow">· copa 2026</span>
        </div>

        {/* Filters */}
        <FilterBar filters={filters} options={FILTERS} onToggle={toggle} />

        {/* Radius */}
        {userLocation && (
          <RadiusSelector radius={radius} options={RADIUS_OPTIONS} onChange={setRadius} />
        )}
      </div>

      {/* Venue list bottom sheet */}
      <div className="shrink-0 bg-white rounded-t-3xl border-t-2 border-brasil-navy shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
        <div className="p-4">
          <div className="w-12 h-1 bg-muted rounded-full mx-auto mb-4" />
          <h2 className="font-display text-lg text-brasil-navy mb-1">onde a galera tá</h2>
          <p className="text-sm text-muted-foreground mb-3">{venues.length} locais</p>

          <VenueList
            venues={venues}
            loading={loading}
            activeId={activeId}
            onSelect={(id) => {
              setActive(id);
              navigate({ to: "/venue/$id", params: { id } });
            }}
          />
        </div>
      </div>

      {/* Add venue button */}
      <AddVenueButton onClick={() => setShowAddModal(true)} />
    </div>
  );
}