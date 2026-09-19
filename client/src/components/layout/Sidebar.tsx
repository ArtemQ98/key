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
        <Avatar name={user.name || "В"} size="md" />
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
                  "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground",
                )
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="flex-1 truncate">{item.label}</span>
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