import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import type { RentalStatus } from "@/api/types";

const STEPS: Array<{ key: RentalStatus; label: string }> = [
  { key: "confirmed", label: "Бронь" },
  { key: "preparing", label: "Подготовка" },
  { key: "active", label: "Выдача" },
  { key: "returned", label: "Возврат" },
  { key: "completed", label: "Закрытие" },
];

const ORDER: Record<RentalStatus, number> = {
  hold: 0,
  pending: 0,
  review: 0,
  confirmed: 1,   // бронь подтверждена → активен шаг 2 «Подготовка»
  preparing: 2,   // готовим → активен шаг 3 «Выдача»
  active: 3,      // выдана → активен шаг 4 «Возврат»
  returned: 4,    // возвращена → активен шаг 5 «Закрытие»
  completed: 5,   // всё ✅
  cancelled: -1,
  expired: -1,
  rejected: -1,
};

export function RentalProgress({ status }: { status: RentalStatus }) {
  const current = ORDER[status] ?? -1;
  const cancelled = ["cancelled", "expired", "rejected"].includes(status);

  return (
    <div className="flex items-center gap-1">
      {STEPS.map((step, i) => {
        const done = i < current;
        const active = i === current && !cancelled && current >= 0;
        return (
          <div key={step.key} className="flex flex-1 items-center gap-1">
            <div className="flex flex-1 flex-col items-center gap-1.5">
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full border-2 transition-colors",
                  done &&
                    "border-[hsl(var(--success))] bg-[hsl(var(--success))] text-white",
                  active &&
                    !cancelled &&
                    "border-primary bg-primary text-primary-foreground",
                  active &&
                    cancelled &&
                    "border-destructive bg-destructive text-white",
                  !done &&
                    !active &&
                    "border-border bg-background text-muted-foreground",
                )}
              >
                {done ? (
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                ) : (
                  <span className="text-[10px] font-semibold">{i + 1}</span>
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] font-medium uppercase tracking-wide",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  "h-0.5 flex-1 -mt-5",
                  done ? "bg-[hsl(var(--success))]" : "bg-border",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}