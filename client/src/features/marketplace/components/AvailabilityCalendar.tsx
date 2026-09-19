import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button, Spinner } from "@/components/ui";
import { useAvailabilityDates } from "@/hooks/useMarketplace";
import { cn } from "@/lib/cn";
import { dateOnly, todayISO } from "@/lib/dates";

interface AvailabilityCalendarProps {
  carId: number;
  from: string;
  to: string;
  onChange: (range: { from: string; to: string }) => void;
}

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

export function AvailabilityCalendar({
  carId,
  from,
  to,
  onChange,
}: AvailabilityCalendarProps) {
  const today = todayISO();
  const [cursor, setCursor] = useState(() => {
    const d = new Date(`${today}T12:00:00`);
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const monthStart = dateOnly(
    new Date(cursor.getFullYear(), cursor.getMonth(), 1),
  );
  const monthEnd = dateOnly(
    new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0),
  );

  const availability = useAvailabilityDates(carId, monthStart, monthEnd);
  const blocked = availability.data?.blocked ?? [];

  // Сброс cursor при смене машины
  useEffect(() => {
    const d = new Date(`${today}T12:00:00`);
    setCursor(new Date(d.getFullYear(), d.getMonth(), 1));
  }, [carId, today]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = (new Date(year, month, 1).getDay() + 6) % 7;

  const cells: Array<{ day: number; value: string } | null> = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({
      day: d,
      value: dateOnly(new Date(year, month, d)),
    });
  }

  function handleClick(v: string) {
    if (blocked.includes(v) || v < today) return;

    // Нет from или есть оба → начинаем новый диапазон
    if (!from || (from && to)) {
      onChange({ from: v, to: "" });
      return;
    }

    // from уже выбран, to ещё нет
    if (v <= from) {
      onChange({ from: v, to: "" });
      return;
    }

    onChange({ from, to: v });
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-4 flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() =>
            setCursor(new Date(year, month - 1, 1))
          }
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-sm font-semibold capitalize">
          {cursor.toLocaleDateString("ru-RU", {
            month: "long",
            year: "numeric",
          })}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() =>
            setCursor(new Date(year, month + 1, 1))
          }
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      {availability.isLoading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : (
        <div className="mt-1 grid grid-cols-7 gap-1">
          {cells.map((cell, i) => {
            if (cell === null) return <div key={`e-${i}`} />;

            const isBlocked = blocked.includes(cell.value);
            const isPast = cell.value < today;
            const selected = cell.value === from || cell.value === to;
            const inRange = !!from && !!to && cell.value > from && cell.value < to;

            return (
              <button
                key={cell.value}
                type="button"
                disabled={isBlocked || isPast}
                onClick={() => handleClick(cell.value)}
                className={cn(
                  "flex h-9 items-center justify-center rounded-lg text-sm transition-colors",
                  isPast &&
                    "cursor-not-allowed text-muted-foreground/40 line-through",
                  isBlocked &&
                    !isPast &&
                    "cursor-not-allowed bg-muted text-muted-foreground/60 line-through",
                  !isBlocked &&
                    !isPast &&
                    "hover:bg-secondary/60",
                  selected &&
                    "bg-primary text-primary-foreground hover:bg-primary/90",
                  inRange &&
                    !selected &&
                    "bg-primary/10 text-foreground",
                )}
              >
                {cell.day}
              </button>
            );
          })}
        </div>
      )}

      {/* Легенда */}
      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded border border-border bg-background" />
          свободно
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-muted" />
          занято
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-primary" />
          выбрано
        </span>
      </div>
    </div>
  );
}