import type { LucideIcon } from "lucide-react";
import { Check, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

interface TodoItem {
  icon: LucideIcon;
  title: string;
  text: string;
  done?: boolean;
  onClick?: () => void;
}

export function TodoList({ items }: { items: TodoItem[] }) {
  return (
    <div className="space-y-1">
      {items.map((item, i) => {
        const Icon = item.icon;
        return (
          <button
            key={i}
            onClick={item.onClick}
            className="group flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-secondary/40"
          >
            <span
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                item.done
                  ? "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))]"
                  : "bg-secondary text-muted-foreground",
              )}
            >
              {item.done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
            </span>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium">{item.title}</div>
              <div className="truncate text-xs text-muted-foreground">
                {item.done ? "Всё чисто" : item.text}
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </button>
        );
      })}
    </div>
  );
}