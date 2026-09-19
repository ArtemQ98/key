import { Activity } from "lucide-react";
import type { RentalEvent } from "@/api/rentals";
import { formatDateTime } from "@/lib/dates";

const STATUS_LABELS: Record<string, string> = {
  hold: "Удержание",
  pending: "Новая",
  review: "Проверка",
  confirmed: "Подтверждена",
  preparing: "Готовится",
  active: "В аренде",
  returned: "Возвращена",
  completed: "Завершена",
  cancelled: "Отменена",
  expired: "Истекла",
  rejected: "Отклонена",
};

const EVENT_LABELS: Record<string, string> = {
  booking_created: "Создана бронь",
  manual_created: "Создана вручную",
  status_change: "Смена статуса",
  meeting_scheduled: "Назначена встреча",
  payment_status: "Изменение оплаты",
  extension: "Продление",
};

export function RentalEventsTimeline({ events }: { events: RentalEvent[] }) {
  if (!events.length) {
    return (
      <p className="text-sm text-muted-foreground">Событий пока нет.</p>
    );
  }

  return (
    <ol className="space-y-3">
      {events.map((e) => {
        const title =
          e.type === "status_change" && e.to
            ? `${STATUS_LABELS[e.from] ?? e.from} → ${STATUS_LABELS[e.to] ?? e.to}`
            : EVENT_LABELS[e.type] ?? e.type;

        return (
          <li key={e.id} className="flex gap-3">
            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary">
              <Activity className="h-3 w-3 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1 space-y-0.5">
              <div className="text-xs font-medium">{title}</div>
              <div className="text-[11px] text-muted-foreground">
                {formatDateTime(e.created_at)}
                {e.actor_role && ` · ${e.actor_role === "owner" ? "владелец" : e.actor_role}`}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}