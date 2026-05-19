import { Crosshair, Loader2 } from "lucide-react";

interface LocationButtonProps {
  isLocating: boolean;
  onClick: () => void;
}

export function LocationButton({ isLocating, onClick }: LocationButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={isLocating}
      className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[1000] size-14 bg-white rounded-full shadow-xl border-2 border-brasil-green flex items-center justify-center active:scale-95 transition-transform disabled:opacity-50"
      aria-label="Centralizar na minha localização"
    >
      {isLocating ? (
        <Loader2 className="size-5 text-brasil-green animate-spin" />
      ) : (
        <Crosshair className="size-5 text-brasil-navy" />
      )}
    </button>
  );
}