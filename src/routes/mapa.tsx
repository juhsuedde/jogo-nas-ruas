import { useState, useEffect, useRef, useCallback, useMemo, lazy, Suspense } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Search, X, Loader2, Navigation, MapPin } from "lucide-react";

const MapView = lazy(() =>
  import("@/features/map/components/MapView").then((m) => ({ default: m.MapView })),
);

import { FilterBar } from "@/features/map/components/FilterBar";
import { RadiusSelector } from "@/features/map/components/RadiusSelector";
import { VenueList } from "@/features/map/components/VenueList";
import { BottomSheet } from "@/components/BottomSheet";
import { LocationButton } from "@/features/map/components/LocationButton";

import { useMapLocation } from "@/features/map/hooks/useMapLocation";
import { useVenues, useAddVenue } from "@/shared/lib/venues";
import { useMatches } from "@/shared/lib/matches";
import { searchPlaces, getPlaceDetails } from "@/shared/lib/google-places";
import { calculateDistance, getZoomForRadius } from "@/shared/lib/utils";
import { toast } from "sonner";
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
      {
        name: "description",
        content: "Encontre bares e locais para assistir aos jogos da Copa 2026.",
      },
    ],
  }),
  component: MapaPage,
});

function MapaPage() {
  const navigate = useNavigate();
  const [activeId, setActive] = useState<string | null>(null);
  const [filters, setFilters] = useState<Set<FilterId>>(new Set(["today"]));
  const [query, setQuery] = useState("");
  const [radius, setRadius] = useState(DEFAULT_RADIUS);
  const [searchResults, setSearchResults] = useState<GooglePlace[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<GooglePlace | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isBottomSheetMinimized, setIsBottomSheetMinimized] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flyToFnRef = useRef<((lat: number, lng: number, zoom?: number) => void) | null>(null);
  const { data: allVenues = [], isLoading: loading } = useVenues();
  const queryClient = useQueryClient();

  const {
    location: userLocation,
    error: locationError,
    isLocating,
    centerOnUser,
  } = useMapLocation({
    onLocationChange: (loc) => flyToFnRef.current?.(loc[0], loc[1], 15),
  });

  const addVenue = useAddVenue();
  const { data: dbMatches = [] } = useMatches();

  const handleAddVenue = async (venue: {
    name: string;
    address: { title: string; subtitle: string; lat: number; lng: number; placeId: string };
    perks: string[];
    matches: string[];
    googlePlaceId: string;
  }) => {
    try {
      const parts = venue.address.subtitle?.split(",") ?? [];
      const city = parts[0]?.trim() ?? "";
      const state = parts[1]?.trim() ?? "SP";

      await addVenue.mutateAsync({
        name: venue.name.trim(),
        address: venue.address.title,
        lat: venue.address.lat,
        lng: venue.address.lng,
        city: city,
        neighborhood: null,
        state: state,
        hasBigScreen: venue.perks.includes("big-screen"),
        hasPromotion: venue.perks.includes("promo"),
        hasParking: venue.perks.includes("parking"),
        promotions: venue.perks.includes("promo") ? "Tem promoção" : undefined,
        matchIds: venue.matches,
        showsAllMatches: venue.matches.length === 0,
      });

      queryClient.refetchQueries({ queryKey: ["venues"], exact: false });
      queryClient.refetchQueries({ queryKey: ["profile-data"], exact: false });

      setShowAddModal(false);
      toast.success("Local cadastrado com sucesso!");

      if (venue.address.lat && venue.address.lng) {
        flyToFnRef.current?.(venue.address.lat, venue.address.lng, 16);
      }
    } catch (err) {
      console.error("Failed to create venue:", err);
      toast.error(err instanceof Error ? err.message : "Erro ao cadastrar local. Tente novamente.");
    }
  };

  const clearSearch = useCallback(() => {
    setSelectedPlace(null);
    setQuery("");
    setSearchResults([]);
  }, []);

  const handleSelectPlace = useCallback(async (place: GooglePlace) => {
    if (place.isLocalVenue) {
      setSelectedPlace(place);
      setQuery(place.name);
      setSearchResults([]);
      return;
    }
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
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const lowerQuery = query.toLowerCase();

        const localMatches = allVenues
          .filter(
            (v) =>
              v.name.toLowerCase().includes(lowerQuery) ||
              v.address.toLowerCase().includes(lowerQuery) ||
              v.city.toLowerCase().includes(lowerQuery),
          )
          .slice(0, 5)
          .map(
            (v) =>
              ({
                place_id: v.id,
                name: v.name,
                formatted_address: v.address,
                lat: v.lat,
                lng: v.lng,
                types: ["establishment"],
                isLocalVenue: true,
              }) as GooglePlace & { isLocalVenue: true },
          );

        if (localMatches.length > 0) {
          setSearchResults(localMatches);
          setIsSearching(false);
          return;
        }

        const results = await searchPlaces(query, userLocation);
        setSearchResults(results);
      } catch (err) {
        console.error("Search failed", err);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [query, selectedPlace, userLocation]);

  const toggle = (id: string) => {
    const fid = id as FilterId;
    const next = new Set(filters);
    if (next.has(fid)) {
      next.delete(fid);
    } else {
      next.add(fid);
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
      <div className="flex-1 relative" onClick={() => setIsBottomSheetMinimized(true)}>
        <ClientOnly>
          <Suspense
            fallback={
              <div className="h-full flex items-center justify-center bg-brasil-cream">
                <div className="text-center">
                  <Loader2 className="size-8 text-brasil-navy animate-spin mx-auto mb-2" />
                  <p className="text-sm text-brasil-navy/60">carregando mapa...</p>
                </div>
              </div>
            }
          >
            <MapView
              venues={venues}
              activeId={activeId}
              onSelect={setActive}
              center={mapCenter}
              zoom={mapZoom}
              selectedPlace={selectedPlace}
              onFlyTo={(fn) => {
                flyToFnRef.current = fn;
              }}
            />
          </Suspense>
        </ClientOnly>

        {/* Location error toast */}
        {locationError && (
          <div className="absolute top-4 left-4 right-4 z-[1000] bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 flex items-center gap-2">
            <MapPin className="w-4 h-4 shrink-0" />
            {locationError}
          </div>
        )}
      </div>

      {/* Location button — floats above bottom sheet, bottom-right */}
      <div className="absolute bottom-[16vh] right-4 z-[499]">
        <LocationButton onClick={centerOnUser} isLocating={isLocating} />
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
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
          )}
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
                  <p className="text-xs text-muted-foreground truncate">
                    {place.formatted_address}
                  </p>
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
      <BottomSheet
        minimized={isBottomSheetMinimized}
        onToggle={() => setIsBottomSheetMinimized(!isBottomSheetMinimized)}
      >
        <div className="pb-2">
          <h2 className="font-display text-lg text-brasil-navy mb-1">onde a galera tá</h2>
          <p className="text-sm text-muted-foreground mb-3">{venues.length} locais</p>
        </div>
        <VenueList
          venues={venues}
          loading={loading}
          activeId={activeId}
          onSelect={(id) => {
            setActive(id);
            navigate({ to: "/venue/$id", params: { id } });
          }}
        />
      </BottomSheet>
    </div>
  );
}
