import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fleetApi, type FleetProfilePatch } from "@/api/fleet";
import { toast } from "sonner";

export const fleetKeys = {
  all: ["fleet"] as const,
  profile: () => [...fleetKeys.all, "profile"] as const,
};

export function useFleetProfile() {
  return useQuery({
    queryKey: fleetKeys.profile(),
    queryFn: () => fleetApi.get(),
    staleTime: 30_000,
  });
}

export function useUpdateFleetProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: FleetProfilePatch) => fleetApi.update(patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: fleetKeys.all });
      toast.success("Витрина сохранена");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Ошибка"),
  });
}

export function useUploadFleetAvatar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => fleetApi.uploadAvatar(file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: fleetKeys.all });
      toast.success("Аватарка обновлена");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Ошибка"),
  });
}

export function useRemoveFleetAvatar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => fleetApi.removeAvatar(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: fleetKeys.all });
      toast.success("Аватарка удалена");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Ошибка"),
  });
}