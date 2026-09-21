import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, Lock, Wand2 } from "lucide-react";
import {
  Button,
  Field,
  Input,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Select,
} from "@/components/ui";
import { useCars } from "@/hooks/useCars";
import { useCreateRental } from "@/hooks/useRentals";
import { money } from "@/lib/format";
import { daysBetween } from "@/lib/dates";
import { cn } from "@/lib/cn";
import { toast } from "sonner";

const schema = z.object({
  car_id: z.coerce.number().int().min(1, "Выберите автомобиль"),
  client_name: z.string().min(1, "Укажите имя клиента"),
  client_phone: z.string(),
  amount: z.coerce.number().int().min(0),
  starts_at: z.string().min(1, "Укажите дату получения"),
  ends_at: z.string().min(1, "Укажите дату возврата"),
  status: z.enum(["pending", "confirmed", "active"]),
});

type FormValues = z.infer<typeof schema>;

interface NewRentalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewRentalModal({ open, onOpenChange }: NewRentalModalProps) {
  const carsQuery = useCars();
  const createRental = useCreateRental();
  const [serverError, setServerError] = useState("");
  const [amountManual, setAmountManual] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      car_id: 0,
      client_name: "",
      client_phone: "",
      amount: 0,
      starts_at: "",
      ends_at: "",
      status: "pending",
    },
  });

  const carId = watch("car_id");
  const startsAt = watch("starts_at");
  const endsAt = watch("ends_at");
  const amount = watch("amount");

  const selectedCar = carsQuery.data?.find((c) => c.id === Number(carId));

  // Автоподсчёт суммы: daily_price × дней
  useEffect(() => {
    if (amountManual) return;
    if (!selectedCar || !startsAt || !endsAt) return;

    const days = daysBetween(startsAt, endsAt);
    if (days <= 0) return;

    const computed = Math.round(selectedCar.daily_price * days);
    setValue("amount", computed, { shouldDirty: true });
  }, [selectedCar, startsAt, endsAt, amountManual, setValue]);

  const days = startsAt && endsAt ? daysBetween(startsAt, endsAt) : 0;
  const computedAmount = selectedCar ? selectedCar.daily_price * days : 0;
  const isComputed =
    !amountManual && days > 0 && computedAmount === Number(amount);

  function toISO(value: string): string {
    if (!value) return "";
    return new Date(value).toISOString();
  }

  async function onSubmit(values: FormValues) {
    setServerError("");

    if (new Date(values.ends_at) <= new Date(values.starts_at)) {
      setError("ends_at", { message: "Возврат должен быть позже получения" });
      return;
    }

    try {
      await createRental.mutateAsync({
        car_id: values.car_id,
        client_name: values.client_name,
        client_phone: values.client_phone,
        status: values.status,
        amount: values.amount,
        starts_at: toISO(values.starts_at),
        ends_at: toISO(values.ends_at),
      });
      toast.success("Аренда создана");
      reset();
      setAmountManual(false);
      onOpenChange(false);
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "Не удалось создать");
    }
  }

  function handleOpenChange(v: boolean) {
    if (!v) {
      reset();
      setAmountManual(false);
      setServerError("");
    }
    onOpenChange(v);
  }

  return (
    <Modal open={open} onOpenChange={handleOpenChange}>
      <ModalHeader
        title="Новая аренда"
        description="Заполните данные клиента и период."
      />
      <form onSubmit={handleSubmit(onSubmit)}>
        <ModalBody className="space-y-4">
          <Field label="Автомобиль" required error={errors.car_id?.message}>
            <Select {...register("car_id")} invalid={!!errors.car_id}>
              <option value={0}>— выберите —</option>
              {carsQuery.data?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.brand} {c.model} · {c.plate}
                </option>
              ))}
            </Select>
          </Field>

          {selectedCar && (
            <div className="rounded-lg bg-secondary/60 px-3 py-2 text-xs text-muted-foreground">
              Тариф: {money(selectedCar.daily_price)} / сутки
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Клиент" required error={errors.client_name?.message}>
              <Input
                placeholder="Андрей С."
                invalid={!!errors.client_name}
                {...register("client_name")}
              />
            </Field>
            <Field label="Телефон">
              <Input placeholder="+7 999…" {...register("client_phone")} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Получение" error={errors.starts_at?.message}>
              <Input
                type="datetime-local"
                invalid={!!errors.starts_at}
                {...register("starts_at")}
              />
            </Field>
            <Field label="Возврат" error={errors.ends_at?.message}>
              <Input
                type="datetime-local"
                invalid={!!errors.ends_at}
                {...register("ends_at")}
              />
            </Field>
          </div>

          {/* Сумма с автоподсчётом */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">
                Сумма договора
              </span>
              {amountManual && selectedCar && days > 0 && (
                <button
                  type="button"
                  onClick={() => setAmountManual(false)}
                  className="flex items-center gap-1 text-xs font-medium text-primary transition-colors hover:text-primary/80"
                >
                  <Wand2 className="h-3 w-3" />
                  Пересчитать
                </button>
              )}
            </div>

            <div className="relative">
              <Input
                type="number"
                {...register("amount", {
                  onChange: () => setAmountManual(true),
                })}
                className={cn(
                  "pr-24",
                  amountManual && "border-primary/40 bg-primary/[0.02]",
                )}
              />
              <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                {amountManual ? (
                  <span className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    <Lock className="h-3 w-3" />
                    Вручную
                  </span>
                ) : (
                  isComputed && (
                    <span className="text-[10px] font-medium uppercase tracking-wider text-[hsl(var(--success))]">
                      Авто
                    </span>
                  )
                )}
              </div>
            </div>

            {selectedCar && days > 0 && (
              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                {amountManual ? (
                  <>
                    <Wand2 className="h-3 w-3" />
                    <span>
                      Расчёт: {money(selectedCar.daily_price)} × {days}{" "}
                      {days === 1 ? "сутки" : "суток"} ={" "}
                      <span className="text-foreground">
                        {money(computedAmount)}
                      </span>
                    </span>
                  </>
                ) : (
                  <>
                    <Lock className="h-3 w-3" />
                    <span>
                      Автоматически: {money(selectedCar.daily_price)} × {days}{" "}
                      {days === 1 ? "сутки" : "суток"}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>

          <Field label="Начальный статус">
            <Select {...register("status")}>
              <option value="pending">Новая</option>
              <option value="confirmed">Подтверждена</option>
              <option value="active">Сразу в аренду</option>
            </Select>
          </Field>

          {serverError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {serverError}
            </div>
          )}
        </ModalBody>

        <ModalFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => handleOpenChange(false)}
          >
            Отмена
          </Button>
          <Button type="submit" loading={isSubmitting}>
            Создать аренду
            {!isSubmitting && <ArrowRight className="h-4 w-4" />}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}