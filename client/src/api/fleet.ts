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
};