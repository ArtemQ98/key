import { Link } from "react-router-dom";
import { LogIn, UserRound } from "lucide-react";
import { Logo } from "@/components/layout";
import { Button } from "@/components/ui";
import type { User } from "@/api/types";

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
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center">
          <Logo size="md" />
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
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

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
                window.history.pushState({}, "", "/app");
                window.dispatchEvent(new PopStateEvent("popstate"));
            }}
            >
            <span className="hidden sm:inline">Для владельцев</span>
            </Button>

          {customer ? (
            <Button variant="outline" size="sm" onClick={onAccount}>
              <UserRound className="h-4 w-4" />
              {customer.name?.split(" ")[0] || "Аккаунт"}
            </Button>
          ) : (
            <Button variant="primary" size="sm" onClick={onLogin}>
              <LogIn className="h-4 w-4" />
              Войти
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}