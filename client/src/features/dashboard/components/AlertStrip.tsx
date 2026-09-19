import { Bell } from "lucide-react";
import type { Notification } from "@/api/types";

export function AlertStrip({ items }: { items: Notification[] }) {
  if (!items.length) return null;

  return (
    <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      {items.map((n, i) => (
        <div
          key={i}
          className="flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-sm"
        >
          <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
            <Bell className="h-3.5 w-3.5" />
          </div>
          <div className="space-y-0.5">
            <div className="text-sm font-medium leading-tight">{n.title}</div>
            <div className="text-xs text-muted-foreground">{n.text}</div>
          </div>
        </div>
      ))}
    </div>
  );
}