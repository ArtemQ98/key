import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { Button } from "./Button";

interface CalendarProps {
  /** Заблокированные даты в формате YYYY-MM-DD */
  blocked?: string[];
  /** Нижняя граница — раньше этой даты кликать нельзя */
  min?: string;
  /** Выбранный диапазон */
  from?: string;
  to?: string;
  /** Callback при выборе диапазона */
  onSelect?: (range: { from: string; to: string }) => void;
}

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (y: number, m: number, d: number) =>
  `${y}-${pad(m + 1)}-${pad(d)}`;

export function Calendar({
  blocked = [],
  min,
  from,
  to,
  onSelect,
}: CalendarProps) {
  const today = new Date();
  const [cursor, setCursor] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1),
  );

  const y = cursor.getFullYear();
  const m = cursor.getMonth();
  const firstDay = new Date(y, m, 1);
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  // Понедельник = 0, воскресенье = 6
  const offset = (firstDay.getDay() + 6) % 7;

  const cells: Array<{ day: number; value: string } | null> = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, value: iso(y, m, d) });
  }

  const isBlocked = (v: string) => blocked.includes(v);
  const isBeforeMin = (v: string) => (min ? v < min : false);
  const isSelected = (v: string) => v === from || v === to;
  const isInRange = (v: string) =>
    !!(from && to && v > from && v < to);

  const handleClick = (v: string) => {
    if (isBlocked(v) || isBeforeMin(v)) return;
    if (!onSelect) return;
    if (!from || (from && to)) {
      onSelect({ from: v, to: "" });
      return;
    }
    if (v <= from) {
      onSelect({ from: v, to: "" });
      return;
    }
    onSelect({ from, to: v });
  };

  return (
    <div className="w-full select-none">
      <div className="mb-3 flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setCursor(new Date(y, m - 1, 1))}
          aria-label="Предыдущий месяц"
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
          onClick={() => setCursor(new Date(y, m + 1, 1))}
          aria-label="Следующий месяц"
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

      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((cell, i) =>
          cell === null ? (
            <div key={`empty-${i}`} />
          ) : (
            <button
              key={cell.value}
              type="button"
              onClick={() => handleClick(cell.value)}
              disabled={isBlocked(cell.value) || isBeforeMin(cell.value)}
              className={cn(
                "flex h-9 items-center justify-center rounded-lg text-sm transition-colors",
                "hover:bg-secondary/60 disabled:cursor-not-allowed disabled:opacity-40",
                isBlocked(cell.value) && "bg-muted text-muted-foreground",
                isSelected(cell.value) &&
                  "bg-primary text-primary-foreground hover:bg-primary/90",
                isInRange(cell.value) &&
                  "bg-primary/10 text-foreground hover:bg-primary/20",
              )}
            >
              {cell.day}
            </button>
          ),
        )}
      </div>
    </div>
  );
}