import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { carsApi, type CarPatch } from "@/api/cars";
import type { Car } from "@/api/types";

export const carsKeys = {
  all: ["cars"] as const,
  list: () => [...carsKeys.all, "list"] as const,
  photos: (id: number) => [...carsKeys.all, "photos", id] as const,
};

export function useCars() {
  return useQuery({
    queryKey: carsKeys.list(),
    queryFn: () => carsApi.list(),
    staleTime: 30_000,
  });
}

export function useCreateCar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<Car>) => carsApi.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: carsKeys.list() });
    },
  });
}

export function useUpdateCar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: number; patch: CarPatch }) =>
      carsApi.update(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: carsKeys.list() });
    },
  });
}

export function useDeleteCar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => carsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: carsKeys.list() });
    },
  });
}