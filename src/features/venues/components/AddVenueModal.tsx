import { useState, useEffect } from "react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Search, MapPin, Star, Loader2, X, Tv, Tag, Car } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/shared/lib/supabase";
import { useMatches } from "@/shared/lib/matches";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";

const markerIcon = L.divIcon({
  className: "",
  html: `<div style="width:24px;height:24px;background:#2E7D32;border:3px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// ─── Types ───────────────────────────────────────────────────────────────────
interface PlaceSuggestion {
  placeId: string;
  title: string;
  subtitle: string;
}

interface Address {
  title: string;
  subtitle: string;
  placeId: string;
  lat: number;
  lng: number;
}

interface GooglePlaceDetails {
  name: string;
  photoUrl?: string;
  rating?: number;
  phone?: string;
  website?: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────
const PERKS = [
  { id: "big-screen", label: "Tem Telão", icon: Tv },
  { id: "promo", label: "Tem Promoção", icon: Tag },
  { id: "parking", label: "Tem Estacionamento", icon: Car },
];

// ─── Component ───────────────────────────────────────────────────────────────
interface AddVenueModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (venue: {
    name: string;
    address: Address;
    perks: string[];
    matches: string[];
    googlePlaceId: string;
  }) => void;
}

export function AddVenueModal({ open, onOpenChange, onSubmit }: AddVenueModalProps) {
  const [step, setStep] = useState(1);
  const [query, setQuery] = useState("");
  const [address, setAddress] = useState<Address | null>(null);
  const [googlePlace, setGooglePlace] = useState<GooglePlaceDetails | null>(null);
  const [placeSuggestions, setPlaceSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [perks, setPerks] = useState<Set<string>>(new Set());
  const [matches, setMatches] = useState<Set<string>>(new Set());
  const [photoError, setPhotoError] = useState(false);
  const { data: dbMatches = [], isLoading: matchesLoading } = useMatches();

  useEffect(() => {
    if (open) {
      setStep(1);
      setQuery("");
      setAddress(null);
      setGooglePlace(null);
      setPlaceSuggestions([]);
      setIsSearching(false);
      setIsLoadingDetails(false);
      setSearchError(null);
      setName("");
      setPerks(new Set());
      setMatches(new Set());
    }
  }, [open]);

  useEffect(() => {
    if (googlePlace?.name && !name) setName(googlePlace.name);
    setPhotoError(false);
  }, [googlePlace, name]);

  useEffect(() => {
    if (query.length < 2) {
      setPlaceSuggestions([]);
      return;
    }
    const timer = setTimeout(() => handleSearch(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  async function handleSearch(q: string) {
    setIsSearching(true);
    setSearchError(null);
    try {
      let lat: number | undefined;
      let lng: number | undefined;
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000,
          });
        });
        lat = position.coords.latitude;
        lng = position.coords.longitude;
      } catch {
        // Location unavailable
      }
      const { data, error } = await supabase.functions.invoke("google-places", {
        body: { action: "search", query: q, lat, lng, radius: 8000 },
      });
      if (error) throw error;
      const places = data?.places || [];
      setPlaceSuggestions(
        places.map((p: { place_id: string; name: string; formatted_address: string }) => ({
          placeId: p.place_id,
          title: p.name,
          subtitle: p.formatted_address,
        })),
      );
    } catch {
      setSearchError("Não foi possível buscar locais. Tente novamente.");
      setPlaceSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  }

  async function handleSelectPlace(suggestion: PlaceSuggestion) {
    setAddress({
      title: suggestion.title,
      subtitle: suggestion.subtitle,
      placeId: suggestion.placeId,
      lat: 0,
      lng: 0,
    });
    setPlaceSuggestions([]);
    setQuery("");
    setIsLoadingDetails(true);
    try {
      const { data, error } = await supabase.functions.invoke("google-places", {
        body: { action: "details", placeId: suggestion.placeId },
      });
      if (error) throw error;
      const place = data?.place;
      if (place) {
        setGooglePlace({
          name: place.name,
          photoUrl: place.photoUrl,
          rating: place.rating,
          phone: place.phone,
          website: place.website,
        });
        if (place.name) setName(place.name);
        if (place.lat && place.lng) {
          setAddress((prev) => (prev ? { ...prev, lat: place.lat, lng: place.lng } : prev));
        }
      }
    } catch {
      toast.error("Erro ao carregar detalhes. Usando informações básicas do endereço.");
    } finally {
      setIsLoadingDetails(false);
    }
  }

  function togglePerk(id: string) {
    setPerks((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleMatch(id: string) {
    setMatches((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleNext() {
    if (step === 1) {
      if (!address) {
        toast.error("Selecione um local");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!name.trim()) {
        toast.error("Nome do local é obrigatório");
        return;
      }
      setStep(3);
    }
  }

  function handleBack() {
    if (step > 1) setStep((s) => s - 1);
  }

  function handleSubmit() {
    if (!address || !name.trim()) return;
    onSubmit({
      name: name.trim(),
      address,
      perks: Array.from(perks),
      matches: Array.from(matches),
      googlePlaceId: address.placeId,
    });
    onOpenChange(false);
    toast.success("Local cadastrado com sucesso!");
  }

  return (
    <div className="min-h-full bg-brasil-cream flex flex-col pb-24">
      {/* ─── Scrollable content ─────────────────────────────────────────── */}
      <div className="flex-1">
        <div className="max-w-md mx-auto px-4 pt-5 pb-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => onOpenChange(false)}
              className="size-10 rounded-full bg-white handmade-border flex items-center justify-center hover:bg-brasil-yellow/30 transition-colors"
              aria-label="Fechar"
            >
              <X className="size-4 text-brasil-navy" />
            </button>
            <h1 className="font-display text-base text-brasil-navy tracking-wider">
              {step === 1 && "Cadastrar Local"}
              {step === 2 && "Conta pra Gente"}
              {step === 3 && "Quais Jogos?"}
            </h1>
            <div className="size-10" />
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2 flex-1 rounded-full transition-colors ${
                  s <= step ? "bg-brasil-green" : "bg-brasil-navy/20"
                }`}
              />
            ))}
          </div>

          {/* ─── STEP 1 ───────────────────────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-brasil-navy/70">
                Busque o endereço do local. Selecione o resultado correto.
              </p>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brasil-navy/40" />
                <Input
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setAddress(null);
                  }}
                  placeholder="Digite rua, número, bairro…"
                  className="pl-10 rounded-xl border-2 border-brasil-navy/30 focus:border-brasil-green"
                />
              </div>

              {!address && query.length > 0 && (
                <div className="space-y-2">
                  {isSearching && (
                    <div className="flex items-center gap-2 text-sm text-brasil-navy/60 py-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Buscando...
                    </div>
                  )}
                  {!isSearching && placeSuggestions.length > 0 && (
                    <div className="border rounded-xl overflow-hidden border-brasil-navy/20">
                      {placeSuggestions.map((s) => (
                        <button
                          key={s.placeId}
                          onClick={() => handleSelectPlace(s)}
                          className="w-full text-left px-4 py-3 hover:bg-brasil-green/10 transition-colors flex items-start gap-3 border-b last:border-b-0 border-brasil-navy/10"
                        >
                          <MapPin className="w-4 h-4 mt-0.5 text-brasil-green shrink-0" />
                          <div>
                            <p className="font-medium text-brasil-navy text-sm">{s.title}</p>
                            <p className="text-xs text-brasil-navy/60">{s.subtitle}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {!isSearching && placeSuggestions.length === 0 && query.length >= 2 && (
                    <p className="text-sm text-brasil-navy/50 py-2">
                      Digite o nome de um bar, restaurante ou café…
                    </p>
                  )}
                  {searchError && <p className="text-sm text-red-500 py-2">{searchError}</p>}
                </div>
              )}

              {address && (
                <div className="rounded-xl border-2 border-brasil-green/40 bg-brasil-green/5 p-4 space-y-3">
                  {isLoadingDetails ? (
                    <div className="flex items-center gap-2 text-sm text-brasil-navy/60">
                      <Loader2 className="w-4 h-4 animate-spin" /> Carregando detalhes…
                    </div>
                  ) : (
                    <>
                      <div className="relative aspect-video rounded-lg overflow-hidden border border-brasil-navy/10 bg-brasil-cream">
                        {googlePlace?.photoUrl && !photoError ? (
                          <>
                            <img
                              src={googlePlace.photoUrl}
                              alt={address.title}
                              className="w-full h-full object-cover"
                              onError={() => setPhotoError(true)}
                            />
                            {googlePlace.rating && (
                              <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1 text-xs font-bold text-brasil-navy shadow-sm">
                                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                {googlePlace.rating.toFixed(1)}
                              </div>
                            )}
                          </>
                        ) : address?.lat &&
                          address?.lng &&
                          (address.lat !== 0 || address.lng !== 0) ? (
                          <MiniMap lat={address.lat} lng={address.lng} title={address.title} />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-brasil-navy/5 to-brasil-green/10">
                            <MapPin className="w-8 h-8 text-brasil-navy/30" />
                            <span className="text-xs text-brasil-navy/50 font-medium">
                              {address.title}
                            </span>
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-brasil-navy">{address.title}</p>
                        <p className="text-sm text-brasil-navy/70">{address.subtitle}</p>
                        {googlePlace && (
                          <p className="text-xs text-brasil-green mt-1 flex items-center gap-1">
                            <Star className="w-3 h-3" /> Dados confirmados pelo Google Maps
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ─── STEP 2 ───────────────────────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-5">
              <p className="text-sm text-brasil-navy/70">Nome, endereço e o que rola por lá</p>
              <div className="space-y-1.5">
                <Label
                  htmlFor="venue-name"
                  className="text-brasil-navy font-semibold text-sm uppercase tracking-wide"
                >
                  Nome do Local
                </Label>
                <Input
                  id="venue-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Boteco do Zé"
                  className="rounded-xl border-2 border-brasil-navy/30 bg-background px-3 py-2.5 focus:border-brasil-green outline-none"
                />
                {googlePlace?.name && name !== googlePlace.name && (
                  <button
                    onClick={() => setName(googlePlace.name || "")}
                    className="text-xs text-brasil-green hover:underline"
                  >
                    Restaurar nome original: {googlePlace.name}
                  </button>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-brasil-navy font-semibold text-sm uppercase tracking-wide">
                  Endereço
                </Label>
                <div className="rounded-xl border-2 border-brasil-navy/20 bg-brasil-navy/5 px-3 py-2.5 text-sm text-brasil-navy/80">
                  <p className="font-medium">{address?.title}</p>
                  <p>{address?.subtitle}</p>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-brasil-navy font-semibold text-sm uppercase tracking-wide">
                  O que tem no local?
                </Label>
                <div className="space-y-2">
                  {PERKS.map((p) => {
                    const Icon = p.icon;
                    const active = perks.has(p.id);
                    return (
                      <button
                        key={p.id}
                        onClick={() => togglePerk(p.id)}
                        className={`w-full flex items-center justify-between rounded-xl border-2 px-4 py-3 transition-all ${
                          active
                            ? "border-brasil-green bg-brasil-green/10 text-brasil-navy"
                            : "border-brasil-navy/20 bg-white text-brasil-navy/70 hover:border-brasil-navy/40"
                        }`}
                      >
                        <span className="flex items-center gap-3 text-sm font-medium">
                          <Icon className="w-5 h-5" /> {p.label}
                        </span>
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${active ? "border-brasil-green bg-brasil-green" : "border-brasil-navy/30"}`}
                        >
                          {active && <span className="text-white text-xs">✓</span>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ─── STEP 3 ───────────────────────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-5">
              <p className="text-sm text-brasil-navy/70">
                Escolha um ou mais. Dá pra editar depois.
              </p>
              <div className="space-y-2">
                {matchesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="size-6 text-brasil-navy animate-spin" />
                  </div>
                ) : dbMatches.length === 0 ? (
                  <p className="text-sm text-brasil-navy/50 text-center py-4">
                    Nenhum jogo disponível
                  </p>
                ) : (
                  dbMatches.map((m) => {
                    const active = matches.has(m.id);
                    return (
                      <button
                        key={m.id}
                        onClick={() => toggleMatch(m.id)}
                        className={`w-full flex items-center justify-between rounded-xl border-2 px-4 py-3 transition-all ${
                          active
                            ? "border-brasil-green bg-brasil-green/10 text-brasil-navy"
                            : "border-brasil-navy/20 bg-white text-brasil-navy/70 hover:border-brasil-navy/40"
                        }`}
                      >
                        <span className="text-sm font-medium">
                          {m.match_name}
                          <span className="text-xs text-brasil-navy/50 ml-2">
                            {new Date(m.match_date).toLocaleDateString("pt-BR", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </span>
                        <Checkbox checked={active} />
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Fixed footer (botões) ────────────────────────────────────── */}
      <div className="shrink-0 border-t border-brasil-navy/10 bg-brasil-cream">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-3">
          {step > 1 && (
            <Button
              onClick={handleBack}
              className="flex-1 rounded-xl border-2 border-brasil-navy/30 bg-white text-brasil-navy font-bold uppercase tracking-wider hover:bg-brasil-cream"
            >
              Voltar
            </Button>
          )}
          {step < 3 && (step > 1 || address) ? (
            <Button
              onClick={handleNext}
              className="flex-1 rounded-xl bg-brasil-green hover:bg-brasil-green/90 text-white font-bold uppercase tracking-wider"
            >
              Próximo
            </Button>
          ) : step === 3 ? (
            <Button
              onClick={handleSubmit}
              className="flex-1 rounded-xl bg-brasil-green hover:bg-brasil-green/90 text-white font-bold uppercase tracking-wider"
            >
              Cadastrar
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function MiniMap({ lat, lng, title }: { lat: number; lng: number; title: string }) {
  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={[lat, lng]}
        zoom={16}
        zoomControl={false}
        dragging={false}
        scrollWheelZoom={false}
        touchZoom={false}
        doubleClickZoom={false}
        attributionControl={false}
        className="w-full h-full"
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker position={[lat, lng]} icon={markerIcon} />
      </MapContainer>
      <div className="absolute bottom-2 left-2 z-[999] bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-medium text-brasil-navy shadow-sm flex items-center gap-1 pointer-events-none">
        <MapPin className="w-3 h-3 text-brasil-green" /> {title}
      </div>
    </div>
  );
}

export default AddVenueModal;
