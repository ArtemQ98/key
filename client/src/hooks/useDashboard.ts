import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/api/dashboard";

export const dashboardKeys = {
  all: ["dashboard"] as const,
  overview: () => [...dashboardKeys.all, "overview"] as const,
  notifications: () => [...dashboardKeys.all, "notifications"] as const,
  revenueChart: (month?: string) =>
    [...dashboardKeys.all, "revenue-chart", month ?? "current"] as const,
};

export function useDashboard() {
  return useQuery({
    queryKey: dashboardKeys.overview(),
    queryFn: () => dashboardApi.get(),
    staleTime: 30_000,
  });
}

export function useNotifications() {
  return useQuery({
    queryKey: dashboardKeys.notifications(),
    queryFn: () => dashboardApi.notifications(),
    staleTime: 30_000,
  });
}

export function useRevenueChart(month?: string) {
  return useQuery({
    queryKey: dashboardKeys.revenueChart(month),
    queryFn: () => dashboardApi.revenueChart(month),
    staleTime: 60_000,
  });
}