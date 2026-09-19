import { useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Camera, ImageIcon, Trash2} from "lucide-react";
import { Modal, ModalBody, ModalHeader, Spinner } from "@/components/ui";
import { carsApi } from "@/api/cars";
import { carsKeys } from "@/hooks/useCars";
import type { Car } from "@/api/types";
import { toast } from "sonner";

interface CarPhotosModalProps {
  car: Car | null;
  onOpenChange: (open: boolean) => void;
}

export function CarPhotosModal({ car, onOpenChange }: CarPhotosModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  const photosQuery = useQuery({
    queryKey: carsKeys.photos(car?.id ?? 0),
    queryFn: () => carsApi.photos.list(car!.id),
    enabled: !!car,
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => carsApi.photos.upload(car!.id, file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: carsKeys.photos(car!.id) });
      qc.invalidateQueries({ queryKey: carsKeys.list() });
      toast.success("Фото добавлено");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Ошибка"),
  });

  const deleteMutation = useMutation({
    mutationFn: (photoId: number) => carsApi.photos.remove(car!.id, photoId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: carsKeys.photos(car!.id) });
      qc.invalidateQueries({ queryKey: carsKeys.list() });
      toast.success("Фото удалено");
    },
  });

  if (!car) return null;

  return (
    <Modal open={!!car} onOpenChange={onOpenChange} size="xl" hideClose>
      <ModalHeader
        title={`${car.brand} ${car.model}`}
        description="JPG, PNG или WebP · до 10 МБ за фото"
      />

      <ModalBody>
        {photosQuery.isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : photosQuery.data?.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {photosQuery.data.map((p) => (
              <div
                key={p.id}
                className="group relative aspect-square overflow-hidden rounded-xl border border-border"
              >
                <img
                  src={p.url}
                  alt=""
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
                <button
                  onClick={() => {
                    if (confirm("Удалить фото?")) {
                      deleteMutation.mutate(p.id);
                    }
                  }}
                  className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg bg-background/90 text-destructive opacity-0 backdrop-blur-sm transition-opacity hover:bg-background group-hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
              <ImageIcon className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <div className="text-sm font-medium">Фотографий пока нет</div>
              <div className="mt-1 text-xs text-muted-foreground">
                Первое фото станет главным в каталоге.
              </div>
            </div>
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) uploadMutation.mutate(file);
          }}
        />

        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploadMutation.isPending}
          className="mt-4 flex w-full items-center gap-4 rounded-xl border-2 border-dashed border-border p-6 text-left transition-colors hover:border-foreground/20 hover:bg-secondary/30 disabled:opacity-50"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-secondary">
            {uploadMutation.isPending ? (
              <Spinner />
            ) : (
              <Camera className="h-5 w-5" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium">
              {uploadMutation.isPending ? "Загружаем…" : "Добавить фотографию"}
            </div>
            <div className="text-xs text-muted-foreground">
              До 10 МБ · JPG, PNG или WebP
            </div>
          </div>
        </button>
      </ModalBody>
    </Modal>
  );
}