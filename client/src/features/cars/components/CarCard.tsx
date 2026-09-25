import { Camera, CircleDollarSign, Pencil, Trash2 } from "lucide-react";
import type { Car } from "@/api/types";
import { CarStatusBadge, Button, Select, Skeleton } from "@/components/ui";
import { money, num } from "@/lib/format";
import { cn } from "@/lib/cn";

interface CarCardProps {
  car: Car;
  onOpenPhotos: (car: Car) => void;
  onOpenFinance: (car: Car) => void;
  onEdit: (car: Car) => void;                  // ← добавили
  onChangeStatus: (id: number, status: Car["status"]) => void;
  onDelete: (id: number) => void;
}

export function CarCard({
  car,
  onOpenPhotos,
  onOpenFinance,
  onEdit,
  onChangeStatus,
  onDelete,
}: CarCardProps) {
  return (
    <div className="group overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-shadow hover:shadow-elevated">
      {/* Визуал */}
      <button
        type="button"
        onClick={() => onOpenPhotos(car)}
        className="relative flex h-52 w-full items-center justify-center bg-secondary/40 transition-colors hover:bg-secondary/60"
      >
        {car.image_url ? (
          <img
            src={car.image_url}
            alt={`${car.brand} ${car.model}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <Camera
            className="h-12 w-12 text-muted-foreground/40"
            strokeWidth={1.2}
          />
        )}

        <div className="absolute left-3 top-3">
          <CarStatusBadge status={car.status} />
        </div>

        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-background/80 px-2.5 py-1 text-xs font-medium opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
          <Camera className="h-3 w-3" />
          Фото
        </div>

        <div className="absolute bottom-3 left-3 rounded-md bg-background/90 px-2 py-1 text-xs font-semibold backdrop-blur-sm">
          {car.plate}
        </div>
      </button>

      {/* Информация */}
      <div className="p-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold">
              {car.brand} {car.model}
            </h3>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {car.year} · {num(car.mileage)} км · {car.location}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-base font-semibold">
              {money(car.daily_price)}
            </div>
            <div className="text-xs text-muted-foreground">за сутки</div>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-1.5">
          <SpecBadge>{car.fuel || "—"}</SpecBadge>
          <SpecBadge>{car.transmission || "—"}</SpecBadge>
          <SpecBadge>{car.seats || "—"} мест</SpecBadge>
        </div>

        <div className="mb-4 grid grid-cols-2 gap-3 rounded-xl bg-secondary/50 p-3">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Заработано
            </div>
            <div className="text-sm font-semibold">{money(car.earnings)}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Расходы
            </div>
            <div className="text-sm font-semibold">{money(car.expenses)}</div>
          </div>
        </div>

        {/* Действия — 2 ряда */}
        <div className="space-y-2">
          {/* Верхний ряд: Фото + Финансы + Редактировать */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onOpenPhotos(car)}
            >
              <Camera className="h-3.5 w-3.5" />
              Фото
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onOpenFinance(car)}
            >
              <CircleDollarSign className="h-3.5 w-3.5" />
              Финансы
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(car)}
              aria-label="Редактировать"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Нижний ряд: Статус + Удалить */}
          <div className="flex items-center gap-2">
            <Select
              value={car.status}
              onChange={(e) =>
                onChangeStatus(car.id, e.target.value as Car["status"])
              }
              className="h-9 flex-1 text-sm"
            >
              <option value="available">Свободен</option>
              <option value="rented">В аренде</option>
              <option value="maintenance">Сервис</option>
            </Select>

            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
              onClick={() => onDelete(car.id)}
              aria-label="Удалить"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SpecBadge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function CarCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <Skeleton className="h-52 w-full rounded-none" />
      <div className="space-y-3 p-5">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-16 w-full" />
        <div className="flex gap-2">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 w-9" />
        </div>
      </div>
    </div>
  );
}