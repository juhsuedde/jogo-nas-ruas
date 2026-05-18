import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, lazy, Suspense, useEffect, useRef } from "react";
import { Plus, Search, MapPin, Loader2 } from "lucide-react";
import {
  FILTERS,
  type FilterId,
  RADIUS_OPTIONS,
  type RadiusOption,
  DEFAULT_RADIUS,
} from "@/data/venues";
import { BottomSheet } from "@/components/BottomSheet";
import { VenueCard } from "@/components/VenueCard";
import { VenueCardSkeleton } from "@/components/VenueCardSkeleton";
import { ClientOnly } from "@/components/ClientOnly";
import { BottomNav } from "@/components/BottomNav";
import { useVenues } from "@/lib/venues";
import { useAuth } from "@/hooks/use-auth";
import { searchPlaces, getPlaceDetails, type GooglePlace } from "@/lib/google-places";

const MapView = lazy(() => import("@/components/MapView").then((m) => ({ default: m.MapView })));

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function getZoomForRadius(radius: RadiusOption): number {
  switch (radius) {
    case 1:
      return 15;
    case 3:
      return 14;
    case 5:
      return 13;
    case 10:
      return 12;
    case 20:
      return 11;
    default:
      return 13;
  }
}

export const Route = createFileRoute("/mapa")({
  head: () => {
    const url = "https://jogonasruas.lovable.app/mapa";
    const title = "Mapa da Copa 2026 — Jogo nas Ruas";
    const description =
      "Encontre bares, restaurantes e praças transmitindo a Copa 2026 perto de você.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:url", content: url },
      ],
      links: [{ rel: "canonical", href: url }],
    };
  },
  component: MapPage,
});

function MapPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const initials = user?.email?.slice(0, 2).toUpperCase() ?? "LA";
  const [active, setActive] = useState<string | null>(null);
  const [filters, setFilters] = useState<Set<FilterId>>(new Set(["today"]));
  const [query, setQuery] = useState("");
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [radius, setRadius] = useState<RadiusOption>(DEFAULT_RADIUS);
  const [searchResults, setSearchResults] = useState<GooglePlace[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<GooglePlace | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { data: allVenues = [], isLoading: loading } = useVenues();

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.length < 2 || selectedPlace) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      const results = await searchPlaces(query);
      setSearchResults(results);
      setIsSearching(false);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, selectedPlace]);

  const handleSelectPlace = async (place: GooglePlace) => {
    setIsSearching(true);
    const details = await getPlaceDetails(place.place_id);
    setIsSearching(false);
    if (details) {
      setSelectedPlace(details);
      setQuery(details.name);
      setSearchResults([]);
    }
  };

  const clearSearch = () => {
    setQuery("");
    setSelectedPlace(null);
    setSearchResults([]);
  };

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
    );
  }, []);

  const toggle = (id: FilterId) => {
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
    <main className="absolute inset-0 overflow-hidden">
      <h1 className="sr-only">Mapa da Copa 2026 — onde assistir aos jogos</h1>
      <ClientOnly fallback={<div className="absolute inset-0 bg-muted animate-pulse" />}>
        <Suspense fallback={<div className="absolute inset-0 bg-muted animate-pulse" />}>
          <MapView
            venues={venues}
            activeId={active}
            onSelect={(id) => setActive(id)}
            center={mapCenter}
            zoom={mapZoom}
            selectedPlace={selectedPlace}
          />
        </Suspense>
      </ClientOnly>

      {/* Top bar */}
      <div className="absolute top-0 inset-x-0 z-[600] p-3 pt-4 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="flex-1 rounded-full bg-card handmade-border flex items-center gap-2 px-4 py-2.5 relative">
            <Search className="size-4 text-brasil-navy shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="buscar bar, jogo ou bairro"
              aria-label="Buscar bar, jogo ou bairro"
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-brasil-navy/50"
            />
            {isSearching && <Loader2 className="size-4 text-brasil-navy animate-spin shrink-0" />}
            {selectedPlace && !isSearching && (
              <button
                onClick={clearSearch}
                className="size-4 text-brasil-navy/50 hover:text-brasil-navy shrink-0"
                aria-label="Limpar busca"
              >
                ✕
              </button>
            )}
            <Link
              to={user ? "/perfil" : "/login"}
              aria-label="Meu perfil"
              className="size-7 rounded-full bg-brasil-green flex items-center justify-center text-white font-display text-[11px] shrink-0"
            >
              {initials}
            </Link>

            {/* Google Places Dropdown */}
            {!selectedPlace && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#0A2540] rounded-2xl overflow-hidden border-2 border-brasil-yellow/30 shadow-xl z-[700] max-h-64 overflow-y-auto">
                {searchResults.map((place) => (
                  <button
                    key={place.place_id}
                    onClick={() => handleSelectPlace(place)}
                    className="w-full flex items-center gap-3 p-3 text-left text-white hover:bg-brasil-yellow/20 transition-colors border-b border-white/10 last:border-b-0"
                  >
                    <MapPin className="size-4 text-brasil-yellow shrink-0" />
                    <div className="min-w-0">
                      <p className="font-bold text-sm truncate">{place.name}</p>
                      <p className="text-xs text-white/60 truncate">{place.formatted_address}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <Link
            to="/add"
            className="size-12 rounded-full bg-brasil-yellow handmade-border flex items-center justify-center shrink-0"
            aria-label="Cadastrar local"
          >
            <Plus className="size-5 text-brasil-navy" strokeWidth={3} />
          </Link>
        </div>

        <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-brasil-navy px-3 py-1 pointer-events-auto">
          <span className="text-brasil-yellow font-display text-xs tracking-wider">
            ⚽ JOGO NAS RUAS
          </span>
          <span className="text-white/60 text-[10px]">· copa 2026</span>
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto pb-2 -mx-3 px-3 pointer-events-auto scrollbar-none">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              className="chip"
              data-active={filters.has(f.id)}
              onClick={() => toggle(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {userLocation && (
          <div className="mt-2 flex items-center gap-2 px-2 py-1 bg-card rounded-lg border pointer-events-auto">
            <MapPin className="size-4 text-brasil-green" />
            <span className="text-xs text-muted-foreground">Próximo</span>
            <div className="flex gap-1">
              {RADIUS_OPTIONS.map((r) => (
                <button
                  key={r}
                  className={`text-xs px-2 py-0.5 rounded ${
                    radius === r ? "bg-brasil-green text-white" : "bg-muted text-muted-foreground"
                  }`}
                  onClick={() => setRadius(r)}
                >
                  {r}km
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <BottomSheet>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-display text-lg text-brasil-navy">onde a galera tá</h2>
          <span className="text-xs font-bold text-muted-foreground">{venues.length} locais</span>
        </div>
        <div className="space-y-3 pb-20">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => <VenueCardSkeleton key={i} />)
            : venues.map((v) => (
                <VenueCard
                  key={v.id}
                  venue={v}
                  active={active === v.id}
                  onClick={() => {
                    setActive(v.id);
                    navigate({ to: "/venue/$id", params: { id: v.id } });
                  }}
                />
              ))}
          {venues.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
              <div className="text-4xl mb-2">😶‍🌫️</div>
              <p className="text-sm">Nenhum local com esses filtros. Que tal cadastrar um?</p>
            </div>
          )}
        </div>
      </BottomSheet>

      <BottomNav />
    </main>
  );
}
