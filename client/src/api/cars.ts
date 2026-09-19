import { api } from "@/api/client";
import type { Car, CarStatus } from "@/api/types";

export interface CarPatch {
  status?: CarStatus;
  daily_price?: number;
  location?: string;
  mileage?: number;
  public_enabled?: boolean;
  category?: string;
  seats?: number;
  transmission?: string;
  fuel?: string;
  description?: string;
  image_url?: string;
  deposit?: number;
  engine_volume?: string;
  horsepower?: number;
  drive_type?: string;
  fuel_consumption?: string;
  tank_volume?: string;
  maintenance_interval?: number;
}

export interface CarPhoto {
  id: number;
  url: string;
  filename: string;
  created_at: string;
}

export const carsApi = {
  list: () => api.get<Car[]>("/cars"),

  create: (input: Partial<Car>) => api.post<Car>("/cars", input),

  update: (id: number, patch: CarPatch) =>
    api.patch<{ ok: true }>(`/cars/${id}`, patch),

  remove: (id: number) =>
    api.delete<{ ok: true }>(`/cars/${id}`),

  photos: {
    list: (carId: number) =>
      api.get<CarPhoto[]>(`/car-photos/${carId}`),

    upload: (carId: number, file: File) => {
      const form = new FormData();
      form.append("photo", file);
      return api.post<CarPhoto>(`/car-photos/${carId}`, form);
    },

    remove: (carId: number, photoId: number) =>
      api.delete<{ ok: true }>(`/car-photos/${carId}?photo_id=${photoId}`),
  },
};