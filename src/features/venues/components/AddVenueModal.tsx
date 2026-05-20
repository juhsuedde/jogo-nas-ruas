import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Search, MapPin, Star, Loader2, ChevronLeft, Tv, Tag, Car } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/shared/lib/supabase";
import { useMatches } from "@/shared/lib/matches";

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
  phone?: string; // disponível, mas não usamos no cadastro
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
  // Steps
  const [step, setStep] = useState(1);

  // Search / Place selection
  const [query, setQuery] = useState("");
  const [address, setAddress] = useState<Address | null>(null);
  const [googlePlace, setGooglePlace] = useState<GooglePlaceDetails | null>(null);
  const [placeSuggestions, setPlaceSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Venue data
  const [name, setName] = useState("");
  const [perks, setPerks] = useState<Set<string>>(new Set());
  const [matches, setMatches] = useState<Set<string>>(new Set());

  // Fetch matches from database
  const { data: dbMatches = [], isLoading: matchesLoading } = useMatches();

  // ─── Reset when modal opens ──────────────────────────────────────────────────
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

  // ─── Auto-fill name when Google Place details arrive ───────────────────────
  useEffect(() => {
    if (googlePlace?.name && !name) {
      setName(googlePlace.name);
    }
  }, [googlePlace, name]);

  // ─── Search debounce ───────────────────────────────────────────────────────
  useEffect(() => {
    if (query.length < 2) {
      setPlaceSuggestions([]);
      return;
    }
    const timer = setTimeout(() => {
      handleSearch(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  async function handleSearch(q: string) {
    setIsSearching(true);
    setSearchError(null);
    try {
      const { data, error } = await supabase.functions.invoke("google-places", {
        body: { action: "search", query: q },
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
    } catch (e) {
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
    } catch (e) {
      toast.error("Erro ao carregar detalhes. Usando informações básicas do endereço.");
    } finally {
      setIsLoadingDetails(false);
    }
  }

  function togglePerk(id: string) {
    setPerks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleMatch(id: string) {
    setMatches((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleNext() {
    if (step === 1) {
      if (!address) {
        toast.error("Selecione um local");
        return;
      }
      if (!name.trim()) {
        toast.error("Nome do local é obrigatório");
        return;
      }
      setStep(2);
    } else if (step === 2) {
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

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-xl font-bold text-brasil-navy uppercase tracking-wide">
            {step === 1 && "Cadastrar Local"}
            {step === 2 && "Conta pra Gente"}
            {step === 3 && "Quais Jogos?"}
          </DialogTitle>
        </DialogHeader>

        {/* Step indicator */}
        <div className="px-6 pb-4 flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 flex-1 rounded-full transition-colors ${
                s <= step ? "bg-brasil-green" : "bg-brasil-navy/20"
              }`}
            />
          ))}
        </div>

        {/* ─── STEP 1: Localização ─────────────────────────────────────────── */}
        {step === 1 && (
          <div className="px-6 pb-6 space-y-4">
            <p className="text-sm text-brasil-navy/70">
              Busque o endereço do local. Selecione o resultado correto.
            </p>

            {/* Search input */}
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

            {/* Suggestions */}
            {!address && query.length > 0 && (
              <div className="space-y-2">
                {isSearching && (
                  <div className="flex items-center gap-2 text-sm text-brasil-navy/60 py-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Buscando...
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

            {/* Selected address card */}
            {address && (
              <div className="rounded-xl border-2 border-brasil-green/40 bg-brasil-green/5 p-4 space-y-3">
                {isLoadingDetails ? (
                  <div className="flex items-center gap-2 text-sm text-brasil-navy/60">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Carregando detalhes…
                  </div>
                ) : (
                  <>
                    {googlePlace?.photoUrl ? (
                      <div className="relative aspect-video rounded-lg overflow-hidden">
                        <img
                          src={googlePlace.photoUrl}
                          alt={address.title}
                          className="w-full h-full object-cover"
                        />
                        {googlePlace.rating && (
                          <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1 text-xs font-bold text-brasil-navy shadow-sm">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            {googlePlace.rating.toFixed(1)}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="aspect-video rounded-lg bg-brasil-navy/10 flex items-center justify-center">
                        <MapPin className="w-8 h-8 text-brasil-navy/30" />
                      </div>
                    )}

                    <div>
                      <p className="font-bold text-brasil-navy">{address.title}</p>
                      <p className="text-sm text-brasil-navy/70">{address.subtitle}</p>
                      {googlePlace && (
                        <p className="text-xs text-brasil-green mt-1 flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          Dados confirmados pelo Google Maps
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* ─── STEP 2: Informações do local ────────────────────────────────── */}
        {step === 2 && (
          <div className="px-6 pb-6 space-y-5">
            <p className="text-sm text-brasil-navy/70">Nome, endereço e o que rola por lá</p>

            {/* Name — preenchido automaticamente, mas editável */}
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

            {/* Address — read-only, vem do Google */}
            <div className="space-y-1.5">
              <Label className="text-brasil-navy font-semibold text-sm uppercase tracking-wide">
                Endereço
              </Label>
              <div className="rounded-xl border-2 border-brasil-navy/20 bg-brasil-navy/5 px-3 py-2.5 text-sm text-brasil-navy/80">
                <p className="font-medium">{address?.title}</p>
                <p>{address?.subtitle}</p>
              </div>
            </div>

            {/* Perks */}
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
                        <Icon className="w-5 h-5" />
                        {p.label}
                      </span>
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                          active ? "border-brasil-green bg-brasil-green" : "border-brasil-navy/30"
                        }`}
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

        {/* ─── STEP 3: Jogos ──────────────────────────────────────────────── */}
        {step === 3 && (
          <div className="px-6 pb-6 space-y-5">
            <p className="text-sm text-brasil-navy/70">Escolha um ou mais. Dá pra editar depois.</p>
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

        {/* ─── Footer buttons ─────────────────────────────────────────────── */}
        <div className="px-6 pb-6 pt-2 flex items-center gap-3">
          {step > 1 && (
            <Button
              variant="outline"
              onClick={handleBack}
              className="flex-1 rounded-xl border-2 border-brasil-navy/30"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Voltar
            </Button>
          )}
          {step < 3 ? (
            <Button
              onClick={handleNext}
              className="flex-1 rounded-xl bg-brasil-green hover:bg-brasil-green/90 text-white font-bold uppercase tracking-wider"
            >
              Próximo
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              className="flex-1 rounded-xl bg-brasil-green hover:bg-brasil-green/90 text-white font-bold uppercase tracking-wider"
            >
              Cadastrar
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
