import { useState, useEffect, useRef } from "react";
import { X, ArrowLeft, MapPin, Search, Check, Loader2, Star } from "lucide-react";
import { useAddVenue } from "@/lib/venues";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "@tanstack/react-router";
import { searchPlaces, getPlaceDetails, type GooglePlace } from "@/lib/google-places";

type Suggestion = { id: string; title: string; subtitle: string; lat: number; lng: number };

type PlaceSuggestion = {
  place_id: string;
  name: string;
  formatted_address: string;
};

const ADDRESS_SUGGESTIONS: Suggestion[] = [
  {
    id: "a1",
    title: "Rua Augusta, 1200",
    subtitle: "Consolação · São Paulo",
    lat: -23.5558,
    lng: -46.6622,
  },
  {
    id: "a2",
    title: "Praça Roosevelt, 100",
    subtitle: "República · São Paulo",
    lat: -23.5468,
    lng: -46.6438,
  },
  {
    id: "a3",
    title: "Av. Paulista, 2500",
    subtitle: "Bela Vista · São Paulo",
    lat: -23.5614,
    lng: -46.6566,
  },
];

const PERKS = [
  { id: "screen", emoji: "📺", label: "Tem Telão" },
  { id: "promo", emoji: "🎁", label: "Tem Promoção" },
  { id: "parking", emoji: "🅿️", label: "Tem Estacionamento" },
] as const;

const UPCOMING_MATCHES = [
  {
    id: "m1",
    teams: "Brasil x Argentina",
    time: "Hoje · 16:00",
    flag: "🇧🇷",
    matchTime: "16:00",
    isBr: true,
  },
  {
    id: "m2",
    teams: "França x Alemanha",
    time: "Hoje · 13:00",
    flag: "🇫🇷",
    matchTime: "13:00",
    isBr: false,
  },
  {
    id: "m3",
    teams: "Portugal x Espanha",
    time: "Amanhã · 10:00",
    flag: "🇵🇹",
    matchTime: "10:00",
    isBr: false,
  },
  {
    id: "m4",
    teams: "Brasil x México",
    time: "Quinta · 16:00",
    flag: "🇧🇷",
    matchTime: "16:00",
    isBr: true,
  },
  {
    id: "m5",
    teams: "Inglaterra x Itália",
    time: "Quinta · 13:00",
    flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    matchTime: "13:00",
    isBr: false,
  },
  {
    id: "m6",
    teams: "Holanda x Croácia",
    time: "Sexta · 10:00",
    flag: "🇳🇱",
    matchTime: "10:00",
    isBr: false,
  },
  {
    id: "m7",
    teams: "Brasil x Uruguai",
    time: "Domingo · 16:00",
    flag: "🇧🇷",
    matchTime: "16:00",
    isBr: true,
  },
];

export function AddVenueModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const addVenue = useAddVenue();
  const [step, setStep] = useState(1);
  const [query, setQuery] = useState("");
  const [address, setAddress] = useState<Suggestion | null>(null);
  const [googlePlace, setGooglePlace] = useState<GooglePlace | null>(null);
  const [placeSuggestions, setPlaceSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [perks, setPerks] = useState<Set<string>>(new Set(["screen"]));
  const [matches, setMatches] = useState<Set<string>>(new Set(["m1"]));
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.length < 2) {
      setPlaceSuggestions([]);
      setSearchError(null);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    searchTimeoutRef.current = setTimeout(async () => {
      const results = await searchPlaces(query);
      if (results.length === 0 && query.length >= 2) {
        setSearchError("Não foi possível buscar locais. Tente novamente.");
      }
      setPlaceSuggestions(results);
      setIsSearching(false);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query]);

  const handleSelectPlace = async (place: PlaceSuggestion) => {
    setIsLoadingDetails(true);
    setSearchError(null);
    setQuery(place.formatted_address);

    const details = await getPlaceDetails(place.place_id);
    setIsLoadingDetails(false);

    if (details) {
      setGooglePlace(details);
      setAddress({
        id: place.place_id,
        title: details.name,
        subtitle: details.formatted_address,
        lat: details.lat,
        lng: details.lng,
      });
      if (details.name) setName(details.name);
      if (details.phone) setPhone(details.phone);
    } else {
      setAddress({
        id: place.place_id,
        title: place.name,
        subtitle: place.formatted_address,
        lat: 0,
        lng: 0,
      });
      setSearchError("Não foi possível obter detalhes. Continue manualmente.");
    }
    setPlaceSuggestions([]);
  };

  const togglePerk = (id: string) => {
    const next = new Set(perks);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setPerks(next);
  };
  const toggleMatch = (id: string) => {
    const next = new Set(matches);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setMatches(next);
  };

  const filteredSuggestions = ADDRESS_SUGGESTIONS.filter((s) =>
    `${s.title} ${s.subtitle}`.toLowerCase().includes(query.toLowerCase()),
  );

  const canAdvance =
    (step === 1 && !!address) ||
    (step === 2 && name.trim().length > 1) ||
    (step === 3 && matches.size > 0);

  const submit = async () => {
    if (!user) {
      navigate({ to: "/login" });
      return;
    }
    if (!address) return;
    setError(null);
    try {
      const chosen = UPCOMING_MATCHES.filter((m) => matches.has(m.id));
      for (const m of chosen) {
        await addVenue.mutateAsync({
          name: name.trim(),
          address: address.title + " · " + address.subtitle,
          phone: phone || undefined,
          lat: address.lat,
          lng: address.lng,
          city: address.subtitle.split("·").pop()?.trim() || "São Paulo",
          match: m.teams,
          matchTime: m.matchTime,
          isBrazilMatch: m.isBr,
          bigScreen: perks.has("screen"),
          promo: perks.has("promo") ? "Promoção no local" : undefined,
        });
      }
      setSent(true);
      setTimeout(onClose, 1500);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Erro ao cadastrar.";
      setError(message);
    }
  };

  return (
    <div className="absolute inset-0 z-[1000] bg-brasil-navy/40 flex items-end sm:items-center justify-center sm:p-3">
      <div className="w-full sm:max-w-md bg-card sm:rounded-3xl rounded-t-3xl handmade-border-yellow flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 pb-2">
          <h1 className="font-display text-lg text-brasil-navy">{sent ? "" : "cadastrar local"}</h1>
          <button
            onClick={onClose}
            className="size-9 rounded-full bg-muted flex items-center justify-center"
            aria-label="Fechar"
          >
            <X className="size-4" />
          </button>
        </div>

        {sent ? (
          <div className="px-6 py-12 text-center">
            <div className="text-6xl mb-4">⚽</div>
            <p className="font-display text-xl text-brasil-green">local cadastrado!</p>
            <p className="text-sm text-muted-foreground mt-2">
              Já tá no mapa como "Novo". Valeu pela contribuição!
            </p>
          </div>
        ) : (
          <>
            {/* Step indicator */}
            <div className="flex items-center justify-center gap-2 pb-3">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className={`h-2.5 rounded-full transition-all ${
                    n === step
                      ? "w-8 bg-brasil-green"
                      : n < step
                        ? "w-2.5 bg-brasil-navy"
                        : "w-2.5 bg-brasil-navy/20"
                  }`}
                />
              ))}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-4 pb-2">
              {step === 1 && (
                <div className="space-y-3">
                  <div>
                    <p className="font-display text-brasil-navy text-base mb-1">onde fica?</p>
                    <p className="text-xs text-muted-foreground">busque o endereço do local</p>
                  </div>
                  <div className="rounded-2xl bg-background handmade-border flex items-center gap-2 px-4 py-3">
                    <Search className="size-4 text-brasil-navy" />
                    <input
                      autoFocus
                      value={query}
                      onChange={(e) => {
                        setQuery(e.target.value);
                        setAddress(null);
                      }}
                      placeholder="Digite rua, número, bairro…"
                      aria-label="Buscar endereço do local"
                      className="flex-1 bg-transparent outline-none text-base placeholder:text-brasil-navy/40"
                    />
                  </div>

                  {!address && query.length > 0 && (
                    <div className="space-y-2">
                      {isSearching && (
                        <div className="flex items-center gap-2 p-3 text-muted-foreground">
                          <Loader2 className="size-4 animate-spin" />
                          <span className="text-sm">Buscando...</span>
                        </div>
                      )}
                      {!isSearching && placeSuggestions.length > 0 && (
                        <div className="bg-[#0A2540] rounded-2xl overflow-hidden border-2 border-brasil-yellow/30 max-h-60 overflow-y-auto">
                          {placeSuggestions.map((s) => (
                            <button
                              key={s.place_id}
                              onClick={() => handleSelectPlace(s)}
                              className="w-full flex items-center gap-3 p-3 text-left text-white hover:bg-brasil-yellow/20 transition-colors border-b border-white/10 last:border-b-0"
                            >
                              <div className="size-9 rounded-full bg-brasil-yellow/30 flex items-center justify-center shrink-0">
                                <MapPin className="size-4 text-brasil-yellow" />
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-sm truncate">{s.name}</p>
                                <p className="text-xs text-white/60 truncate">
                                  {s.formatted_address}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                      {!isSearching && placeSuggestions.length === 0 && query.length >= 2 && (
                        <div className="p-3 text-center">
                          <p className="text-sm text-muted-foreground">
                            Digite o nome de um bar, restaurante ou café...
                          </p>
                        </div>
                      )}
                      {searchError && (
                        <p className="text-sm text-red-600 text-center py-2">{searchError}</p>
                      )}
                    </div>
                  )}

                  {address && (
                    <div className="rounded-2xl overflow-hidden handmade-border">
                      {isLoadingDetails ? (
                        <div className="h-40 flex items-center justify-center bg-brasil-navy/5">
                          <Loader2 className="size-8 text-brasil-navy animate-spin" />
                        </div>
                      ) : googlePlace?.photoUrl ? (
                        <div className="h-40 relative">
                          <img
                            src={googlePlace.photoUrl}
                            alt={googlePlace.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                          {googlePlace.rating && (
                            <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/90 px-2 py-1 rounded-full">
                              <Star className="size-3 text-brasil-yellow fill-brasil-yellow" />
                              <span className="text-xs font-bold text-brasil-navy">
                                {googlePlace.rating.toFixed(1)}
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div
                          className="h-40 relative"
                          style={{
                            background:
                              "linear-gradient(135deg, oklch(0.92 0.05 145) 0%, oklch(0.88 0.08 95) 100%)",
                            backgroundImage:
                              "radial-gradient(oklch(0.32 0.13 265 / 0.08) 1px, transparent 1px), radial-gradient(oklch(0.32 0.13 265 / 0.08) 1px, transparent 1px)",
                            backgroundSize: "20px 20px, 20px 20px",
                            backgroundPosition: "0 0, 10px 10px",
                          }}
                        >
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="size-14 rounded-full bg-brasil-green flex items-center justify-center handmade-border animate-bounce">
                              <MapPin className="size-6 text-white" fill="currentColor" />
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="p-3 bg-card flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          {googlePlace ? (
                            <Check className="size-4 text-brasil-green shrink-0" />
                          ) : (
                            <MapPin className="size-4 text-brasil-navy/50 shrink-0" />
                          )}
                          <div className="min-w-0">
                            <p className="font-bold text-brasil-navy text-sm truncate">
                              {address.title}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {address.subtitle}
                            </p>
                          </div>
                        </div>
                        {googlePlace && (
                          <div className="flex items-center gap-1.5 text-[10px] text-brasil-green font-semibold bg-brasil-green/10 px-2 py-1 rounded-full w-fit">
                            <Check className="size-3" />
                            Dados confirmados pelo Google Maps
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <p className="font-display text-brasil-navy text-base mb-1">conta pra gente</p>
                    <p className="text-xs text-muted-foreground">
                      nome, telefone e o que rola por lá
                    </p>
                  </div>

                  <label className="block">
                    <span className="text-xs font-bold text-brasil-navy uppercase">
                      Nome do local
                    </span>
                    <input
                      autoFocus
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: Boteco do Zé"
                      className="mt-1 w-full rounded-xl border-2 border-brasil-navy/30 bg-background px-3 py-2.5 focus:border-brasil-green outline-none"
                    />
                  </label>

                  <label className="block">
                    <span className="text-xs font-bold text-brasil-navy uppercase">Telefone</span>
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(11) 99999-9999"
                      inputMode="tel"
                      className="mt-1 w-full rounded-xl border-2 border-brasil-navy/30 bg-background px-3 py-2.5 focus:border-brasil-green outline-none"
                    />
                  </label>

                  <div>
                    <span className="text-xs font-bold text-brasil-navy uppercase">
                      O que tem no local?
                    </span>
                    <div className="mt-2 grid grid-cols-1 gap-2">
                      {PERKS.map((p) => {
                        const active = perks.has(p.id);
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => togglePerk(p.id)}
                            className={`flex items-center gap-3 p-3 rounded-2xl border-2 text-left transition-all ${
                              active
                                ? "border-brasil-green bg-brasil-green/10"
                                : "border-brasil-navy/20 bg-background"
                            }`}
                          >
                            <div className="text-2xl">{p.emoji}</div>
                            <span className="flex-1 font-bold text-brasil-navy">{p.label}</span>
                            <div
                              className={`size-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                active
                                  ? "border-brasil-green bg-brasil-green"
                                  : "border-brasil-navy/30"
                              }`}
                            >
                              {active && <Check className="size-3.5 text-white" strokeWidth={3} />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-3">
                  <div>
                    <p className="font-display text-brasil-navy text-base mb-1">
                      quais jogos vão passar?
                    </p>
                    <p className="text-xs text-muted-foreground">
                      escolha um ou mais. dá pra editar depois.
                    </p>
                  </div>
                  <div className="space-y-2">
                    {UPCOMING_MATCHES.map((m) => {
                      const active = matches.has(m.id);
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => toggleMatch(m.id)}
                          className={`w-full flex items-center gap-3 p-3 rounded-2xl border-2 text-left transition-all ${
                            active
                              ? "border-brasil-green bg-brasil-green/10"
                              : "border-brasil-navy/20 bg-background"
                          }`}
                        >
                          <div className="text-2xl">{m.flag}</div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-brasil-navy text-sm truncate">{m.teams}</p>
                            <p className="text-xs text-muted-foreground">{m.time}</p>
                          </div>
                          <div
                            className={`size-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${
                              active
                                ? "border-brasil-green bg-brasil-green"
                                : "border-brasil-navy/30"
                            }`}
                          >
                            {active && <Check className="size-3.5 text-white" strokeWidth={3} />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 pt-3 flex gap-2 border-t-2 border-brasil-navy/10">
              {step > 1 && (
                <button
                  onClick={() => setStep(step - 1)}
                  className="rounded-2xl bg-background border-2 border-brasil-navy/30 font-bold text-brasil-navy px-5 py-3 flex items-center gap-1.5"
                >
                  <ArrowLeft className="size-4" />
                  Voltar
                </button>
              )}
              {step < 3 ? (
                <button
                  disabled={!canAdvance}
                  onClick={() => setStep(step + 1)}
                  className="flex-1 rounded-2xl bg-brasil-green text-white font-display text-base py-3 handmade-border disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Próximo
                </button>
              ) : (
                <button
                  disabled={!canAdvance || addVenue.isPending}
                  onClick={submit}
                  className="flex-1 rounded-2xl bg-brasil-yellow text-brasil-navy font-display text-base py-3 handmade-border disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {addVenue.isPending ? "ENVIANDO..." : "ADICIONAR NO MAPA"}
                </button>
              )}
            </div>
            {error && <p className="px-4 pb-3 text-sm text-red-600 text-center -mt-1">{error}</p>}
          </>
        )}
      </div>
    </div>
  );
}
