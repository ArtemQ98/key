import { publicApi } from "@/api/client";
import type { PublicCar, PublicFleet } from "@/api/types";

export interface SearchCarsParams {
  city?: string;
  q?: string;
  from?: string;
  to?: string;
}

export interface PublicFleetDetail {
  id: number;
  slug: string;
  title: string;
  description: string;
  city: string;
  rating: number;
  owner: string;
  avatar_url: string;
  cars_count: number;
  available: number;
  min_price: number;
  cars: PublicCar[];
}

const qs = (params: Record<string, unknown>): string => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") {
      search.set(k, String(v));
    }
  });
  const s = search.toString();
  return s ? `?${s}` : "";
};

export const marketplaceApi = {
  cars: (params: SearchCarsParams = {}) =>
    publicApi.get<PublicCar[]>(`/public/cars${qs({ ...params })}`),

  car: (id: number) => publicApi.get<PublicCar>(`/public/cars/${id}`),

  fleets: (params: { city?: string; q?: string } = {}) =>
    publicApi.get<PublicFleet[]>(`/public/fleets${qs({ ...params })}`),

  fleet: (slug: string) =>
  publicApi.get<PublicFleetDetail>(`/public/fleets/${slug}`),

  availabilityDates: (carId: number, from: string, to: string) =>
    publicApi.get<{ blocked: string[]; from: string; to: string }>(
      `/public/availability/dates?car_id=${carId}&from=${from}&to=${to}`,
    ),
};