interface FilterBarProps {
  filters: Set<string>;
  options: { id: string; label: string }[];
  onToggle: (id: string) => void;
}

export function FilterBar({ filters, options, onToggle }: FilterBarProps) {
  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
      {options.map((f) => (
        <button
          key={f.id}
          onClick={() => onToggle(f.id)}
          data-active={filters.has(f.id)}
          className={`chip ${filters.has(f.id) ? "bg-brasil-green text-white border-brasil-green" : ""}`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
