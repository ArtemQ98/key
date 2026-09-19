import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { AnimatedNumber } from "@/components/animations/AnimatedNumber";

export type MetricTone =
  | "blue"
  | "purple"
  | "green"
  | "orange"
  | "pink"
  | "cyan";

interface MetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub?: string;
  trend?: string;
  tone?: MetricTone;
  format?: (n: number) => string;
  loading?: boolean;
  className?: string;
}

const toneClasses: Record<MetricTone, string> = {
  blue: "bg-gradient-to-br from-blue-500 to-indigo-500",
  purple: "bg-gradient-to-br from-violet-500 to-purple-500",
  green: "bg-gradient-to-br from-emerald-500 to-green-500",
  orange: "bg-gradient-to-br from-orange-500 to-amber-500",
  pink: "bg-gradient-to-br from-pink-500 to-rose-500",
  cyan: "bg-gradient-to-br from-cyan-500 to-sky-500",
};

const toneShadow: Record<MetricTone, string> = {
  blue: "group-hover:shadow-blue-500/30",
  purple: "group-hover:shadow-violet-500/30",
  green: "group-hover:shadow-emerald-500/30",
  orange: "group-hover:shadow-orange-500/30",
  pink: "group-hover:shadow-pink-500/30",
  cyan: "group-hover:shadow-cyan-500/30",
};

export function MetricCard({
  icon: Icon,
  label,
  value,
  sub,
  trend,
  tone = "blue",
  format,
  loading,
  className,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border border-border bg-card p-5 shadow-card transition-all duration-300 hover:shadow-elevated hover:-translate-y-0.5",
        className,
      )}
    >
      {/* Мягкое свечение при hover */}
      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-100",
          tone === "blue" && "from-blue-500/[0.04] to-transparent",
          tone === "purple" && "from-violet-500/[0.04] to-transparent",
          tone === "green" && "from-emerald-500/[0.04] to-transparent",
          tone === "orange" && "from-orange-500/[0.04] to-transparent",
          tone === "pink" && "from-pink-500/[0.04] to-transparent",
          tone === "cyan" && "from-cyan-500/[0.04] to-transparent",
        )}
      />

      <div className="relative flex items-start justify-between gap-3">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <span
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg text-white shadow-sm transition-all duration-300 group-hover:scale-110 group-hover:rotate-3",
            toneClasses[tone],
            toneShadow[tone],
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>

      <div className="relative mt-3">
        <div className="text-2xl font-semibold tracking-tight">
          {loading ? (
            <span className="text-muted-foreground">—</span>
          ) : typeof value === "number" ? (
            <AnimatedNumber value={value} format={format} />
          ) : (
            value
          )}
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