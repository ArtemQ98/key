import { api, customerApi, publicApi } from "@/api/client";
import type { AuthResponse, User } from "@/api/types";

export interface RegisterInput {
  name: string;
  phone: string;
  email?: string;
  password: string;
  company_name?: string;
  city?: string;
}

export interface LoginInput {
  identifier: string;
  password: string;
}

export const authApi = {
  login: (input: LoginInput) =>
    api.post<AuthResponse>("/auth/login", input),

  register: (input: RegisterInput) =>
    api.post<AuthResponse>("/auth/register", input),

  me: () => api.get<User>("/me"),

  customerLogin: (input: LoginInput) =>
    publicApi.post<AuthResponse>("/auth/customer/login", input),

  customerRegister: (input: RegisterInput) =>
    publicApi.post<AuthResponse>("/auth/customer/register", input),

  customerMe: () => customerApi.get<User>("/me"),
};