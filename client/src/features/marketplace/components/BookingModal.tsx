import { useState } from "react";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { Button, Modal, ModalBody } from "@/components/ui";
import { useCustomerAuthStore } from "@/stores/customerAuth";
import { useCreateBooking } from "@/hooks/useCustomerBookings";
import type { PublicCar } from "@/api/types";
import { money } from "@/lib/format";
import { daysBetween, formatDate } from "@/lib/dates";
import { toast } from "sonner";
import { AvailabilityCalendar } from "./AvailabilityCalendar";

interface BookingModalProps {
  car: PublicCar | null;
  onOpenChange: (open: boolean) => void;
  onNeedAuth: () => void;
  onBooked?: () => void;
}

export function BookingModal({
  car,
  onOpenChange,
  onNeedAuth,
  onBooked,
}: BookingModalProps) {
  const customer = useCustomerAuthStore((s) => s.customer);
  const createBooking = useCreateBooking();
  const [range, setRange] = useState({ from: "", to: "" });
  const [error, setError] = useState("");

  if (!car) return null;

  const days = range.from && range.to ? daysBetween(range.from, range.to) : 0;
  const total = days * car.daily_price;

  async function handleBook() {
    if (!customer) {
      onNeedAuth();
      return;
    }
    if (!range.from || !range.to) {
      setError("Выберите даты получения и возврата");
      return;
    }
    setError("");

    try {
      await createBooking.mutateAsync({
        car_id: car!.id,
        starts_at: `${range.from}T12:00:00Z`,
        ends_at: `${range.to}T12:00:00Z`,
        pickup_location: car!.location,
        dropoff_location: car!.location,
      });
      toast.success("Бронь создана");
      onBooked?.();
      onOpenChange(false);
      setRange({ from: "", to: "" });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Не удалось создать бронь");
    }
  }

  return (
    <Modal open={!!car} onOpenChange={onOpenChange} size="lg">
      <ModalBody className="space-y-5 pt-8">
        {/* Шапка */}
        <div>
          <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Бронь
          </div>
          <h2 className="mt-0.5 text-xl font-semibold">
            {car.brand} {car.model}
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {car.location} · {car.transmission} · {car.seats} мест · {car.fuel}
          </p>
        </div>

        {/* Календарь */}
        <AvailabilityCalendar
          carId={car.id}
          from={range.from}
          to={range.to}
          onChange={setRange}
        />

        {/* Выбранный диапазон */}
        {range.from && (
          <div className="rounded-xl border border-border bg-secondary/30 p-4">
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Период
            </div>
            <div className="mt-1 text-sm">
              {formatDate(range.from)}
              {range.to && ` — ${formatDate(range.to)}`}
            </div>
          </div>
        )}

        {/* Итог */}
        {days > 0 && (
          <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
            <span className="text-sm text-muted-foreground">
              {money(car.daily_price)} × {days} {days === 1 ? "сутки" : "суток"}
            </span>
            <span className="text-lg font-semibold">{money(total)}</span>
          </div>
        )}

        {/* Примечание */}
        <div className="flex items-start gap-3 rounded-xl bg-secondary/40 p-4 text-xs text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Оплата проходит лично с владельцем. После бронирования владелец
            подтвердит бронь и назначит встречу.
          </span>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        <Button
          className="w-full"
          onClick={handleBook}
          loading={createBooking.isPending}
          disabled={!range.from || !range.to}
        >
          {customer ? "Забронировать" : "Войти и забронировать"}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </ModalBody>
    </Modal>
  );
}