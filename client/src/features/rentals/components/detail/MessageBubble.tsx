import { Avatar } from "@/components/ui";
import { cn } from "@/lib/cn";
import type { ThreadItem } from "@/api/messages";

interface MessageBubbleProps {
  item: ThreadItem;
  isOwn: boolean;
  senderName: string;
}

export function MessageBubble({ item, isOwn, senderName }: MessageBubbleProps) {
  const time = new Date(item.created_at).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div
      className={cn(
        "flex items-end gap-2",
        isOwn ? "flex-row-reverse" : "flex-row",
      )}
    >
      <Avatar name={isOwn ? "Я" : senderName} size="sm" />

      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-3 py-2 text-sm",
          isOwn
            ? "bg-primary text-primary-foreground"
            : "bg-secondary text-secondary-foreground",
        )}
      >
        <div className="whitespace-pre-wrap break-words">{item.body}</div>
        <div
          className={cn(
            "mt-1 text-[10px]",
            isOwn ? "text-primary-foreground/70" : "text-muted-foreground",
          )}
        >
          {time}
          {isOwn && item.read_at && " · прочитано"}
        </div>
      </div>
    </div>
  );
}