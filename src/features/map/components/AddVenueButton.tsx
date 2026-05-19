import { Plus } from "lucide-react";

interface AddVenueButtonProps {
  onClick: () => void;
  onMouseEnter?: () => void;
  onTouchStart?: () => void;
}

export function AddVenueButton({ onClick, onMouseEnter, onTouchStart }: AddVenueButtonProps) {
  return (
    <button
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onTouchStart={onTouchStart}
      className="size-12 rounded-full bg-brasil-yellow handmade-border flex items-center justify-center shrink-0"
      aria-label="Cadastrar local"
    >
      <Plus className="size-5 text-brasil-navy" strokeWidth={3} />
    </button>
  );
}