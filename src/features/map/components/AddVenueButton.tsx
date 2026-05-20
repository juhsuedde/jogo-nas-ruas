import { Plus } from "lucide-react";

interface AddVenueButtonProps {
  onClick: () => void;
}

export function AddVenueButton({ onClick }: AddVenueButtonProps) {
  return (
    <button
      onClick={onClick}
      className="absolute bottom-20 right-4 z-[1000] w-14 h-14 bg-brasil-yellow rounded-full shadow-lg border-4 border-brasil-navy flex items-center justify-center active:scale-95 transition-transform"
      aria-label="Adicionar local"
    >
      <Plus className="w-7 h-7 text-brasil-navy" />
    </button>
  );
}
