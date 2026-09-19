export interface User {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  phone_verified: boolean;
  role: "owner" | "customer";
  city: string;
  company_name: string;
}

export type CarStatus = "available" | "rented" | "maintenance";

export interface Car {
  id: number;
  brand: string;
  model: string;
  plate: string;
  year: number;
  status: CarStatus;
  revenue: number;
  location: string;
  daily_price: number;
  mileage: number;
  color: string;
  vin: string;
  public_enabled: boolean;
  category: string;
  seats: number;
  transmission: string;
  fuel: string;
  description: string;
  image_url: string;
  deposit: number;
  engine_volume: string;
  horsepower: number;
  drive_type: string;
  fuel_consumption: string;
  tank_volume: string;
  maintenance_interval: number;
  earnings: number;
  expenses: number;
}

export type RentalStatus =
  | "hold"
  | "pending"
  | "review"
  | "confirmed"
  | "preparing"
  | "active"
  | "returned"
  | "completed"
  | "cancelled"
  | "expired"
  | "rejected";

export type PaymentStatus = "paid" | "unpaid";

export interface Rental {
  id: number;
  booking_code: string;
  car_id: number | null;
  car: string;
  client: string;
  phone: string;
  status: RentalStatus;
  amount: number;
  deposit: number;
  starts_at: string | null;
  ends_at: string | null;
  payment_status: PaymentStatus;
  final_total: number;
}

export interface Dashboard {
  fleet: number;
  available: number;
  rented: number;
  maintenance: number;
  revenue: number;
  monthRevenue: number;
  utilization: number;
  applications: number;
  verificationQueue: number;
}

export interface Notification {
  type: string;
  title: string;
  text: string;
}

export interface FleetProfile {
  id: number;
  slug: string;
  title: string;
  description: string;
  city: string;
  published: boolean;
  rating: number;
}

export interface PublicCar {
  id: number;
  owner_id: number;
  brand: string;
  model: string;
  year: number;
  location: string;
  daily_price: number;
  mileage: number;
  color: string;
  category: string;
  seats: number;
  transmission: string;
  fuel: string;
  description: string;
  image_url: string;
  deposit: number;
  fleet_slug: string;
  fleet_title: string;
  fleet_city: string;
  fleet_rating: number;
  owner: string;
}

export interface PublicFleet {
  id: number;
  slug: string;
  title: string;
  description: string;
  city: string;
  rating: number;
  owner: string;
  available_cars: number;
}

export interface CustomerBooking {
  id: number;
  booking_code: string;
  car: string;
  status: RentalStatus;
  amount: number;
  deposit: number;
  starts_at: string | null;
  ends_at: string | null;
  fleet: string;
  city: string;
  payment_status: PaymentStatus;
  pickup_meeting_at: string | null;
  pickup_meeting_location: string;
  return_meeting_at: string | null;
  return_meeting_location: string;
}

export interface Client {
  name: string;
  phone: string;
  rentals: number;
  total: number;
  last: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}