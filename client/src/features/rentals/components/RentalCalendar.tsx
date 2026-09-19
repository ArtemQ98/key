import { useMemo, useState } from "react";
import { CarFront } from "lucide-react";
import { Skeleton } from "@/components/ui";
import { useRentalCalendar } from "@/hooks/useRentals";
import { money } from "@/lib/format";
import { todayISO, addDaysISO } from "@/lib/dates";
import { cn } from "@/lib/cn";

interface RentalCalendarProps {
  onOpenBooking: (id: number) => void;
}

const RANGES = [14, 30] as const;

export function RentalCalendar({ onOpenBooking }: RentalCalendarProps) {
  const [range, setRange] = useState<(typeof RANGES)[number]>(30);

  const from = todayISO();
  const to = addDaysISO(range);

  const { data, isLoading } = useRentalCalendar(from, to);

  const days = useMemo(() => {
    const result: string[] = [];
    for (let i = 0; i < range; i++) {
      result.push(addDaysISO(i));
    }
    return result;
  }, [range]);

  return (
    <section className="rounded-xl border border-border bg-card shadow-card">
      <div className="flex items-center justify-between border-b border-border p-5">
        <div>
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Планирование
          </div>
          <h3 className="mt-0.5 text-base font-semibold">Календарь загрузки</h3>
        </div>
        <div className="inline-flex rounded-lg bg-secondary p-1">
          {RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                range === r
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {r} дней
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2 p-5">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      ) : data?.cars?.length ? (
        <div className="overflow-x-auto">
          <div className="min-w-[900px] p-5">
            {/* Заголовки дней */}
            <div className="mb-3 flex items-center gap-3">
              <div className="w-44 shrink-0" />
              <div className="flex flex-1 gap-0.5">
                {days.map((d) => {
                  const date = new Date(`${d}T12:00:00`);
                  const isToday = d === from;
                  return (
                    <div
                      key={d}
                      className={cn(
                        "flex-1 min-w-6 text-center text-[10px] font-medium",
                        isToday ? "text-foreground" : "text-muted-foreground",
                      )}
                    >
                      <div>{date.getDate()}</div>
                      <div className="opacity-60">
                        {date.toLocaleDateString("ru-RU", { weekday: "short" }).slice(0, 2)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Строки машин */}
            <div className="space-y-2">
              {data.cars.map((c) => (
                <div key={c.id} className="flex items-center gap-3">
                  <div className="flex w-44 shrink-0 items-center gap-2">
                    <CarFront className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{c.car}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {c.plate} · {money(c.daily_price)}/сут
                      </div>
                    </div>
                  </div>

                  <div className="relative flex h-9 flex-1 gap-0.5">
                    {/* Фоновая сетка */}
                    {days.map((d) => (
                      <div
                        key={d}
                        className={cn(
                          "flex-1 rounded border border-border/50",
                          d === from && "border-foreground/20",
                        )}
                      />
                    ))}

                    {/* Брони — абсолютно спозиционированные */}
                    {c.bookings.map((b) => {
                      const startIdx = days.indexOf(b.starts_at.slice(0, 10));
                      const endIdx = days.indexOf(b.ends_at.slice(0, 10));
                      if (startIdx === -1 && endIdx === -1) return null;

                      const realStart = startIdx === -1 ? 0 : startIdx;
                      const realEnd = endIdx === -1 ? days.length : endIdx;
                      const width = ((realEnd - realStart) / days.length) * 100;
                      const left = (realStart / days.length) * 100;

                      const tone =
                        b.status === "active"
                          ? "bg-[hsl(var(--success))]/20 text-[hsl(var(--success))] border-[hsl(var(--success))]/30"
                          : b.status === "confirmed" || b.status === "preparing"
                            ? "bg-primary/15 text-foreground border-primary/30"
                            : "bg-[hsl(var(--warning))]/20 text-[hsl(var(--warning))] border-[hsl(var(--warning))]/30";

                      return (
                        <button
                          key={b.id}
                          onClick={() => onOpenBooking(b.id)}
                          style={{ left: `${left}%`, width: `${width}%` }}
                          className={cn(
                            "absolute top-0 h-full overflow-hidden rounded-md border px-2 text-left text-[11px] font-medium transition-opacity hover:opacity-80",
                            tone,
                          )}
                        >
                          <span className="block truncate">{b.client || b.code}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center text-sm text-muted-foreground">
          Машин пока нет
        </div>
      )}
    </section>
  );
}