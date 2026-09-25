import { create } from "zustand";
import { customerAuthApi } from "@/api/customerAuth";
import { tokens } from "@/api/client";
import type { User } from "@/api/types";
import OneSignal from "react-onesignal";

interface CustomerAuthState {
  customer: User | null;
  loading: boolean;
  error: string | null;

  login: (identifier: string, password: string) => Promise<void>;
  register: (input: {
    name: string;
    phone: string;
    email?: string;
    password: string;
  }) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
}

export const useCustomerAuthStore = create<CustomerAuthState>((set) => ({
  customer: null,
  loading: false,
  error: null,

  async login(identifier, password) {
    set({ loading: true, error: null });
    try {
      const res = await customerAuthApi.login({ identifier, password });
      tokens.customer.set(res.token);
      set({ customer: res.user, loading: false });
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : "Ошибка входа",
        loading: false,
      });
      throw e;
    }
  },

  async register(input) {
    set({ loading: true, error: null });
    try {
      const res = await customerAuthApi.register(input);
      tokens.customer.set(res.token);
      set({ customer: res.user, loading: false });
      OneSignal.login(res.user.id.toString()).catch(() => {});
    } catch (e) {
      set({
        error: e instanceof Error ? e.message : "Ошибка регистрации",
        loading: false,
      });
      throw e;
    }
  },

  logout() {
    tokens.customer.clear();
    set({ customer: null, error: null });
    OneSignal.logout().catch(() => {});
  },

  async fetchMe() {
    const token = tokens.customer.get();
    if (!token) {
      set({ customer: null, loading: false });
      return;
    }
    set({ loading: true });
    try {
      const u = await customerAuthApi.me();
      set({ customer: u, loading: false });
      OneSignal.login(u.id.toString()).catch(() => {});
    } catch {
      tokens.customer.clear();
      set({ customer: null, loading: false });
    }
  },
}));

// Глобальный logout по 401
if (typeof window !== "undefined") {
  window.addEventListener("key:customer-logout", () => {
    useCustomerAuthStore.getState().logout();
  });
}