import { useState } from "react";
import { ChevronRight, CircleDollarSign } from "lucide-react";
import { PageHead } from "@/components/layout";
import { Empty, Skeleton } from "@/components/ui";
import { useCars } from "@/hooks/useCars";
import { CarFinanceModal } from "@/features/cars";
import { money } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { Car } from "@/api/types";

export function FinancePage() {
  const carsQuery = useCars();
  const [selected, setSelected] = useState<Car | null>(null);

  const cars = carsQuery.data ?? [];

  // Общая сводка по парку
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
          <Stat
            label="Заработано"
            value={money(totalEarnings)}
            tone="success"
          />
          <Stat label="Расходы" value={money(totalExpenses)} />
          <Stat
            label="Итого"
            value={money(totalNet)}
            tone={totalNet >= 0 ? "success" : "danger"}
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
              className="flex w-full items-center gap-4 rounded-xl border border-border bg-card p-5 text-left shadow-card transition-colors hover:bg-secondary/40"
            >
              <div className="flex min-w-0 flex-1 items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
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

              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
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

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "success" | "danger";
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card">
      <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div
        className={cn(
          "mt-1 text-xl font-semibold tracking-tight",
          tone === "success" && "text-[hsl(var(--success))]",
          tone === "danger" && "text-destructive",
        )}
      >
        {value}
      </div>
    </div>
  );
}