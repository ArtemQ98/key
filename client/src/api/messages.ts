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

export interface UnreadNotification {
  rental_id: number;
  booking_code: string;
  car_name: string;
  peer_name: string;
  last_body: string;
  last_at: string | null;
  unread_count: number;
}

export interface SystemNotification {
  id: number;
  title: string;
  message: string;
  created_at: string;
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

  unreadNotifications: (as: As) =>
    as === "owner"
      ? api.get<UnreadNotification[]>("/notifications/unread")
      : customerApi.get<UnreadNotification[]>("/notifications/unread"),

  myNotifications: (as: As) =>
    as === "owner"
      ? api.get<SystemNotification[]>("/notifications/mine")
      : customerApi.get<SystemNotification[]>("/notifications/mine"),

  markNotificationsRead: (as: As) =>
    as === "owner"
      ? api.post<{ ok: boolean }>("/notifications/mine/read")
      : customerApi.post<{ ok: boolean }>("/notifications/mine/read"),
};