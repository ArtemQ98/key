import { CalendarDays, Clock3, Wallet, CircleDollarSign } from "lucide-react";
import type { Rental } from "@/api/types";
import { money } from "@/lib/format";

export function RentalKpis({ rentals }: { rentals: Rental[] }) {
  const inWork = rentals.filter((r) =>
    ["confirmed", "preparing", "active"].includes(r.status),
  ).length;

  const pending = rentals.filter((r) =>
    ["pending", "review"].includes(r.status),
  ).length;

  const revenue = rentals
    .filter((r) => ["active", "returned", "completed"].includes(r.status))
    .reduce((a, r) => a + Number(r.final_total || r.amount || 0), 0);

  const deposits = rentals
    .filter(
      (r) => !["cancelled", "rejected", "expired"].includes(r.status),
    )
    .reduce((a, r) => a + Number(r.deposit || 0), 0);

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Kpi
        icon={CalendarDays}
        label="В работе"
        value={inWork}
      />
      <Kpi
        icon={Clock3}
        label="Ожидают решения"
        value={pending}
        highlight={pending > 0}
      />
      <Kpi
        icon={Wallet}
        label="Выручка"
        value={money(revenue)}
      />
      <Kpi
        icon={CircleDollarSign}
        label="Депозиты"
        value={money(deposits)}
      />
    </div>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4 shadow-card">
      <div
        className={
          "flex h-10 w-10 items-center justify-center rounded-lg " +
          (highlight
            ? "bg-[hsl(var(--warning))]/15 text-[hsl(var(--warning))]"
            : "bg-secondary text-muted-foreground")
        }
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        <div className="mt-0.5 text-lg font-semibold tracking-tight">
          {value}
        </div>
      </div>
    </div>
  );
}