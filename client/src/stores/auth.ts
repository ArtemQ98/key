import { create } from "zustand";
import { authApi } from "@/api/auth";
import { tokens } from "@/api/client";
import type { User } from "@/api/types";
import OneSignal from "react-onesignal";


interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  

  login: (identifier: string, password: string) => Promise<void>;
  register: (input: {
    name: string;
    phone: string;
    email?: string;
    password: string;
    company_name?: string;
    city?: string;
  }) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
  clearError: () => void;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  error: null,

  async login(identifier, password) {
    set({ loading: true, error: null });
    try {
      const res = await authApi.login({ identifier, password });
      tokens.owner.set(res.token);
      set({ user: res.user, loading: false });
      OneSignal.login(res.user.id.toString()).catch(() => {});
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
      const res = await authApi.register(input);
      tokens.owner.set(res.token);
      set({ user: res.user, loading: false });
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
    tokens.owner.clear();
    set({ user: null, error: null });
    OneSignal.logout().catch(() => {});
  },

  async fetchMe() {
    const token = tokens.owner.get();
    if (!token) {
      set({ user: null, loading: false });
      return;
    }
    set({ loading: true });
    try {
      const u = await authApi.me();
      if (u.role !== "owner") {
        tokens.owner.clear();
        set({ user: null, loading: false });
        OneSignal.login(u.id.toString()).catch(() => {});
        return;
      }
      set({ user: u, loading: false });
    } catch {
      tokens.owner.clear();
      set({ user: null, loading: false });
    }
  },

  clearError() {
    set({ error: null });
  },
  setUser: (user) => set({ user }),
}));