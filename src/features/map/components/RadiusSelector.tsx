interface RadiusSelectorProps {
  radius: number;
  options: number[];
  onChange: (r: number) => void;
}

export function RadiusSelector({ radius, options, onChange }: RadiusSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1">
        {options.map((r) => (
          <button
            key={r}
            onClick={() => onChange(r)}
            className={`px-2.5 py-1 rounded-full text-xs font-bold transition-colors ${
              radius === r
                ? "bg-brasil-navy text-white"
                : "bg-white/80 text-brasil-navy border border-brasil-navy/20"
            }`}
          >
            {r}km
          </button>
        ))}
      </div>
    </div>
  );
}
