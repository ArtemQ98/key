import { MapPin, Star } from "lucide-react";
import type { PublicFleet } from "@/api/types";

export function FleetCard({ fleet }: { fleet: PublicFleet }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-foreground text-background text-lg font-bold">
          {fleet.title.slice(0, 1)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold">{fleet.title}</h3>
            <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
              <Star className="h-3 w-3 fill-current" />
              {fleet.rating.toFixed(1)}
            </span>
          </div>
          {fleet.description && (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
              {fleet.description}
            </p>
          )}
          <div className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {fleet.city} · {fleet.available_cars} авто
          </div>
        </div>
      </div>
    </div>
  );
}