import { FILTERS, type FilterId } from "@/data/venues";

interface FilterBarProps {
  activeFilters: Set<FilterId>;
  onFilterChange: (filters: Set<FilterId>) => void;
}

export function FilterBar({ activeFilters, onFilterChange }: FilterBarProps) {
  const toggleFilter = (filterId: FilterId) => {
    const newFilters = new Set(activeFilters);
    if (newFilters.has(filterId)) {
      newFilters.delete(filterId);
    } else {
      newFilters.add(filterId);
    }
    onFilterChange(newFilters);
  };

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none px-4">
      {FILTERS.map((filter) => {
        const isActive = activeFilters.has(filter.id);
        return (
          <button
            key={filter.id}
            onClick={() => toggleFilter(filter.id)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${
              isActive
                ? "bg-brasil-navy text-brasil-yellow"
                : "bg-brasil-navy/10 text-brasil-navy/70 hover:bg-brasil-navy/20"
            }`}
          >
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}