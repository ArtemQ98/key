import type { RentalDetail } from "@/api/rentals";
import { money } from "@/lib/format";
import { formatRange } from "@/lib/dates";

export function RentalStats({ rental }: { rental: RentalDetail }) {
  const items: Array<{ label: string; value: string; tone?: "success" | "warning" | "danger" }> = [
    {
      label: "Период",
      value: formatRange(rental.starts_at, rental.ends_at),
    },
    {
      label: "Сумма",
      value: money(rental.final_total || rental.amount),
    },
    {
      label: "Депозит",
      value: money(rental.deposit),
    },
    {
      label: "Оплата",
      value: rental.payment_status === "paid" ? "Оплачено" : "Не оплачено",
      tone: rental.payment_status === "paid" ? "success" : "warning",
    },
    {
      label: "Доп. услуги",
      value: money(rental.extras?.reduce((a, e) => a + Number(e.total), 0) ?? 0),
    },
    {
      label: "Расходы",
      value: money(rental.expenses_total),
      tone: rental.expenses_total > 0 ? "warning" : undefined,
    },
    {
      label: "Профит",
      value: money(rental.profit),
      tone: rental.profit >= 0 ? "success" : "danger",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-secondary/30 p-4 sm:grid-cols-4">
      {items.map((it) => (
        <div key={it.label} className="space-y-1">
          <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            {it.label}
          </div>
          <div
            className={
              "text-sm font-semibold " +
              (it.tone === "success"
                ? "text-[hsl(var(--success))]"
                : it.tone === "warning"
                  ? "text-[hsl(var(--warning))]"
                  : it.tone === "danger"
                    ? "text-destructive"
                    : "")
            }
          >
            {it.value}
          </div>
        </div>
      ))}
    </div>
  );
}