import { api, customerApi } from "@/api/client";
import type { CustomerBooking, RentalStatus } from "@/api/types";

export interface CreateBookingInput {
  car_id: number;
  starts_at: string;
  ends_at: string;
  pickup_location?: string;
  dropoff_location?: string;
}

export const bookingsApi = {
  create: (input: CreateBookingInput) =>
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

  cancel: (id: number, reason = "Отменено клиентом") =>
    customerApi.patch<{ ok: true }>(`/bookings/${id}`, {
      status: "cancelled",
      reason,
    }),

  myBookings: () =>
    customerApi.get<CustomerBooking[]>("/customer/bookings"),

  ownerUpdateStatus: (id: number, status: RentalStatus, reason = "") =>
    api.patch<{ ok: true }>(`/bookings/${id}`, { status, reason }),
};