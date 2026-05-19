import { Link } from "@tanstack/react-router";
import { Search, Loader2, MapPin } from "lucide-react";
import type { GooglePlace } from "@/shared/lib/google-places";

interface SearchBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  searchResults: GooglePlace[];
  isSearching: boolean;
  selectedPlace: GooglePlace | null;
  onSelectPlace: (place: GooglePlace) => void;
  onClear: () => void;
  userInitials: string;
}

export function SearchBar({
  query,
  onQueryChange,
  searchResults,
  isSearching,
  selectedPlace,
  onSelectPlace,
  onClear,
  userInitials,
}: SearchBarProps) {
  return (
    <div className="flex-1 rounded-full bg-card handmade-border flex items-center gap-2 px-4 py-2.5 relative">
      <Search className="size-4 text-brasil-navy shrink-0" />
      <input
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="buscar bar, jogo ou bairro"
        aria-label="Buscar bar, jogo ou bairro"
        className="flex-1 bg-transparent outline-none text-sm placeholder:text-brasil-navy/50"
      />
      {isSearching && <Loader2 className="size-4 text-brasil-navy animate-spin shrink-0" />}
      {selectedPlace && !isSearching && (
        <button
          onClick={onClear}
          className="size-4 text-brasil-navy/50 hover:text-brasil-navy shrink-0"
          aria-label="Limpar busca"
        >
          ✕
        </button>
      )}
      <Link
        to={"/perfil"}
        aria-label="Meu perfil"
        className="size-7 rounded-full bg-brasil-green flex items-center justify-center text-white font-display text-[11px] shrink-0"
      >
        {userInitials}
      </Link>

      {!selectedPlace && searchResults.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#0A2540] rounded-2xl overflow-hidden border-2 border-brasil-yellow/30 shadow-xl z-[700] max-h-64 overflow-y-auto">
          {searchResults.map((place) => (
            <button
              key={place.place_id}
              onClick={() => onSelectPlace(place)}
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
  );
}