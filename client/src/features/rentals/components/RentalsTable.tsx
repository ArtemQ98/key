import { ChevronRight } from "lucide-react";
import type { Rental } from "@/api/types";
import { Avatar, RentalStatusBadge } from "@/components/ui";
import { money } from "@/lib/format";
import { formatDateShort } from "@/lib/dates";
import { cn } from "@/lib/cn";

const nextStatus: Record<string, { to: string; label: string } | undefined> = {
  confirmed: { to: "preparing", label: "Подготовить" },
  preparing: { to: "active", label: "Выдать авто" },
  active: { to: "returned", label: "Принять возврат" },
  returned: { to: "completed", label: "Закрыть" },
};

interface RentalsTableProps {
  rentals: Rental[];
  onOpen: (id: number) => void;
  onAdvance: (id: number, status: string) => void;
}

export function RentalsTable({ rentals, onOpen, onAdvance }: RentalsTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <th className="px-4 py-3">Клиент</th>
            <th className="px-4 py-3">Автомобиль</th>
            <th className="px-4 py-3">Период</th>
            <th className="px-4 py-3">Статус</th>
            <th className="px-4 py-3 text-right">Сумма</th>
            <th className="w-10" />
          </tr>
        </thead>
        <tbody>
          {rentals.map((r) => {
            const next = nextStatus[r.status];
            return (
              <tr
                key={r.id}
                onClick={() => onOpen(r.id)}
                className="cursor-pointer border-b border-border transition-colors last:border-b-0 hover:bg-secondary/40"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={r.client || "К"} size="sm" />
                    <div className="min-w-0">
                      <div className="truncate font-medium">{r.client}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {r.phone || "Телефон не указан"}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="truncate">{r.car}</div>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {r.starts_at ? (
                    <span className="text-xs">
                      {formatDateShort(r.starts_at)}
                      {" — "}
                      {formatDateShort(r.ends_at)}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-4 py-3">
                  <RentalStatusBadge status={r.status} />
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="font-semibold">
                    {money(r.final_total || r.amount)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {r.payment_status === "paid" ? "Оплачено" : "Не оплачено"}
                  </div>
                </td>
                <td
                  className="px-4 py-3"
                  onClick={(e) => e.stopPropagation()}
                >
                  {next ? (
                    <button
                      onClick={() => onAdvance(r.id, next.to)}
                      className="flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-secondary"
                    >
                      {next.label}
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => onOpen(r.id)}
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary",
                      )}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}