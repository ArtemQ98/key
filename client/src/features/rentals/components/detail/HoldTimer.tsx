import { useEffect, useState } from "react";
import { Clock3 } from "lucide-react";
import { cn } from "@/lib/cn";

interface HoldTimerProps {
  expiresAt: string | null;
  className?: string;
}

function plural(n: number, forms: [string, string, string]) {
  const abs = Math.abs(n) % 100;
  const last = abs % 10;
  if (abs > 10 && abs < 20) return forms[2];
  if (last > 1 && last < 5) return forms[1];
  if (last === 1) return forms[0];
  return forms[2];
}

function formatRemaining(ms: number): string {
  if (ms <= 0) return "истекает";
  const totalSec = Math.floor(ms / 1000);
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);

  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days} ${plural(days, ["день", "дня", "дней"])}`;
  }
  if (hours >= 1) {
    return `${hours} ${plural(hours, ["час", "часа", "часов"])} ${minutes} мин`;
  }
  return `${minutes} ${plural(minutes, ["минута", "минуты", "минут"])}`;
}

export function HoldTimer({ expiresAt, className }: HoldTimerProps) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!expiresAt) return;
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, [expiresAt]);

  if (!expiresAt) return null;

  const end = new Date(expiresAt).getTime();
  const remaining = end - now;
  const isUrgent = remaining > 0 && remaining < 2 * 60 * 60 * 1000; // меньше 2 часов
  const isExpired = remaining <= 0;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium",
        isExpired && "bg-destructive/10 text-destructive",
        isUrgent && !isExpired && "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]",
        !isUrgent && !isExpired && "bg-secondary text-muted-foreground",
        className,
      )}
    >
      <Clock3 className="h-3.5 w-3.5" />
      {isExpired ? "Заявка истекает" : `Истекает через ${formatRemaining(remaining)}`}
    </div>
  );
}