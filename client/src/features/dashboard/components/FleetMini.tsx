import { CarFront } from "lucide-react";
import type { Car } from "@/api/types";
import { CarStatusBadge, Empty } from "@/components/ui";
import { money } from "@/lib/format";
import { cn } from "@/lib/cn";

const dotColor: Record<string, string> = {
  available: "bg-[hsl(var(--success))]",
  rented: "bg-[hsl(var(--warning))]",
  maintenance: "bg-destructive",
};

export function FleetMini({ cars }: { cars: Car[] }) {
  if (!cars.length) {
    return (
      <Empty
        icon={CarFront}
        title="Машин пока нет"
        description="Добавьте первый автомобиль в автопарк."
      />
    );
  }

  return (
    <div className="space-y-1">
      {cars.slice(0, 5).map((c) => (
        <div
          key={c.id}
          className="flex items-center gap-3 rounded-lg py-2 px-2 transition-colors hover:bg-secondary/40"
        >
          <span
            className={cn(
              "h-2 w-2 shrink-0 rounded-full",
              dotColor[c.status] ?? "bg-muted-foreground",
            )}
          />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">
              {c.brand} {c.model}
            </div>
            <div className="truncate text-xs text-muted-foreground">
              {c.plate} · {money(c.daily_price)}/день
            </div>
          </div>
          <CarStatusBadge status={c.status} />
        </div>
      ))}
    </div>
  );
}