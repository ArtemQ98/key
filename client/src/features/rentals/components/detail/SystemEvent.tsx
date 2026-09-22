import type { ThreadItem } from "@/api/messages";

interface SystemEventProps {
  item: ThreadItem;
}

const STATUS_LABELS: Record<string, string> = {
  hold: "Заявка создана",
  pending: "Ожидает рассмотрения",
  review: "На рассмотрении",
  confirmed: "Подтверждена",
  preparing: "Готовится к выдаче",
  active: "Активна",
  returned: "Возвращена",
  completed: "Завершена",
  cancelled: "Отменена",
  rejected: "Отклонена",
  expired: "Истекла",
};

const EVENT_LABELS: Record<string, string> = {
  booking_created: "Заявка создана",
  status_changed: "Статус изменён",
  inspection_added: "Добавлен осмотр",
  rental_extended: "Аренда продлена",
  adjustment_added: "Изменения по оплате",
  payment_received: "Платёж получен",
  migration_snapshot: "Снимок состояния",
};

export function SystemEvent({ item }: SystemEventProps) {
  const time = new Date(item.created_at).toLocaleString("ru-RU", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  let text = EVENT_LABELS[item.event_type ?? ""] ?? item.event_type ?? "Событие";

  if (item.event_type === "status_changed" && item.to_status) {
    text = STATUS_LABELS[item.to_status] ?? item.to_status;
  }

  return (
    <div className="flex items-center justify-center py-1">
      <div className="rounded-full bg-secondary/60 px-3 py-1 text-center text-[11px] text-muted-foreground">
        <span className="font-medium text-foreground">{text}</span>
        <span className="mx-1.5">·</span>
        <span>{time}</span>
      </div>
    </div>
  );
}