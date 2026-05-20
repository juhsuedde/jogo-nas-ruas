import { cn } from "@/shared/lib/utils";
import { Loader2 } from "lucide-react";

interface BrasilButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "green" | "yellow" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
}

export function BrasilButton({
  className,
  variant = "green",
  size = "md",
  isLoading = false,
  children,
  disabled,
  ...props
}: BrasilButtonProps) {
  const baseStyles =
    "font-bold uppercase tracking-wider rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center";

  const variants = {
    green: "bg-brasil-green hover:bg-brasil-green/90 text-white",
    yellow: "bg-brasil-yellow hover:bg-brasil-yellow/90 text-brasil-navy",
    outline: "border-2 border-brasil-navy/30 bg-white text-brasil-navy hover:border-brasil-navy/60",
    ghost: "bg-transparent text-brasil-navy/70 hover:text-brasil-navy hover:bg-brasil-navy/5",
    danger: "bg-red-50 border border-red-200 text-red-600 hover:bg-red-100",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2.5 text-sm",
    lg: "px-6 py-3 text-base",
    icon: "size-10",
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? <Loader2 className="size-4 animate-spin" /> : children}
    </button>
  );
}
