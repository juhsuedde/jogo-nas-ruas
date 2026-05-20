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
      className="w-12 h-12 bg-white rounded-full shadow-lg border-2 border-brasil-navy flex items-center justify-center active:scale-95 transition-transform"
      aria-label="Minha localização"
    >
      <Navigation className={`w-5 h-5 text-brasil-navy ${isLocating ? "animate-spin" : ""}`} />
    </button>
  );
}
