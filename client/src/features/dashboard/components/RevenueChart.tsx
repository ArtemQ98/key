import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button, Skeleton } from "@/components/ui";
import { useRevenueChart } from "@/hooks/useDashboard";
import { money } from "@/lib/format";
import { EASE_OUT } from "@/components/animations";
import { cn } from "@/lib/cn";

// Генерирует ключ YYYY-MM для месяца со сдвигом
function monthKey(offset = 0): string {
  const d = new Date();
  d.setDate(1); // защита от 31 числа
  d.setMonth(d.getMonth() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// Читаемое название месяца: "сентябрь 2026 г."
function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString("ru-RU", {
    month: "long",
    year: "numeric",
  });
}

export function RevenueChart() {
  // 0 = текущий, -1 = прошлый, -2 = позапрошлый…
  const [offset, setOffset] = useState(0);
  const month = monthKey(offset);

  const chartQuery = useRevenueChart(month);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const days = chartQuery.data?.days ?? [];
  const total = chartQuery.data?.total ?? 0;
  const maxAmount = useMemo(
    () => Math.max(...days.map((d) => d.amount), 1),
    [days],
  );

  const isCurrent = offset === 0;
  const isFuture = offset > 0;

  // Дальше — обычный рендер (без early return!)
  const hasData = days.some((d) => d.amount > 0);
  const avgPerDay = days.length ? total / days.length : 0;
  const bestDay = days.reduce(
    (best, d) => (d.amount > best.amount ? d : best),
    days[0] ?? { date: "", amount: 0 },
  );

  return (
    <div className="space-y-4">
      {/* Переключатель месяцев */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setOffset((o) => o - 1)}
            aria-label="Предыдущий месяц"
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="min-w-[130px] text-center text-sm font-medium capitalize">
            {monthLabel(month)}
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setOffset((o) => o + 1)}
            disabled={isFuture}
            aria-label="Следующий месяц"
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {!isCurrent && (
          <button
            type="button"
            onClick={() => setOffset(0)}
            className="text-xs font-medium text-primary transition-colors hover:text-primary/80"
          >
            К текущему
          </button>
        )}
      </div>

      {/* Сводка */}
      {chartQuery.isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
      ) : (
        <div>
          <div className="text-3xl font-semibold tracking-tight">
            {money(total)}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {hasData
              ? `Средний день ${money(avgPerDay)} · лучший ${new Date(bestDay.date).getDate()} числа — ${money(bestDay.amount)}`
              : "Пока нет доходов в этом месяце"}
          </p>
        </div>
      )}

      {/* График */}
      {chartQuery.isLoading ? (
        <Skeleton className="h-32 w-full" />
      ) : (
        <div className="relative">
          {/* Тултип при hover */}
          {hoveredIndex !== null && days[hoveredIndex] && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
              className="pointer-events-none absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-border bg-card px-3 py-2 shadow-elevated"
            >
              <div className="whitespace-nowrap text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                {new Date(days[hoveredIndex].date).toLocaleDateString("ru-RU", {
                  day: "numeric",
                  month: "long",
                })}
              </div>
              <div className="whitespace-nowrap text-sm font-semibold">
                {money(days[hoveredIndex].amount)}
              </div>
            </motion.div>
          )}

          <div className="flex h-32 items-end gap-1">
            {days.map((day, i) => {
              const heightPct = hasData ? (day.amount / maxAmount) * 100 : 5;
              const isHovered = hoveredIndex === i;
              const isToday =
                day.date === new Date().toISOString().slice(0, 10);

              return (
                <button
                  key={`${month}-${day.date}`}
                  type="button"
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className="group relative flex-1 cursor-pointer"
                  style={{ height: "100%" }}
                  aria-label={`${day.date}: ${money(day.amount)}`}
                >
                  <motion.div
                    key={month}
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(heightPct, 3)}%` }}
                    transition={{
                      duration: 0.5,
                      delay: i * 0.015,
                      ease: EASE_OUT,
                    }}
                    className={cn(
                      "absolute bottom-0 left-0 right-0 rounded-t transition-colors",
                      isHovered
                        ? "bg-primary"
                        : isToday
                          ? "bg-primary/70"
                          : "bg-foreground/15",
                    )}
                  />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Метки дней */}
      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
        <span>1</span>
        <span>10</span>
        <span>20</span>
        <span>{days.length}</span>
      </div>
    </div>
  );
}