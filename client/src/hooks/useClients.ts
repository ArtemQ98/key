import { useQuery } from "@tanstack/react-query";
import { clientsApi } from "@/api/clients";

export const clientsKeys = {
  all: ["clients"] as const,
  list: () => [...clientsKeys.all, "list"] as const,
};

export function useClients() {
  return useQuery({
    queryKey: clientsKeys.list(),
    queryFn: () => clientsApi.list(),
    staleTime: 30_000,
  });
}