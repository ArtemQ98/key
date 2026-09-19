import { api } from "@/api/client";
import type { User } from "@/api/types";

export interface ProfilePatch {
  name?: string;
  email?: string;
  city?: string;
  company_name?: string;
}

export const profileApi = {
  update: (patch: ProfilePatch) => api.patch<User>("/profile", patch),
};