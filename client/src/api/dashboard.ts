import { api } from "@/api/client";
import type { Dashboard, Notification } from "@/api/types";

export const dashboardApi = {
  get: () => api.get<Dashboard>("/dashboard"),
  notifications: () => api.get<Notification[]>("/notifications"),
};