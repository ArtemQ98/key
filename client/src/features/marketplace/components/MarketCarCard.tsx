import { motion } from "framer-motion";
import { CarFront, MapPin } from "lucide-react";
import type { PublicCar } from "@/api/types";
import { money } from "@/lib/format";
import { EASE_OUT } from "@/components/animations";

interface MarketCarCardProps {
  car: PublicCar;
  onClick: () => void;
}

export function MarketCarCard({ car, onClick }: MarketCarCardProps) {
  return (
    <motion.button
      type="button"
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25, ease: EASE_OUT }}
      onClick={onClick}
      className="group flex h-full w-full flex-col overflow-hidden rounded-2xl border border-border bg-card text-left shadow-card transition-shadow hover:shadow-elevated"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-secondary/40">
        {car.image_url ? (
          <motion.img
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.5, ease: EASE_OUT }}
            src={car.image_url}
            alt={`${car.brand} ${car.model}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <CarFront
              className="h-16 w-16 text-muted-foreground/30"
              strokeWidth={1.2}
            />
          </div>
        )}

        <span className="absolute left-3 top-3 rounded-full bg-[hsl(var(--success))]/90 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
          Доступно
        </span>
      </div>

      <div className="flex flex-1 flex-col space-y-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
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

        <div className="mt-auto flex items-center justify-between border-t border-border pt-3 text-xs">
          <span className="truncate font-medium">{car.fleet_title}</span>
          <span className="flex shrink-0 items-center gap-1 text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {car.location}
          </span>
        </div>
      </div>
    </motion.button>
  );
}

function Spec({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">
      {children}
    </span>
  );
}