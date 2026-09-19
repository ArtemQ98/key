import { ChevronRight } from "lucide-react";
import type { Client } from "@/api/types";
import { Avatar } from "@/components/ui";
import { money } from "@/lib/format";
import { formatDate } from "@/lib/dates";

export function ClientRow({
  client,
  onClick,
}: {
  client: Client;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-4 border-b border-border px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-secondary/40"
    >
      <Avatar name={client.name} size="md" />

      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{client.name}</div>
        <div className="truncate text-xs text-muted-foreground">
          {client.phone || "Телефон не указан"}
        </div>
      </div>

      <div className="hidden text-right sm:block">
        <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Аренд
        </div>
        <div className="text-sm font-semibold">{client.rentals}</div>
      </div>

      <div className="hidden text-right sm:block">
        <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Выручка
        </div>
        <div className="text-sm font-semibold">{money(client.total)}</div>
      </div>

      <div className="hidden text-right md:block">
        <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Последняя
        </div>
        <div className="text-xs text-muted-foreground">
          {formatDate(client.last)}
        </div>
      </div>

      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </button>
  );
}