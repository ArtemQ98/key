import { api, customerApi } from "@/api/client";

export type MessageKind = "event" | "message";

export interface ThreadItem {
  kind: MessageKind;
  id: number;
  created_at: string;

  sender_id?: number;
  sender_role?: "owner" | "customer" | "system";
  body?: string;
  read_at?: string | null;

  event_type?: string;
  from_status?: string;
  to_status?: string;
  actor_role?: string;
  payload?: string;
}

export interface ThreadResponse {
  items: ThreadItem[];
  unread_count: number;
}

export interface UnreadCountResponse {
  total: number;
  by_rental: Record<string, number>;
}

type As = "owner" | "customer";

export const messagesApi = {
  getThread: (rentalId: number, as: As) =>
    as === "owner"
      ? api.get<ThreadResponse>(`/rental-messages/${rentalId}`)
      : customerApi.get<ThreadResponse>(`/rental-messages/${rentalId}`),

  send: (rentalId: number, body: string, as: As) =>
    as === "owner"
      ? api.post<ThreadItem>(`/rental-messages/${rentalId}`, { body })
      : customerApi.post<ThreadItem>(`/rental-messages/${rentalId}`, { body }),

  markRead: (rentalId: number, as: As) =>
    as === "owner"
      ? api.post<{ ok: boolean }>(`/rental-messages/${rentalId}/read`)
      : customerApi.post<{ ok: boolean }>(
          `/rental-messages/${rentalId}/read`,
        ),

  unreadCount: (as: As) =>
    as === "owner"
      ? api.get<UnreadCountResponse>("/rental-messages/unread-count")
      : customerApi.get<UnreadCountResponse>("/rental-messages/unread-count"),
};