import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, lazy, Suspense } from "react";
import { Plus, Search } from "lucide-react";
import { FILTERS, VENUES, type FilterId } from "@/data/venues";
import { BottomSheet } from "@/components/BottomSheet";
import { VenueCard } from "@/components/VenueCard";
import { ClientOnly } from "@/components/ClientOnly";
import { BottomNav } from "@/components/BottomNav";

const MapView = lazy(() =>
  import("@/components/MapView").then((m) => ({ default: m.MapView })),
);

export const Route = createFileRoute("/mapa")({
  head: () => ({
    meta: [
      { title: "Mapa — Jogo nas Ruas" },
      {
        name: "description",
        content:
          "Encontre bares, restaurantes e praças transmitindo a Copa 2026 perto de você.",
      },
    ],
  }),
  component: MapPage,
});

function MapPage() {
  const navigate = useNavigate();
  const [active, setActive] = useState<string | null>("1");
  const [filters, setFilters] = useState<Set<FilterId>>(new Set(["today"]));
  const [query, setQuery] = useState("");

  const toggle = (id: FilterId) => {
    const next = new Set(filters);
    next.has(id) ? next.delete(id) : next.add(id);
    setFilters(next);
  };

  const venues = useMemo(() => {
    return VENUES.filter((v) => {
      if (filters.has("brazil") && !v.isBrazilMatch) return false;
      if (filters.has("screen") && !v.bigScreen) return false;
      if (filters.has("city") && v.city !== "São Paulo") return false;
      if (
        query &&
        !`${v.name} ${v.address} ${v.match}`
          .toLowerCase()
          .includes(query.toLowerCase())
      )
        return false;
      return true;
    });
  }, [filters, query]);

  return (
    <main className="fixed inset-0 overflow-hidden">
      <ClientOnly
        fallback={<div className="absolute inset-0 bg-muted animate-pulse" />}
      >
        <Suspense
          fallback={<div className="absolute inset-0 bg-muted animate-pulse" />}
        >
          <MapView
            venues={venues}
            activeId={active}
            onSelect={(id) => setActive(id)}
          />
        </Suspense>
      </ClientOnly>

      {/* Top bar */}
      <div className="absolute top-0 inset-x-0 z-[600] p-3 pt-4 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="flex-1 rounded-full bg-card handmade-border flex items-center gap-2 px-4 py-2.5">
            <Search className="size-4 text-brasil-navy" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="buscar bar, jogo ou bairro"
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-brasil-navy/50"
            />
            <Link
              to="/perfil"
              aria-label="Meu perfil"
              className="size-7 rounded-full bg-brasil-green flex items-center justify-center text-white font-display text-[11px] shrink-0"
            >
              LA
            </Link>
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
      </div>

      <BottomSheet>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="font-display text-lg text-brasil-navy">
            onde a galera tá
          </h2>
          <span className="text-xs font-bold text-muted-foreground">
            {venues.length} locais
          </span>
        </div>
        <div className="space-y-3 pb-20">
          {venues.map((v) => (
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
              <p className="text-sm">
                Nenhum local com esses filtros. Que tal cadastrar um?
              </p>
            </div>
          )}
        </div>
      </BottomSheet>

      <BottomNav />
    </main>
  );
}
