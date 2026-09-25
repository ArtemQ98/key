import { cn } from "@/lib/cn";

interface UnreadBadgeProps {
  count: number;
  className?: string;
}

export function UnreadBadge({ count, className }: UnreadBadgeProps) {
  if (!count || count <= 0) return null;

  const isSingle = count < 10;
  const label = count > 99 ? "99+" : String(count);

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-destructive font-semibold leading-none text-destructive-foreground",
        isSingle ? "h-4 w-4 text-[10px]" : "h-4 min-w-4 px-1 text-[10px]",
        className,
      )}
    >
      {label}
    </span>
  );
}