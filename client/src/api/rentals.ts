import { api } from "@/api/client";
import type { Rental, RentalStatus } from "@/api/types";

export interface CreateRentalInput {
  car_id: number;
  client_name: string;
  client_phone: string;
  status?: RentalStatus;
  amount: number;
  starts_at: string;
  ends_at: string;
}

export interface CalendarBooking {
  id: number;
  code: string;
  client: string;
  status: RentalStatus;
  starts_at: string;
  ends_at: string;
  amount: number;
}

export interface CalendarCar {
  id: number;
  car: string;
  plate: string;
  status: string;
  daily_price: number;
  bookings: CalendarBooking[];
}

export interface CalendarResponse {
  from: string;
  to: string;
  cars: CalendarCar[];
}

export interface RentalEvent {
  id: number;
  type: string;
  actor_role: string;
  from: string;
  to: string;
  payload: unknown;
  created_at: string;
}

export interface RentalExtra {
  id: number;
  name: string;
  qty: number;
  unit_price: number;
  total: number;
}

export interface RentalPayment {
  id: number;
  type: string;
  status: string;
  amount: number;
  provider: string;
  created_at: string;
}

export interface RentalInspection {
  id: number;
  kind: "pickup" | "return";
  mileage: number | null;
  fuel_level: number | null;
  notes: string;
  photos: unknown;
  created_at: string;
}

export interface RentalAdjustment {
  id: number;
  type: string;
  amount: number;
  note: string;
  created_at: string;
}

export interface DepositTransaction {
  id: number;
  type: string;
  amount: number;
  note: string;
  created_at: string;
}

export interface RentalDetail extends Rental {
  late_fee: number;
  damage_fee: number;
  pickup_at: string | null;
  returned_at: string | null;
  pickup_meeting_at: string | null;
  pickup_meeting_location: string;
  return_meeting_at: string | null;
  return_meeting_location: string;
  odometer_start: number | null;
  odometer_end: number | null;
  fuel_start: number | null;
  fuel_end: number | null;
  events: RentalEvent[];
  extras: RentalExtra[];
  payments: RentalPayment[];
  inspections: RentalInspection[];
  expenses: RentalAdjustment[];
  adjustments: RentalAdjustment[];
  deposit_transactions: DepositTransaction[];
  expenses_total: number;
  profit: number;
  extension_count: number;
}

export type RentalOpType =
  | "extra"
  | "payment"
  | "inspection"
  | "expense"
  | "adjustment"
  | "deposit"
  | "extension";

export interface RentalOpInput {
  type: RentalOpType;
  name?: string;
  qty?: number;
  unit_price?: number;
  amount?: number;
  note?: string;
  kind?: string;
  mileage?: number;
  fuel_level?: number;
  photos?: string[];
  payment_type?: string;
  new_end?: string;
}

export const rentalsApi = {
  list: () => api.get<Rental[]>("/rentals"),

  create: (input: CreateRentalInput) =>
    api.post<{ id: number; booking_code: string }>("/rentals", input),

  updateStatus: (id: number, status: RentalStatus, reason = "") =>
    api.patch<{ ok: true }>(`/rentals/${id}`, { status, reason }),

  calendar: (from: string, to: string) =>
    api.get<CalendarResponse>(`/rentals/calendar?from=${from}&to=${to}`),

  detail: (id: number) => api.get<RentalDetail>(`/rental-ops/${id}`),

  op: (id: number, input: RentalOpInput) =>
    api.post<{ ok: true }>(`/rental-ops/${id}`, input),

  scheduleMeeting: (
    id: number,
    kind: "pickup" | "return",
    at: string,
    location: string,
  ) =>
    api.patch<{ ok: true }>(`/rentals/meeting/${id}`, {
      kind,
      at,
      location,
    }),

  setPaymentStatus: (id: number, paid: boolean) =>
    api.patch<{ payment_status: string }>(`/rentals/payment/${id}`, { paid }),
};