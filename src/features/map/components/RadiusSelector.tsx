import { RADIUS_OPTIONS, type RadiusOption } from "@/data/venues";

interface RadiusSelectorProps {
  radius: RadiusOption;
  onRadiusChange: (radius: RadiusOption) => void;
}

export function RadiusSelector({ radius, onRadiusChange }: RadiusSelectorProps) {
  return (
    <div className="flex items-center gap-1 bg-brasil-navy/5 rounded-lg p-1">
      {RADIUS_OPTIONS.map((r) => (
        <button
          key={r}
          onClick={() => onRadiusChange(r)}
          className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
            radius === r
              ? "bg-brasil-navy text-white"
              : "text-brasil-navy/60 hover:text-brasil-navy"
          }`}
        >
          {r}km
        </button>
      ))}
    </div>
  );
}