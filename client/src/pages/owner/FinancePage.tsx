import { useState } from "react";
import {
  ChevronRight,
  CircleDollarSign,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { PageHead } from "@/components/layout";
import { Empty, Skeleton } from "@/components/ui";
import { MetricCard } from "@/features/dashboard";
import { useCars } from "@/hooks/useCars";
import { CarFinanceModal } from "@/features/cars";
import { money } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { Car } from "@/api/types";

export function FinancePage() {
  const carsQuery = useCars();
  const [selected, setSelected] = useState<Car | null>(null);

  const cars = carsQuery.data ?? [];

  const totalEarnings = cars.reduce((a, c) => a + (c.earnings || 0), 0);
  const totalExpenses = cars.reduce((a, c) => a + (c.expenses || 0), 0);
  const totalNet = totalEarnings - totalExpenses;

  return (
    <>
      <PageHead
        eyebrow="Финансы"
        title="По каждой машине"
        description="Сколько машина принесла, сколько потрачено и что осталось."
      />

      {cars.length > 0 && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <MetricCard
            icon={TrendingUp}
            label="Заработано"
            value={money(totalEarnings)}
            tone="green"
          />
          <MetricCard
            icon={TrendingDown}
            label="Расходы"
            value={money(totalExpenses)}
            tone="orange"
          />
          <MetricCard
            icon={CircleDollarSign}
            label="Итого"
            value={money(totalNet)}
            tone={totalNet >= 0 ? "cyan" : "pink"}
          />
        </div>
      )}

      {carsQuery.isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : cars.length ? (
        <div className="space-y-3">
          {cars.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelected(c)}
              className="group flex w-full items-center gap-4 rounded-xl border border-border bg-card p-5 text-left shadow-card transition-all duration-300 hover:shadow-elevated hover:-translate-y-0.5 hover:border-primary/20"
            >
              <div className="flex min-w-0 flex-1 items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary transition-transform duration-300 group-hover:scale-110">
                  <CircleDollarSign className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">
                    {c.brand} {c.model}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {c.plate} · {c.location}
                  </div>
                </div>
              </div>

              <div className="hidden text-right sm:block">
                <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Заработала
                </div>
                <div className="text-sm font-semibold">
                  {money(c.earnings || 0)}
                </div>
              </div>

              <div className="hidden text-right sm:block">
                <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Расходы
                </div>
                <div className="text-sm font-semibold">
                  {money(c.expenses || 0)}
                </div>
              </div>

              <div className="text-right">
                <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Итого
                </div>
                <div
                  className={cn(
                    "text-sm font-semibold",
                    (c.earnings || 0) - (c.expenses || 0) >= 0
                      ? "text-[hsl(var(--success))]"
                      : "text-destructive",
                  )}
                >
                  {money((c.earnings || 0) - (c.expenses || 0))}
                </div>
              </div>

              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5" />
            </button>
          ))}
        </div>
      ) : (
        <Empty
          icon={CircleDollarSign}
          title="Машин пока нет"
          description="Добавьте автомобиль — и здесь появится его экономика."
        />
      )}

      <CarFinanceModal
        car={selected}
        onOpenChange={(open) => !open && setSelected(null)}
      />
    </>
  );
}