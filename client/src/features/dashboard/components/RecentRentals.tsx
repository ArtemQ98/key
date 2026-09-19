import { Link } from "react-router-dom";
import type { Rental } from "@/api/types";
import { Avatar, RentalStatusBadge, Skeleton } from "@/components/ui";
import { money } from "@/lib/format";
import { formatDateShort } from "@/lib/dates";

interface RecentRentalsProps {
  rentals: Rental[];
  loading?: boolean;
}

export function RecentRentals({ rentals, loading }: RecentRentalsProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (!rentals.length) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        Здесь пока нет аренд
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {rentals.slice(0, 5).map((r) => (
        <Link
          key={r.id}
          to="/app/rentals"
          className="flex items-center gap-3 py-3 transition-colors hover:bg-secondary/40"
        >
          <Avatar name={r.client || "К"} size="md" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium">{r.client}</div>
            <div className="truncate text-xs text-muted-foreground">
              {r.car}
              {r.starts_at && (
                <>
                  {" · "}
                  {formatDateShort(r.starts_at)}
                  {r.ends_at && ` — ${formatDateShort(r.ends_at)}`}
                </>
              )}
            </div>
          </div>
          <RentalStatusBadge status={r.status} />
          <div className="hidden w-24 text-right sm:block">
            <div className="text-sm font-semibold">
              {money(r.final_total || r.amount)}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}