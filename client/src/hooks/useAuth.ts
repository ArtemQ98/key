import { useAuthStore } from "@/stores/auth";

export function useAuth() {
  return useAuthStore();
}

export function useCurrentUser() {
  return useAuthStore((s) => s.user);
}

export function useIsAuthenticated() {
  return useAuthStore((s) => s.user !== null);
}