import { cn } from "@/shared/lib/utils";

interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isActive?: boolean;
}

export function Chip({ className, isActive = false, children, ...props }: ChipProps) {
  return (
    <button
      className={cn(
        "shrink-0 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors",
        isActive
          ? "bg-brasil-navy text-brasil-yellow"
          : "bg-brasil-navy/10 text-brasil-navy/70 hover:bg-brasil-navy/20",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}