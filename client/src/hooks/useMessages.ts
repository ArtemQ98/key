import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { messagesApi } from "@/api/messages";

type As = "owner" | "customer";

export const messagesKeys = {
  all: ["messages"] as const,
  thread: (as: As, rentalId: number) =>
    [...messagesKeys.all, "thread", as, rentalId] as const,
  unread: (as: As) => [...messagesKeys.all, "unread", as] as const,
  notifications: (as: "owner" | "customer") =>
    [...messagesKeys.all, "notifications", as] as const,
  system: (as: "owner" | "customer") =>
    [...messagesKeys.all, "system", as] as const, 
};

export function useThread(rentalId: number | null, as: As) {
  return useQuery({
    queryKey: messagesKeys.thread(as, rentalId ?? 0),
    queryFn: () => messagesApi.getThread(rentalId!, as),
    enabled: rentalId !== null,
    staleTime: 0,
    refetchInterval: 5000,
    refetchIntervalInBackground: false,
  });
}

export function useSendMessage(rentalId: number, as: "owner" | "customer") {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => messagesApi.send(rentalId, body, as),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: messagesKeys.thread(as, rentalId) });
      qc.invalidateQueries({ queryKey: messagesKeys.unread(as) });
      qc.invalidateQueries({ queryKey: messagesKeys.notifications(as) }); // ← добавили
    },
  });
}

export function useMarkThreadRead(rentalId: number | null, as: "owner" | "customer") {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => messagesApi.markRead(rentalId!, as),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: messagesKeys.thread(as, rentalId ?? 0) });
      qc.invalidateQueries({ queryKey: messagesKeys.unread(as) });
      qc.invalidateQueries({ queryKey: messagesKeys.notifications(as) }); // ← добавили
    },
  });
}

export function useUnreadCount(as: As) {
  return useQuery({
    queryKey: messagesKeys.unread(as),
    queryFn: () => messagesApi.unreadCount(as),
    staleTime: 15_000,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });
}

export function useUnreadNotifications(as: "owner" | "customer") {
  return useQuery({
    queryKey: messagesKeys.notifications(as),
    queryFn: () => messagesApi.unreadNotifications(as),
    staleTime: 15_000,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });
}

export function useSystemNotifications(as: "owner" | "customer") {
  return useQuery({
    queryKey: messagesKeys.system(as),
    queryFn: () => messagesApi.myNotifications(as),
    staleTime: 15_000,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });
}

export function useMarkSystemNotificationsRead(as: "owner" | "customer") {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => messagesApi.markNotificationsRead(as),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: messagesKeys.system(as) });
    },
  });
}