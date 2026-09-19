import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

interface EmptyProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function Empty({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-card/50 px-6 py-16 text-center",
        className,
      )}
    >
      {Icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
      )}
      <div className="space-y-1">
        <h3 className="text-sm font-medium">{title}</h3>
        {description && (
          <p className="max-w-sm text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}