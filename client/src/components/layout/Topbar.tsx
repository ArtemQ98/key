import { Bell, Menu } from "lucide-react";
import { Avatar, Button } from "@/components/ui";
import { useUIStore } from "@/stores/ui";
import { cn } from "@/lib/cn";
import type { User } from "@/api/types";
import { useFleetProfile } from "@/hooks/useFleetProfile";

interface TopbarProps {
  user: User;
  title?: string;
  alerts?: number;
  className?: string;
}

export function Topbar({ user, title, alerts = 0, className }: TopbarProps) {
  const setMobileNavOpen = useUIStore((s) => s.setMobileNavOpen);
  const { data: fleet } = useFleetProfile();
  const avatarUrl = fleet?.avatar_url || "";
  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-background/80 backdrop-blur-xl px-4 sm:px-6",
        className,
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={() => setMobileNavOpen(true)}
        aria-label="Открыть меню"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="flex-1 truncate text-sm font-medium text-muted-foreground">
        {title}
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="relative group"
          aria-label="Уведомления"
        >
          <Bell className="h-4 w-4 transition-transform duration-300 group-hover:animate-bell-shake" />
          {alerts > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground animate-pulse">
              {alerts}
            </span>
          )}
        </Button>

        {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={user.company_name || user.name || "Аватар"}
          className="ml-1 h-9 w-9 shrink-0 rounded-full object-cover"
        />
      ) : (
        <Avatar name={user.name || "В"} size="md" className="ml-1" />
      )}
      </div>
    </header>
  );
}