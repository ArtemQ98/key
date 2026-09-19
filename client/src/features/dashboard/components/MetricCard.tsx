import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/cn";

interface MetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub?: string;
  trend?: string;
  loading?: boolean;
  className?: string;
}

export function MetricCard({
  icon: Icon,
  label,
  value,
  sub,
  trend,
  loading,
  className,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-5 shadow-card",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-3">
        <div className="text-2xl font-semibold tracking-tight">
          {loading ? <span className="text-muted-foreground">—</span> : value}
        </div>
        {trend && (
          <div className="mt-1 flex items-center gap-1 text-xs font-medium text-[hsl(var(--success))]">
            <ArrowUpRight className="h-3 w-3" />
            {trend}
          </div>
        )}
        {sub && (
          <div className="mt-1 text-xs text-muted-foreground">{sub}</div>
        )}
      </div>
    </div>
  );
}