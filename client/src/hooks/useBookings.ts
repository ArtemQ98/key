import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  customerBookingsApi,
  type CreateCustomerBookingInput,
} from "@/api/customerBookings";
import { marketplaceKeys } from "./useMarketplace";

export const customerBookingsKeys = {
  all: ["customer-bookings"] as const,
  list: () => [...customerBookingsKeys.all, "list"] as const,
};

export function useCustomerBookings() {
  return useQuery({
    queryKey: customerBookingsKeys.list(),
    queryFn: () => customerBookingsApi.list(),
    staleTime: 30_000,
  });
}

export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCustomerBookingInput) => customerBookingsApi.create(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: customerBookingsKeys.all });
      qc.invalidateQueries({ queryKey: marketplaceKeys.all });
    },
  });
}

export function useCancelBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: number; reason?: string }) =>
      customerBookingsApi.cancel(id, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: customerBookingsKeys.all });
      qc.invalidateQueries({ queryKey: marketplaceKeys.all });
    },
  });
}