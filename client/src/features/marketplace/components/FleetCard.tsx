import { Link } from "react-router-dom";
import { ChevronRight, MapPin } from "lucide-react";
import type { PublicFleet } from "@/api/types";

export function FleetCard({ fleet }: { fleet: PublicFleet }) {
  return (
    <Link
      to={`/fleet/${fleet.slug}`}
      className="group block h-full rounded-2xl border border-border bg-card p-5 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-elevated"
    >
      <div className="flex w-full items-start gap-4">
        {fleet.avatar_url ? (
        <img
          src={fleet.avatar_url}
          alt={fleet.title}
          className="h-12 w-12 shrink-0 rounded-xl object-cover shadow-brand transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-500 text-lg font-bold text-white shadow-brand transition-transform duration-300 group-hover:scale-105">
          {fleet.title.slice(0, 1).toUpperCase()}
        </div>
      )}

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold">{fleet.title}</h3>
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

        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-foreground" />
      </div>
    </Link>
  );
}
