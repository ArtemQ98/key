import { useQuery } from "@tanstack/react-query";
import { marketplaceApi, type SearchCarsParams } from "@/api/marketplace";

export const marketplaceKeys = {
  all: ["marketplace"] as const,
  cars: (params: SearchCarsParams) =>
    [...marketplaceKeys.all, "cars", params] as const,
  car: (id: number) => [...marketplaceKeys.all, "car", id] as const,
  fleets: (params: { city?: string; q?: string }) =>
    [...marketplaceKeys.all, "fleets", params] as const,
  fleet: (slug: string) => [...marketplaceKeys.all, "fleet", slug] as const,
  availability: (carId: number, from: string, to: string) =>
    [...marketplaceKeys.all, "availability", carId, from, to] as const,
};

export function useMarketplaceCars(params: SearchCarsParams) {
  return useQuery({
    queryKey: marketplaceKeys.cars(params),
    queryFn: () => marketplaceApi.cars(params),
    staleTime: 30_000,
  });
}

export function usePublicFleet(slug: string | null) {
  return useQuery({
    queryKey: marketplaceKeys.fleet(slug ?? ""),
    queryFn: () => marketplaceApi.fleet(slug!),
    enabled: !!slug,
    staleTime: 60_000,
  });
}

export function usePublicCar(id: number | null) {
  return useQuery({
    queryKey: marketplaceKeys.car(id ?? 0),
    queryFn: () => marketplaceApi.car(id!),
    enabled: id !== null,
  });
}

export function useMarketplaceFleets(params: { city?: string; q?: string }) {
  return useQuery({
    queryKey: marketplaceKeys.fleets(params),
    queryFn: () => marketplaceApi.fleets(params),
    staleTime: 60_000,
  });
}

export function useAvailabilityDates(
  carId: number | null,
  from: string,
  to: string,
) {
  return useQuery({
    queryKey: marketplaceKeys.availability(carId ?? 0, from, to),
    queryFn: () => marketplaceApi.availabilityDates(carId!, from, to),
    enabled: carId !== null,
    staleTime: 60_000,
  });
}