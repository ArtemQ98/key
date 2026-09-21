import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight } from "lucide-react";
import { Button, Field, Input, Modal, ModalBody, ModalFooter, ModalHeader, Select } from "@/components/ui";
import { useCreateCar } from "@/hooks/useCars";
import type { Car } from "@/api/types";
import { RentalTermsEditor } from "./RentalTermsEditor";

const schema = z.object({
  brand: z.string().min(1, "Укажите марку"),
  model: z.string().min(1, "Укажите модель"),
  plate: z.string().min(3, "Укажите госномер"),
  year: z.coerce.number().int().min(1990).max(2100),
  daily_price: z.coerce.number().int().min(0),
  location: z.string().min(1, "Укажите город"),
  category: z.string().optional(),
  seats: z.coerce.number().int().min(1).max(20).optional(),
  transmission: z.string().optional(),
  fuel: z.string().optional(),
  engine_volume: z.string().optional(),
  horsepower: z.coerce.number().int().min(0).optional(),
  drive_type: z.string().optional(),
  fuel_consumption: z.string().optional(),
  tank_volume: z.string().optional(),
  maintenance_interval: z.coerce.number().int().min(0).optional(),
  rental_terms: z.array(
    z.object({
      title: z.string(),
      items: z.array(z.string()),
    }),
  ).optional(),
});

type FormValues = z.infer<typeof schema>;

interface CarFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (car: Car) => void;
}

export function CarFormModal({ open, onOpenChange, onCreated }: CarFormModalProps) {
  const createCar = useCreateCar();
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      brand: "",
      model: "",
      plate: "",
      year: new Date().getFullYear(),
      daily_price: 3500,
      location: "Санкт-Петербург",
      category: "Седан",
      seats: 5,
      transmission: "Автомат",
      fuel: "Бензин",
      engine_volume: "",
      horsepower: 0,
      drive_type: "",
      fuel_consumption: "",
      tank_volume: "",
      maintenance_interval: 10000,
      rental_terms: [],
    },
  });

  async function onSubmit(values: FormValues) {
    setServerError("");
    try {
      const car = await createCar.mutateAsync(values);
      reset();
      onOpenChange(false);
      onCreated?.(car);
    } catch (e) {
      setServerError(e instanceof Error ? e.message : "Не удалось добавить");
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
    <Modal open={open} onOpenChange={handleOpenChange} size="lg">
      <ModalHeader
        title="Новый автомобиль"
        description="Заполните основные поля. Остальное можно добавить позже."
      />
      <form onSubmit={handleSubmit(onSubmit)}>
        <ModalBody className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Марка" required error={errors.brand?.message}>
              <Input
                placeholder="Kia"
                invalid={!!errors.brand}
                {...register("brand")}
              />
            </Field>
            <Field label="Модель" required error={errors.model?.message}>
              <Input
                placeholder="K5"
                invalid={!!errors.model}
                {...register("model")}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Госномер" required error={errors.plate?.message}>
              <Input
                placeholder="А123АА198"
                invalid={!!errors.plate}
                {...register("plate")}
              />
            </Field>
            <Field label="Год" required error={errors.year?.message}>
              <Input type="number" {...register("year")} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Цена за сутки" error={errors.daily_price?.message}>
              <Input type="number" {...register("daily_price")} />
            </Field>
            <Field label="Город" error={errors.location?.message}>
              <Input {...register("location")} />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Категория">
              <Select {...register("category")}>
                <option value="Седан">Седан</option>
                <option value="Хэтчбек">Хэтчбек</option>
                <option value="Универсал">Универсал</option>
                <option value="Кроссовер">Кроссовер</option>
                <option value="Внедорожник">Внедорожник</option>
                <option value="Минивэн">Минивэн</option>
              </Select>
            </Field>
            <Field label="Мест">
              <Input type="number" {...register("seats")} />
            </Field>
            <Field label="Коробка">
              <Select {...register("transmission")}>
                <option value="Автомат">Автомат</option>
                <option value="Механика">Механика</option>
                <option value="Робот">Робот</option>
                <option value="Вариатор">Вариатор</option>
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Двигатель">
              <Input placeholder="2.5 л" {...register("engine_volume")} />
            </Field>
            <Field label="Мощность л.с.">
              <Input type="number" {...register("horsepower")} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Топливо">
              <Select {...register("fuel")}>
                <option value="Бензин">Бензин</option>
                <option value="Дизель">Дизель</option>
                <option value="Гибрид">Гибрид</option>
                <option value="Электро">Электро</option>
              </Select>
            </Field>
            <Field label="Привод">
              <Select {...register("drive_type")}>
                <option value="">Не указан</option>
                <option value="Передний">Передний</option>
                <option value="Задний">Задний</option>
                <option value="Полный">Полный</option>
              </Select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Расход топлива">
              <Input placeholder="8 л/100 км" {...register("fuel_consumption")} />
            </Field>
            <Field label="Объём бака">
              <Input placeholder="60 л" {...register("tank_volume")} />
            </Field>
          </div>
          <div className="border-t border-border pt-4">
          <div className="mb-3">
            <h3 className="text-sm font-semibold">Условия аренды</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Владелец сам задаёт условия. Клиент увидит их на странице машины.
            </p>
          </div>

          <RentalTermsEditor
            value={watch("rental_terms") || []}
            onChange={(terms) =>
              setValue("rental_terms", terms, { shouldDirty: true })
            }
          />
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
            Добавить
            {!isSubmitting && <ArrowRight className="h-4 w-4" />}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}