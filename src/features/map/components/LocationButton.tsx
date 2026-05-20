import { Navigation } from "lucide-react";

interface LocationButtonProps {
  onClick: () => void;
  isLocating: boolean;
}

export function LocationButton({ onClick, isLocating }: LocationButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={isLocating}
      className="w-14 h-14 bg-brasil-cream rounded-full shadow-xl border-[3px] border-brasil-navy flex items-center justify-center active:scale-90 transition-all hover:bg-brasil-yellow hover:shadow-2xl group"
      aria-label="Minha localização"
    >
      <Navigation
        className={`w-6 h-6 text-brasil-navy transition-colors ${isLocating ? "animate-spin" : ""}`}
        strokeWidth={2.5}
      />
    </button>
  );
}
