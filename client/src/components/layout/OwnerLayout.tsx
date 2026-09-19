import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@/stores/auth";
import { CenteredSpinner } from "@/components/ui";
import { Shell } from "./Shell";
import { useUIStore } from "@/stores/ui";

const titles: Record<string, string> = {
  "/app": "Обзор",
  "/app/cars": "Автопарк",
  "/app/rentals": "Аренды",
  "/app/clients": "Клиенты",
  "/app/security": "Проверки",
  "/app/storefront": "Витрина",
  "/app/finance": "Финансы",
  "/app/settings": "Настройки",
};

export function OwnerLayout() {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const logout = useAuthStore((s) => s.logout);
  const location = useLocation();
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);

  // Первый заход — попробуем восстановить сессию
  useEffect(() => {
    if (!user) void fetchMe();
  }, [user, fetchMe]);

  // Слушаем глобальное событие logout, которое шлёт api-клиент при 401
  useEffect(() => {
    const handler = () => logout();
    window.addEventListener("key:logout", handler);
    return () => window.removeEventListener("key:logout", handler);
  }, [logout]);

  if (loading && !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <CenteredSpinner label="Загружаем рабочее пространство…" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/app/login" replace state={{ from: location }} />;
  }

  const title = titles[location.pathname] ?? "KEY";

  return (
    <Shell
      user={user}
      title={title}
      onLogout={() => {
        logout();
        setSidebarOpen(true);
      }}
    >
      <Outlet />
    </Shell>
  );
}