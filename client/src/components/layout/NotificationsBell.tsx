import { useNavigate } from "react-router-dom";
import { Bell, Info } from "lucide-react";
import {
  Avatar,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  UnreadBadge,
} from "@/components/ui";
import {
  useUnreadNotifications,
  useSystemNotifications,
  useMarkSystemNotificationsRead,
} from "@/hooks/useMessages";
import { useAuthStore } from "@/stores/auth";
import { useCustomerAuthStore } from "@/stores/customerAuth";
import { useEffect } from "react";

type Item =
  | {
      kind: "chat";
      id: number;
      rental_id: number;
      peer_name: string;
      car_name: string;
      booking_code: string;
      last_body: string;
      unread_count: number;
      at: string;
    }
  | {
      kind: "system";
      id: number;
      title: string;
      message: string;
      at: string;
    };

export function NotificationsBell() {
  const navigate = useNavigate();
  const owner = useAuthStore((s) => s.user);
  const customer = useCustomerAuthStore((s) => s.customer);
  const as: "owner" | "customer" = owner ? "owner" : "customer";
  const isLoggedIn = !!owner || !!customer;

  const chatsQuery = useUnreadNotifications(as);
  const systemQuery = useSystemNotifications(as);
  const markSystemRead = useMarkSystemNotificationsRead(as);

  // Помечаем системные прочитанными при открытии дропдауна
  // (точнее — когда они загрузились и их видно)
  useEffect(() => {
    if (systemQuery.data && systemQuery.data.length > 0) {
      // не помечаем сразу — дадим пользователю увидеть их в дропдауне.
      // Помечаем при клике на любой системный элемент (см. handleClick).
    }
  }, [systemQuery.data]);

  if (!isLoggedIn) return null;

  const chats = chatsQuery.data ?? [];
  const system = systemQuery.data ?? [];

  const chatTotal = chats.reduce((n, x) => n + x.unread_count, 0);
  const systemTotal = system.length;
  const total = chatTotal + systemTotal;

  // Объединяем в один список и сортируем по времени
  const items: Item[] = [
    ...chats.map((c) => ({
      kind: "chat" as const,
      id: c.rental_id,
      rental_id: c.rental_id,
      peer_name: c.peer_name,
      car_name: c.car_name,
      booking_code: c.booking_code,
      last_body: c.last_body,
      unread_count: c.unread_count,
      at: c.last_at ?? "",
    })),
    ...system.map((s) => ({
      kind: "system" as const,
      id: s.id,
      title: s.title,
      message: s.message,
      at: s.created_at,
    })),
  ]
    .sort((a, b) => (a.at < b.at ? 1 : -1))
    .slice(0, 8);

function handleChatClick(rentalId: number) {
    if (owner) {
        navigate(`/app/rentals?open=${rentalId}&tab=chat`);
    } else {
        navigate(`/account/bookings/${rentalId}?tab=chat`);
    }
}

  function handleSystemClick() {
    // при клике на системное уведомление помечаем все как прочитанные
    markSystemRead.mutate();
    navigate(owner ? "/app/rentals" : "/account");
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Уведомления"
          className="group relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        >
          <Bell className="h-4 w-4 transition-transform duration-300 group-hover:animate-bell-shake" />
          {total > 0 && (
            <UnreadBadge
              count={total}
              className="absolute -right-1 -top-1 animate-pulse"
            />
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between px-3 py-2.5">
          <span className="text-sm font-semibold">Уведомления</span>
          {total > 0 && (
            <span className="text-xs text-muted-foreground">{total} новых</span>
          )}
        </div>

        <DropdownMenuSeparator className="my-0" />

        {items.length === 0 ? (
          <div className="px-3 py-8 text-center text-xs text-muted-foreground">
            Пока нет новых уведомлений
          </div>
        ) : (
          items.map((item) =>
            item.kind === "chat" ? (
              <DropdownMenuItem
                key={`chat-${item.rental_id}`}
                onSelect={() => handleChatClick(item.rental_id)}
                className="items-start gap-3 px-3 py-2.5"
              >
                <Avatar name={item.peer_name} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium">
                      {item.peer_name}
                    </span>
                    {item.unread_count > 0 && (
                      <UnreadBadge count={item.unread_count} />
                    )}
                  </div>
                  <div className="truncate text-xs text-muted-foreground">
                    {item.car_name}
                    {item.booking_code ? ` · ${item.booking_code}` : ""}
                  </div>
                  <div className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                    {item.last_body}
                  </div>
                </div>
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                key={`sys-${item.id}`}
                onSelect={handleSystemClick}
                className="items-start gap-3 px-3 py-2.5"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Info className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{item.title}</div>
                  <div className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                    {item.message}
                  </div>
                </div>
              </DropdownMenuItem>
            ),
          )
        )}

        <DropdownMenuSeparator className="my-0" />

        <DropdownMenuItem
          onSelect={() => navigate(owner ? "/app/rentals" : "/account")}
          className="justify-center py-2.5 text-xs font-medium text-muted-foreground"
        >
          {owner ? "Все аренды" : "Все поездки"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}