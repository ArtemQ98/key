import { useState } from "react";
import {
  CalendarDays,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Plus,
  Wallet,
} from "lucide-react";
import { Button, Field, Input, Select } from "@/components/ui";
import { useRentalOp, useScheduleMeeting, useTogglePayment } from "@/hooks/useRentals";
import type { RentalDetail } from "@/api/rentals";
import type { RentalOpType } from "@/api/rentals";
import { cn } from "@/lib/cn";
import { toast } from "sonner";

type Op =
  | "inspection-pickup"
  | "inspection-return"
  | "extra"
  | "extension"
  | "meeting-pickup"
  | "meeting-return"
  | "payment"
  | "expense"
  | "adjustment"
  | "deposit";

interface RentalOpsPanelProps {
  rental: RentalDetail;
}

export function RentalOpsPanel({ rental }: RentalOpsPanelProps) {
  const [op, setOp] = useState<Op | null>(null);
  const [form, setForm] = useState<Record<string, string | number>>({});

  const opMutation = useRentalOp();
  const meetingMutation = useScheduleMeeting();
  const paymentMutation = useTogglePayment();

  function reset() {
    setOp(null);
    setForm({});
  }

  async function save() {
    if (!op) return;
    try {
      if (op === "meeting-pickup" || op === "meeting-return") {
        await meetingMutation.mutateAsync({
          id: rental.id,
          kind: op === "meeting-pickup" ? "pickup" : "return",
          at: String(form.meeting_at || ""),
          location: String(form.meeting_location || ""),
        });
      } else if (op === "payment") {
        await opMutation.mutateAsync({
          id: rental.id,
          input: {
            type: "payment",
            amount: Number(form.amount || 0),
            payment_type: String(form.payment_type || "rental"),
            note: String(form.note || ""),
          },
        });
      } else {
        const payload: Record<string, unknown> = {
          note: form.note,
        };
        const t: RentalOpType =
          op === "inspection-pickup" || op === "inspection-return"
            ? "inspection"
            : (op as RentalOpType);

        payload.type = t;

        if (t === "inspection") {
          payload.kind = op === "inspection-pickup" ? "pickup" : "return";
          payload.mileage = form.mileage ? Number(form.mileage) : undefined;
          payload.fuel_level = form.fuel_level ? Number(form.fuel_level) : undefined;
        } else if (t === "extra") {
          payload.name = form.name;
          payload.qty = Number(form.qty || 1);
          payload.unit_price = Number(form.unit_price || 0);
        } else if (t === "extension") {
          payload.new_end = form.new_end;
        } else if (t === "adjustment") {
          payload.kind = form.kind || "other";
          payload.amount = Number(form.amount || 0);
        } else if (t === "deposit") {
          payload.kind = form.kind || "hold";
          payload.amount = Number(form.amount || 0);
        } else if (t === "expense") {
          payload.kind = form.kind || "other";
          payload.amount = Number(form.amount || 0);
        }

        await opMutation.mutateAsync({ id: rental.id, input: payload as never });
      }
      toast.success("Сохранено");
      reset();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка");
    }
  }

  const busy =
    opMutation.isPending || meetingMutation.isPending || paymentMutation.isPending;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <OpBtn active={op === "inspection-pickup"} onClick={() => setOp("inspection-pickup")} icon={ClipboardCheck}>
          Осмотр при выдаче
        </OpBtn>
        <OpBtn active={op === "inspection-return"} onClick={() => setOp("inspection-return")} icon={CheckCircle2}>
          Осмотр при возврате
        </OpBtn>
        <OpBtn active={op === "extra"} onClick={() => setOp("extra")} icon={Plus}>
          Услуга
        </OpBtn>
        <OpBtn active={op === "extension"} onClick={() => setOp("extension")} icon={Clock3}>
          Продление
        </OpBtn>
        <OpBtn active={op === "meeting-pickup"} onClick={() => setOp("meeting-pickup")} icon={CalendarDays}>
          Встреча: получение
        </OpBtn>
        <OpBtn active={op === "meeting-return"} onClick={() => setOp("meeting-return")} icon={CalendarDays}>
          Встреча: возврат
        </OpBtn>
        <OpBtn active={op === "adjustment"} onClick={() => setOp("adjustment")} icon={Plus}>
          Корректировка
        </OpBtn>
        <OpBtn active={op === "deposit"} onClick={() => setOp("deposit")} icon={Wallet}>
          Депозит
        </OpBtn>
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            paymentMutation.mutate(
              { id: rental.id, paid: rental.payment_status !== "paid" },
              {
                onSuccess: () => toast.success("Оплата обновлена"),
              },
            );
          }}
          className={cn(
            "flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium transition-colors hover:bg-secondary",
            rental.payment_status === "paid" && "border-[hsl(var(--success))]/40 text-[hsl(var(--success))]",
          )}
        >
          <Wallet className="h-3.5 w-3.5" />
          {rental.payment_status === "paid" ? "Оплачено" : "Подтвердить оплату"}
        </button>
      </div>

      {op && (
        <div className="space-y-3 rounded-xl border border-border bg-secondary/30 p-4">
          {(op === "meeting-pickup" || op === "meeting-return") && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Дата и время">
                <Input
                  type="datetime-local"
                  value={String(form.meeting_at || "")}
                  onChange={(e) => setForm({ ...form, meeting_at: e.target.value })}
                />
              </Field>
              <Field label="Место">
                <Input
                  placeholder="ул. Пушкина, 1"
                  value={String(form.meeting_location || "")}
                  onChange={(e) => setForm({ ...form, meeting_location: e.target.value })}
                />
              </Field>
            </div>
          )}

          {op === "extra" && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Field label="Услуга">
                <Input
                  placeholder="Детское кресло"
                  value={String(form.name || "")}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </Field>
              <Field label="Кол-во">
                <Input
                  type="number"
                  value={String(form.qty ?? 1)}
                  onChange={(e) => setForm({ ...form, qty: e.target.value })}
                />
              </Field>
              <Field label="Цена">
                <Input
                  type="number"
                  value={String(form.unit_price ?? "")}
                  onChange={(e) => setForm({ ...form, unit_price: e.target.value })}
                />
              </Field>
            </div>
          )}

          {op === "extension" && (
            <Field label="Новая дата возврата">
              <Input
                type="datetime-local"
                value={String(form.new_end || "")}
                onChange={(e) => setForm({ ...form, new_end: e.target.value })}
              />
            </Field>
          )}

          {op === "adjustment" && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Тип">
                <Select
                  value={String(form.kind || "late_fee")}
                  onChange={(e) => setForm({ ...form, kind: e.target.value })}
                >
                  <option value="late_fee">Просрочка</option>
                  <option value="damage_fee">Повреждение</option>
                  <option value="discount">Скидка</option>
                  <option value="other">Другое</option>
                </Select>
              </Field>
              <Field label="Сумма">
                <Input
                  type="number"
                  value={String(form.amount ?? "")}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                />
              </Field>
            </div>
          )}

          {op === "deposit" && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Операция">
                <Select
                  value={String(form.kind || "hold")}
                  onChange={(e) => setForm({ ...form, kind: e.target.value })}
                >
                  <option value="hold">Зарезервировать</option>
                  <option value="release">Вернуть клиенту</option>
                  <option value="charge">Удержать</option>
                </Select>
              </Field>
              <Field label="Сумма">
                <Input
                  type="number"
                  value={String(form.amount ?? "")}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                />
              </Field>
            </div>
          )}

          {op === "payment" && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Сумма">
                <Input
                  type="number"
                  value={String(form.amount ?? "")}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                />
              </Field>
              <Field label="Тип">
                <Input
                  placeholder="rental"
                  value={String(form.payment_type || "rental")}
                  onChange={(e) => setForm({ ...form, payment_type: e.target.value })}
                />
              </Field>
            </div>
          )}

          {(op === "inspection-pickup" || op === "inspection-return") && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Пробег">
                <Input
                  type="number"
                  value={String(form.mileage ?? "")}
                  onChange={(e) => setForm({ ...form, mileage: e.target.value })}
                />
              </Field>
              <Field label="Топливо %">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={String(form.fuel_level ?? "")}
                  onChange={(e) => setForm({ ...form, fuel_level: e.target.value })}
                />
              </Field>
            </div>
          )}

          <Field label="Комментарий">
            <Input
              placeholder="Необязательно"
              value={String(form.note || "")}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            />
          </Field>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={reset}>
              Отмена
            </Button>
            <Button type="button" loading={busy} onClick={save}>
              <Check className="h-4 w-4" />
              Сохранить
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function OpBtn({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-xs font-medium transition-colors",
        active
          ? "bg-foreground text-background"
          : "bg-background hover:bg-secondary",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {children}
    </button>
  );
}