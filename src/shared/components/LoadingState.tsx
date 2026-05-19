import { Loader2 } from "lucide-react";
import { cn } from "@/shared/lib/utils";

interface LoadingStateProps {
  type?: "spinner" | "skeleton" | "dots";
  size?: "sm" | "md" | "lg";
  className?: string;
  text?: string;
}

export function LoadingState({
  type = "spinner",
  size = "md",
  className,
  text,
}: LoadingStateProps) {
  const sizes = {
    sm: "size-4",
    md: "size-8",
    lg: "size-12",
  };

  if (type === "skeleton") {
    return (
      <div className={cn("space-y-3 animate-pulse", className)}>
        <div className="h-20 bg-brasil-navy/10 rounded-2xl" />
        <div className="h-20 bg-brasil-navy/10 rounded-2xl" />
        <div className="h-20 bg-brasil-navy/10 rounded-2xl" />
      </div>
    );
  }

  if (type === "dots") {
    return (
      <div className={cn("flex items-center justify-center gap-1.5", className)}>
        <span
          className={cn("rounded-full bg-brasil-yellow animate-bounce", sizes[size === "sm" ? "sm" : "md"])}
          style={{ animationDelay: "0ms" }}
        />
        <span
          className={cn("rounded-full bg-brasil-yellow animate-bounce", sizes[size === "sm" ? "sm" : "md"])}
          style={{ animationDelay: "150ms" }}
        />
        <span
          className={cn("rounded-full bg-brasil-yellow animate-bounce", sizes[size === "sm" ? "sm" : "md"])}
          style={{ animationDelay: "300ms" }}
        />
      </div>
    );
  }

  // Default: spinner
  return (
    <div className={cn("flex flex-col items-center justify-center gap-2", className)}>
      <Loader2 className={cn("text-brasil-green animate-spin", sizes[size])} />
      {text && <p className="text-sm text-brasil-navy/60 font-medium">{text}</p>}
    </div>
  );
}