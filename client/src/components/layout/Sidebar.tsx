import {
  CircleDollarSign,
  ClipboardCheck,
  CarFront,
  Globe2,
  LayoutDashboard,
  LogOut,
  Settings,
  Users,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/cn";
import { Avatar } from "@/components/ui";
import { Logo } from "./Logo";
import type { User } from "@/api/types";
import { useFleetProfile } from "@/hooks/useFleetProfile";

const nav = [
  { to: "/app", label: "Обзор", icon: LayoutDashboard, end: true },
  { to: "/app/cars", label: "Автопарк", icon: CarFront },
  { to: "/app/rentals", label: "Аренды", icon: ClipboardCheck },
  { to: "/app/clients", label: "Клиенты", icon: Users },
  { to: "/app/storefront", label: "Витрина", icon: Globe2 },
  { to: "/app/finance", label: "Финансы", icon: CircleDollarSign },
  { to: "/app/settings", label: "Настройки", icon: Settings },
];

interface SidebarProps {
  user: User;
  onLogout: () => void;
  className?: string;
}

export function Sidebar({ user, onLogout, className }: SidebarProps) {
  const { data: fleet } = useFleetProfile();
  const avatarUrl = fleet?.avatar_url || "";
  return (
    <aside
      className={cn(
        "flex h-full w-64 shrink-0 flex-col border-r border-border bg-background",
        className,
      )}
    >
      <div className="flex h-16 items-center px-5">
        <Logo size="md" />
      </div>

      <div className="mx-3 mb-4 flex items-center gap-3 rounded-xl border border-border bg-card p-3">
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={user.company_name || "Автопарк"}
          className="h-9 w-9 shrink-0 rounded-full object-cover"
        />
      ) : (
        <Avatar name={user.name || "В"} size="md" />
      )}
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">
          {user.company_name || "Мой автопарк"}
        </div>
        <div className="truncate text-xs text-muted-foreground">
          {user.city || "Россия"} · владелец
        </div>
      </div>
    </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-3">
        {nav.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground hover:translate-x-0.5",
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-primary" />
                  )}
                  <Icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-transform duration-200",
                      isActive ? "text-primary" : "group-hover:scale-110",
                    )}
                  />
                  <span className="flex-1 truncate">{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
        >
          <LogOut className="h-4 w-4" />
          Выйти
        </button>
      </div>
    </aside>
  );
}