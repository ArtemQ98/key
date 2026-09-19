import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight } from "lucide-react";
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

  const {
    register,
    handleSubmit,
    reset,
    watch,
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

  const selectedCarId = watch("car_id");
  const selectedCar = carsQuery.data?.find(
    (c) => c.id === Number(selectedCarId),
  );
  
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
        onOpenChange(false);
    } catch (e) {
        setServerError(e instanceof Error ? e.message : "Не удалось создать");
    }
    }

  function handleOpenChange(v: boolean) {
    if (!v) {
      reset();
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
              <Input
                placeholder="+7 999…"
                {...register("client_phone")}
              />
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

          <div className="grid grid-cols-2 gap-3">
            <Field label="Сумма договора">
              <Input type="number" {...register("amount")} />
            </Field>
            <Field label="Начальный статус">
              <Select {...register("status")}>
                <option value="pending">Новая</option>
                <option value="confirmed">Подтверждена</option>
                <option value="active">Сразу в аренду</option>
              </Select>
            </Field>
          </div>

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