import { customerApi, publicApi } from "@/api/client";
import type { AuthResponse, User } from "@/api/types";

export interface CustomerRegisterInput {
  name: string;
  phone: string;
  email?: string;
  password: string;
}

export interface CustomerLoginInput {
  identifier: string;
  password: string;
}

export const customerAuthApi = {
  login: (input: CustomerLoginInput) =>
    publicApi.post<AuthResponse>("/auth/customer/login", input),

  register: (input: CustomerRegisterInput) =>
    publicApi.post<AuthResponse>("/auth/customer/register", input),

  me: () => customerApi.get<User>("/me"),
};