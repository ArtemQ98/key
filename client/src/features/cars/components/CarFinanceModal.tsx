import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  Button,
  Field,
  Input,
  Modal,
  ModalBody,
  ModalHeader,
  Spinner,
} from "@/components/ui";
import {
  useAddCarExpense,
  useCarFinance,
  useRemoveCarExpense,
} from "@/hooks/useCarFinance";
import { money } from "@/lib/format";
import { formatDate } from "@/lib/dates";
import { cn } from "@/lib/cn";
import type { Car } from "@/api/types";

interface CarFinanceModalProps {
  car: Car | null;
  onOpenChange: (open: boolean) => void;
}

export function CarFinanceModal({ car, onOpenChange }: CarFinanceModalProps) {
  const [form, setForm] = useState({ amount: "", category: "", note: "" });

  const financeQuery = useCarFinance(car?.id ?? null);
  const addMutation = useAddCarExpense();
  const removeMutation = useRemoveCarExpense();

  if (!car) return null;

  const d = financeQuery.data;
  const net = (d?.earnings ?? 0) - (d?.expenses_total ?? 0);

  async function handleAdd() {
    if (!form.amount || Number(form.amount) <= 0) return;
    await addMutation.mutateAsync({
      carId: car!.id,
      input: {
        amount: Number(form.amount),
        category: form.category,
        note: form.note,
      },
    });
    setForm({ amount: "", category: "", note: "" });
  }

  return (
    <Modal open={!!car} onOpenChange={onOpenChange} size="lg">
      <ModalHeader
        title={`${car.brand} ${car.model}`}
        description={`${car.plate} · финансы автомобиля`}
      />

      <ModalBody className="space-y-5">
        {/* Сводка */}
        <div className="grid grid-cols-3 gap-3 rounded-xl border border-border bg-secondary/30 p-4">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Заработано
            </div>
            <div className="mt-1 text-lg font-semibold">
              {money(d?.earnings ?? 0)}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Расходы
            </div>
            <div className="mt-1 text-lg font-semibold">
              {money(d?.expenses_total ?? 0)}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Итого
            </div>
            <div
              className={cn(
                "mt-1 text-lg font-semibold",
                net >= 0 ? "text-[hsl(var(--success))]" : "text-destructive",
              )}
            >
              {money(net)}
            </div>
          </div>
        </div>

        {/* Форма добавления */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[130px_1fr_1fr_auto]">
          <Field label="Сумма">
            <Input
              type="number"
              placeholder="5 000"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
          </Field>
          <Field label="На что">
            <Input
              placeholder="Бензин, мойка…"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
          </Field>
          <Field label="Комментарий">
            <Input
              placeholder="Необязательно"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            />
          </Field>
          <div className="flex items-end">
            <Button
              type="button"
              onClick={handleAdd}
              loading={addMutation.isPending}
              disabled={!form.amount || Number(form.amount) <= 0}
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              Добавить
            </Button>
          </div>
        </div>

        {/* Расходы */}
        <div>
          <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Расходы
          </h4>
          {financeQuery.isLoading ? (
            <div className="flex justify-center py-6">
              <Spinner />
            </div>
          ) : d?.expenses?.length ? (
            <div className="divide-y divide-border">
              {d.expenses.map((x) => (
                <div key={x.id} className="flex items-center gap-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                      {x.category || "Расход"}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {x.note || "Без комментария"} · {formatDate(x.created_at)}
                    </div>
                  </div>
                  <div className="text-sm font-semibold">{money(x.amount)}</div>
                  <button
                    onClick={() => {
                      if (confirm("Удалить расход?")) {
                        removeMutation.mutate({
                          carId: car.id,
                          expenseId: x.id,
                        });
                      }
                    }}
                    className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Расходов пока нет.</p>
          )}
        </div>

        {/* Сделки */}
        <div>
          <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Сделки
          </h4>
          {d?.deals?.length ? (
            <div className="divide-y divide-border">
              {d.deals.map((x) => (
                <div key={x.id} className="flex items-center gap-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">
                      {x.client || "Сделка"}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {x.code} · {formatDate(x.starts_at)}
                    </div>
                  </div>
                  <div className="text-sm font-semibold">{money(x.amount)}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Сделок пока нет.</p>
          )}
        </div>
      </ModalBody>
    </Modal>
  );
}