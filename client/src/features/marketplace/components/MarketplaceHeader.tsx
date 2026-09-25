import { useState } from "react";
import { Building2, LogIn, Menu, UserRound } from "lucide-react";
import { Button } from "@/components/ui";
import { Drawer } from "@/components/ui";
import { Logo, NotificationsBell } from "@/components/layout";
import type { User } from "@/api/types";
import { NotificationToggle } from "@/components/NotificationToggle";

interface MarketplaceHeaderProps {
  customer: User | null;
  onLogin: () => void;
  onAccount: () => void;
}

export function MarketplaceHeader({
  customer,
  onLogin,
  onAccount,
}: MarketplaceHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  function goToOwner() {
    setMenuOpen(false);
    window.history.pushState({}, "", "/app");
    window.dispatchEvent(new PopStateEvent("popstate"));
  }

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          {/* Логотип слева */}
          <a href="/" className="flex items-center">
            <Logo size="md" />
          </a>

          {/* Центр: навигация (десктоп) */}
          <nav className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
            <a href="#cars" className="transition-colors hover:text-foreground">
              Автомобили
            </a>
            <a href="#fleets" className="transition-colors hover:text-foreground">
              Автопарки
            </a>
            <a href="#how" className="transition-colors hover:text-foreground">
              Как это работает
            </a>
          </nav>

          {/* Кнопки справа */}
          <div className="flex items-center gap-2">
            {/* Уведомления — залогиненным. На мобиле показываем иконку. */}
            <div className="md:hidden">
              <NotificationToggle />
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={goToOwner}
              className="hidden md:inline-flex"
            >
              Для владельцев
            </Button>
            {customer && <NotificationsBell />}
            {customer ? (
              <Button variant="outline" size="sm" onClick={onAccount}>
                <UserRound className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {customer.name?.split(" ")[0] || "Аккаунт"}
                </span>
              </Button>
            ) : (
              <Button variant="primary" size="sm" onClick={onLogin}>
                <LogIn className="h-4 w-4" />
                Войти
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMenuOpen(true)}
              aria-label="Открыть меню"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Мобильное меню */}
      <Drawer open={menuOpen} onOpenChange={setMenuOpen} side="right">
        <div className="flex h-full flex-col p-6 pt-16">
          {/* Навигация */}
          <nav className="space-y-1">
            <button
              onClick={() => {
                setMenuOpen(false);
                document.getElementById("cars")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors hover:bg-secondary/60"
            >
              Автомобили
            </button>
            <button
              onClick={() => {
                setMenuOpen(false);
                document.getElementById("fleets")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors hover:bg-secondary/60"
            >
              Автопарки
            </button>
            <button
              onClick={() => {
                setMenuOpen(false);
                document.getElementById("how")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors hover:bg-secondary/60"
            >
              Как это работает
            </button>
          </nav>

          {/* Разделитель */}
          <div className="my-4 h-px bg-border" />

          {/* Уведомления — в мобильном меню */}
          <div className="md:hidden">
            <NotificationToggle />
          </div>

          {/* Для владельцев — крупная кнопка */}
          <button
            onClick={goToOwner}
            className="flex w-full items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-left transition-colors hover:bg-secondary/60"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-blue-500 text-white">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold">Для владельцев</div>
              <div className="text-xs text-muted-foreground">
                Управление автопарком
              </div>
            </div>
          </button>

          {/* Разделитель */}
          <div className="my-4 h-px bg-border" />

          {/* Аккаунт */}
          {customer ? (
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => {
                setMenuOpen(false);
                onAccount();
              }}
            >
              <UserRound className="h-4 w-4" />
              Мой аккаунт
            </Button>
          ) : (
            <Button
              variant="primary"
              className="w-full justify-start"
              onClick={() => {
                setMenuOpen(false);
                onLogin();
              }}
            >
              <LogIn className="h-4 w-4" />
              Войти
            </Button>
          )}
        </div>
      </Drawer>
    </>
  );
}