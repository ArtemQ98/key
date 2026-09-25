import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { rentalsApi, type CreateRentalInput, type RentalOpInput } from "@/api/rentals";
import type { RentalStatus } from "@/api/types";
import { carsKeys } from "./useCars";

export const rentalsKeys = {
  all: ["rentals"] as const,
  list: () => [...rentalsKeys.all, "list"] as const,
  calendar: (from: string, to: string) =>
    [...rentalsKeys.all, "calendar", from, to] as const,
  detail: (id: number) => [...rentalsKeys.all, "detail", id] as const,
};

export function useRentals() {
  return useQuery({
    queryKey: rentalsKeys.list(),
    queryFn: () => rentalsApi.list(),
    staleTime: 30_000,
  });
}

export function useRentalCalendar(from: string, to: string) {
  return useQuery({
    queryKey: rentalsKeys.calendar(from, to),
    queryFn: () => rentalsApi.calendar(from, to),
    staleTime: 60_000,
  });
}

export function useRentalDetail(id: number | null) {
  return useQuery({
    queryKey: rentalsKeys.detail(id ?? 0),
    queryFn: () => rentalsApi.detail(id!),
    enabled: id !== null,
    placeholderData: keepPreviousData,  // ← добавили
  });
}

export function useCreateRental() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateRentalInput) => rentalsApi.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: rentalsKeys.all });
      qc.invalidateQueries({ queryKey: carsKeys.list() });
    },
  });
}

export function useUpdateRentalStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
      reason,
    }: {
      id: number;
      status: RentalStatus;
      reason?: string;
    }) => rentalsApi.updateStatus(id, status, reason),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: rentalsKeys.all });
      qc.invalidateQueries({ queryKey: rentalsKeys.detail(vars.id) });
      qc.invalidateQueries({ queryKey: carsKeys.list() });
    },
  });
}

export function useRentalOp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: RentalOpInput }) =>
      rentalsApi.op(id, input),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: rentalsKeys.detail(vars.id) });
      qc.invalidateQueries({ queryKey: rentalsKeys.all });
      qc.invalidateQueries({ queryKey: carsKeys.list() });
    },
  });
}

export function useScheduleMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      kind,
      at,
      location,
    }: {
      id: number;
      kind: "pickup" | "return";
      at: string;
      location: string;
    }) => rentalsApi.scheduleMeeting(id, kind, at, location),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: rentalsKeys.detail(vars.id) });
      qc.invalidateQueries({ queryKey: rentalsKeys.all });
    },
  });
}

export function useTogglePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, paid }: { id: number; paid: boolean }) =>
      rentalsApi.setPaymentStatus(id, paid),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: rentalsKeys.detail(vars.id) });
      qc.invalidateQueries({ queryKey: rentalsKeys.all });
    },
  });
}