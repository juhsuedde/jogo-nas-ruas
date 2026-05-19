import { LucideIcon } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { BrasilButton } from "./BrasilButton";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-8 px-4 text-center", className)}>
      {Icon && (
        <div className="size-16 rounded-full bg-brasil-navy/5 flex items-center justify-center mb-4">
          <Icon className="size-8 text-brasil-navy/30" />
        </div>
      )}
      <p className="font-bold text-brasil-navy text-lg">{title}</p>
      {description && (
        <p className="text-sm text-brasil-navy/50 mt-1 max-w-xs">{description}</p>
      )}
      {action && (
        <BrasilButton variant="outline" size="sm" className="mt-4" onClick={action.onClick}>
          {action.label}
        </BrasilButton>
      )}
    </div>
  );
}