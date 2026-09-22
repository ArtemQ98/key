import { customerApi } from "@/api/client";
import type { CustomerBooking, RentalStatus } from "@/api/types";
import { useQuery } from "@tanstack/react-query";

export interface CreateCustomerBookingInput {
  car_id: number;
  starts_at: string;
  ends_at: string;
  pickup_location?: string;
  dropoff_location?: string;
}

export const customerBookingsApi = {
  create: (input: CreateCustomerBookingInput) =>
    customerApi.post<{
      id: number;
      booking_code: string;
      status: RentalStatus;
      car: string;
      starts_at: string;
      ends_at: string;
      subtotal: number;
      deposit: number;
      payment_status: string;
    }>("/bookings", input),

  list: () => customerApi.get<CustomerBooking[]>("/customer/bookings"),

  cancel: (id: number, reason = "Отменено клиентом") =>
    customerApi.patch<{ ok: true }>(`/bookings/${id}`, {
      status: "cancelled",
      reason,
    }),

  detail: (id: number) =>
    customerApi.get<CustomerBooking>(`/customer/bookings/${id}`),
};

export const customerBookingsKeys = {
  all: ["customer-bookings"] as const,
  list: () => [...customerBookingsKeys.all, "list"] as const,
  detail: (id: number) => [...customerBookingsKeys.all, "detail", id] as const,
};

export function useCustomerBookingDetail(id: number | null) {
  return useQuery({
    queryKey: customerBookingsKeys.detail(id ?? 0),
    queryFn: () => customerBookingsApi.detail(id!),
    enabled: id !== null,
  });
}