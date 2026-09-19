import { api } from "@/api/client";
import type { Client } from "@/api/types";

export const clientsApi = {
  list: () => api.get<Client[]>("/clients"),
};