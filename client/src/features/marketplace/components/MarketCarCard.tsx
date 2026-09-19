import { CarFront, MapPin } from "lucide-react";
import type { PublicCar } from "@/api/types";
import { money } from "@/lib/format";

interface MarketCarCardProps {
  car: PublicCar;
  onClick: () => void;
}

export function MarketCarCard({ car, onClick }: MarketCarCardProps) {
  return (
    <button
      onClick={onClick}
      className="group overflow-hidden rounded-2xl border border-border bg-card text-left shadow-card transition-all hover:shadow-elevated"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-secondary/40">
        {car.image_url ? (
          <img
            src={car.image_url}
            alt={`${car.brand} ${car.model}`}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <CarFront
              className="h-16 w-16 text-muted-foreground/30"
              strokeWidth={1.2}
            />
          </div>
        )}

        <span className="absolute left-3 top-3 rounded-full bg-[hsl(var(--success))]/15 px-2.5 py-1 text-[10px] font-semibold text-[hsl(var(--success))] backdrop-blur-sm">
          Доступно
        </span>
      </div>

      <div className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {car.category || "Автомобиль"}
            </div>
            <h3 className="mt-0.5 truncate text-base font-semibold">
              {car.brand} {car.model}
            </h3>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-base font-semibold">
              {money(car.daily_price)}
            </div>
            <div className="text-[10px] text-muted-foreground">за сутки</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <Spec>{car.year}</Spec>
          <Spec>{car.transmission}</Spec>
          <Spec>{car.seats} мест</Spec>
          <Spec>{car.fuel}</Spec>
        </div>

        <div className="flex items-center justify-between border-t border-border pt-3 text-xs">
          <span className="font-medium">{car.fleet_title}</span>
          <span className="flex items-center gap-1 text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {car.location}
          </span>
        </div>
      </div>
    </button>
  );
}

function Spec({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">
      {children}
    </span>
  );
}