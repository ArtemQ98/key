import { Badge, type BadgeProps } from "./Badge";
import type { RentalStatus, CarStatus, PaymentStatus } from "@/api/types";

const rentalTone: Record<
  RentalStatus,
  BadgeProps["variant"]
> = {
  hold: "warning",
  pending: "warning",
  review: "warning",
  confirmed: "default",
  preparing: "default",
  active: "success",
  returned: "muted",
  completed: "muted",
  cancelled: "danger",
  expired: "danger",
  rejected: "danger",
};

const rentalLabel: Record<RentalStatus, string> = {
  hold: "Удержание",
  pending: "Новая",
  review: "Проверка",
  confirmed: "Подтверждена",
  preparing: "Готовится",
  active: "В аренде",
  returned: "Возвращена",
  completed: "Завершена",
  cancelled: "Отменена",
  expired: "Истекла",
  rejected: "Отклонена",
};

const carTone: Record<CarStatus, BadgeProps["variant"]> = {
  available: "success",
  rented: "warning",
  maintenance: "danger",
};

const carLabel: Record<CarStatus, string> = {
  available: "Свободен",
  rented: "В аренде",
  maintenance: "Сервис",
};

export function RentalStatusBadge({ status }: { status: RentalStatus }) {
  return (
    <Badge variant={rentalTone[status] ?? "default"}>
      {rentalLabel[status] ?? status}
    </Badge>
  );
}

export function CarStatusBadge({ status }: { status: CarStatus }) {
  return (
    <Badge variant={carTone[status] ?? "default"}>
      {carLabel[status] ?? status}
    </Badge>
  );
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return status === "paid" ? (
    <Badge variant="success">Оплачено</Badge>
  ) : (
    <Badge variant="muted">Не оплачено</Badge>
  );
}