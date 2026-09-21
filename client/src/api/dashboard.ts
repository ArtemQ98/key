import { api } from "@/api/client";
import type { Dashboard, Notification } from "@/api/types";

export interface RevenueDay {
  date: string; // "2026-09-15"
  amount: number;
}

export interface RevenueChartResponse {
  month: string; // "2026-09"
  days: RevenueDay[];
  total: number;
}

export const dashboardApi = {
  get: () => api.get<Dashboard>("/dashboard"),

  notifications: () => api.get<Notification[]>("/notifications"),

  revenueChart: (month?: string) =>
    api.get<RevenueChartResponse>(
      `/dashboard/revenue-chart${month ? `?month=${month}` : ""}`,
    ),
};