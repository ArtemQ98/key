import { useMutation } from "@tanstack/react-query";
import { profileApi, type ProfilePatch } from "@/api/profile";
import { useAuthStore } from "@/stores/auth";
import { toast } from "sonner";

export function useUpdateProfile() {
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation({
    mutationFn: (patch: ProfilePatch) => profileApi.update(patch),
    onSuccess: (user) => {
      setUser(user);
      toast.success("Профиль сохранён");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Ошибка"),
  });
}