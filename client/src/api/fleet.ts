import { api } from "@/api/client";
import type { FleetProfile } from "@/api/types";

export interface FleetProfilePatch {
  slug?: string;
  title?: string;
  description?: string;
  city?: string;
  published?: boolean;
}

export const fleetApi = {
  get: () => api.get<FleetProfile>("/fleet-profile"),

  update: (patch: FleetProfilePatch) =>
    api.patch<FleetProfile>("/fleet-profile", patch),

  uploadAvatar: (file: File) => {
    const form = new FormData();
    form.append("avatar", file);
    return api.post<{ url: string }>("/fleet-avatar", form);
  },

  removeAvatar: () => api.delete<{ ok: true }>("/fleet-avatar"),
};