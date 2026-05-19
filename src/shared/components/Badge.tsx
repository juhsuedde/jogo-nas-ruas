import { cn } from "@/shared/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "success" | "warning" | "danger" | "new";
}

export function Badge({ className, variant = "default", children, ...props }: BadgeProps) {
  const baseStyles = "text-[10px] font-bold px-2 py-0.5 rounded-full";

  const variants = {
    default: "bg-brasil-navy/10 text-brasil-navy",
    success: "bg-brasil-green/20 text-brasil-green",
    warning: "bg-brasil-yellow/20 text-brasil-navy",
    danger: "bg-red-100 text-red-600",
    new: "bg-brasil-yellow text-brasil-navy",
  };

  return (
    <span className={cn(baseStyles, variants[variant], className)} {...props}>
      {children}
    </span>
  );
}