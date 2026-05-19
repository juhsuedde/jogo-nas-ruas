import { cn } from "@/shared/lib/utils";

interface BrasilCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "highlight" | "outline" | "ghost";
  padding?: "none" | "sm" | "md" | "lg";
}

export function BrasilCard({
  className,
  variant = "default",
  padding = "md",
  children,
  ...props
}: BrasilCardProps) {
  const baseStyles = "rounded-2xl transition-all";

  const variants = {
    default: "bg-white shadow-sm border border-brasil-navy/5",
    highlight: "bg-brasil-green/10 border-2 border-brasil-green/40",
    outline: "bg-white border-2 border-brasil-navy/20",
    ghost: "bg-transparent",
  };

  const paddings = {
    none: "",
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
  };

  return (
    <div
      className={cn(baseStyles, variants[variant], paddings[padding], className)}
      {...props}
    >
      {children}
    </div>
  );
}