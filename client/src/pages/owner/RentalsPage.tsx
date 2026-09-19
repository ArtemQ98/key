import { useState } from "react";
import { CalendarDays, Plus } from "lucide-react";
import { PageHead } from "@/components/layout";
import { Button, Empty } from "@/components/ui";
import { useRentals, useUpdateRentalStatus } from "@/hooks/useRentals";
import {
  NewRentalModal,
  RentalCalendar,
  RentalDetailModal,
  RentalKpis,
  RentalsTable,
} from "@/features/rentals";
import type { RentalStatus } from "@/api/types";
import { cn } from "@/lib/cn";
import { toast } from "sonner";

const FILTERS: Array<{ key: RentalStatus | "all"; label: string }> = [
  { key: "all", label: "Все" },
  { key: "pending", label: "Новые" },
  { key: "confirmed", label: "Подтверждены" },
  { key: "active", label: "В аренде" },
  { key: "returned", label: "Возврат" },
];

export function RentalsPage() {
  const rentalsQuery = useRentals();
  const updateStatus = useUpdateRentalStatus();
  const [filter, setFilter] = useState<RentalStatus | "all">("all");
  const [newOpen, setNewOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const rentals = rentalsQuery.data ?? [];
  const visible = rentals.filter((r) => filter === "all" || r.status === filter);

  function handleAdvance(id: number, status: string) {
    updateStatus.mutate(
      { id, status: status as RentalStatus },
      {
        onSuccess: () => toast.success("Статус обновлён"),
        onError: (e) => toast.error(e instanceof Error ? e.message : "Ошибка"),
      },
    );
  }

  return (
    <>
      <PageHead
        eyebrow="Rental Core"
        title="Аренды"
        description="Полный жизненный цикл сделки: бронь → подготовка → выдача → возврат → деньги."
        action={
          <Button onClick={() => setNewOpen(true)}>
            <Plus className="h-4 w-4" />
            Новая аренда
          </Button>
        }
      />

      <RentalKpis rentals={rentals} />

      <div className="mb-6">
        <RentalCalendar onOpenBooking={(id) => setSelectedId(id)} />
      </div>

      <section className="rounded-xl border border-border bg-card shadow-card">
        <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Сделки
            </div>
            <h3 className="mt-0.5 text-base font-semibold">Все аренды</h3>
          </div>
          <div className="flex flex-wrap gap-1">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  filter === f.key
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {rentalsQuery.isLoading ? (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Загружаем…
          </div>
        ) : visible.length ? (
          <RentalsTable
            rentals={visible}
            onOpen={(id) => setSelectedId(id)}
            onAdvance={handleAdvance}
          />
        ) : (
          <div className="p-8">
            <Empty
              icon={CalendarDays}
              title="Аренд с таким статусом нет"
              description="Попробуйте другой фильтр или создайте новую сделку."
            />
          </div>
        )}
      </section>

      <NewRentalModal open={newOpen} onOpenChange={setNewOpen} />

      <RentalDetailModal
        rentalId={selectedId}
        onOpenChange={(open) => !open && setSelectedId(null)}
        />
    </>
  );
}