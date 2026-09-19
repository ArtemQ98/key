import { CalendarDays, Clock3, Wallet, CircleDollarSign } from "lucide-react";
import type { Rental } from "@/api/types";
import { money } from "@/lib/format";
import { MetricCard } from "@/features/dashboard";

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
      <MetricCard
        icon={CalendarDays}
        label="В работе"
        value={inWork}
        tone="blue"
      />
      <MetricCard
        icon={Clock3}
        label="Ожидают решения"
        value={pending}
        tone={pending > 0 ? "orange" : "green"}
        sub={pending > 0 ? "требуют внимания" : "всё под контролем"}
      />
      <MetricCard
        icon={Wallet}
        label="Выручка"
        value={money(revenue)}
        tone="green"
      />
      <MetricCard
        icon={CircleDollarSign}
        label="Депозиты"
        value={money(deposits)}
        tone="purple"
      />
    </div>
  );
}