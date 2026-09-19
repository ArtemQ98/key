import { useState } from "react";
import { CarFront, Plus } from "lucide-react";
import { PageHead } from "@/components/layout";
import { Button, Empty } from "@/components/ui";
import { useCars, useDeleteCar, useUpdateCar } from "@/hooks/useCars";
import {
  CarCard,
  CarCardSkeleton,
  CarFinanceModal,
  CarFormModal,
  CarPhotosModal,
} from "@/features/cars";
import type { Car } from "@/api/types";
import { toast } from "sonner";

export function CarsPage() {
  const carsQuery = useCars();
  const updateMutation = useUpdateCar();
  const deleteMutation = useDeleteCar();

  const [formOpen, setFormOpen] = useState(false);
  const [photosCar, setPhotosCar] = useState<Car | null>(null);
  const [financeCar, setFinanceCar] = useState<Car | null>(null);

  const cars = carsQuery.data ?? [];

  function handleChangeStatus(id: number, status: Car["status"]) {
    updateMutation.mutate(
      { id, patch: { status } },
      {
        onSuccess: () => toast.success("Статус обновлён"),
        onError: (e) => toast.error(e instanceof Error ? e.message : "Ошибка"),
      },
    );
  }

  function handleDelete(id: number) {
    if (!confirm("Удалить автомобиль?")) return;
    deleteMutation.mutate(id, {
      onSuccess: () => toast.success("Автомобиль удалён"),
      onError: (e) => toast.error(e instanceof Error ? e.message : "Ошибка"),
    });
  }

  return (
    <>
      <PageHead
        eyebrow="Автопарк"
        title="Машины"
        description="Состояние, тарифы, фото и готовность каждого автомобиля."
        action={
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" />
            Добавить авто
          </Button>
        }
      />

      {carsQuery.isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <CarCardSkeleton key={i} />
          ))}
        </div>
      ) : cars.length ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cars.map((c) => (
            <CarCard
              key={c.id}
              car={c}
              onOpenPhotos={setPhotosCar}
              onOpenFinance={setFinanceCar}
              onChangeStatus={handleChangeStatus}
              onDelete={handleDelete}
            />
          ))}
        </div>
      ) : (
        <Empty
          icon={CarFront}
          title="Добавьте первый автомобиль"
          description="После этого KEY начнёт считать загрузку, выручку и доступность."
          action={
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4" />
              Добавить авто
            </Button>
          }
        />
      )}

      <CarFormModal open={formOpen} onOpenChange={setFormOpen} />
      <CarPhotosModal
        car={photosCar}
        onOpenChange={(open) => !open && setPhotosCar(null)}
      />
      <CarFinanceModal
        car={financeCar}
        onOpenChange={(open) => !open && setFinanceCar(null)}
      />
    </>
  );
}