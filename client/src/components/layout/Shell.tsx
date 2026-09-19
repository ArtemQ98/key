import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { MobileNav } from "./MobileNav";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import type { User } from "@/api/types";

interface ShellProps {
  user: User;
  title?: string;
  alerts?: number;
  onLogout: () => void;
  children: ReactNode;
  className?: string;
}

export function Shell({
  user,
  title,
  alerts,
  onLogout,
  children,
  className,
}: ShellProps) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar
        user={user}
        onLogout={onLogout}
        className="hidden lg:flex"
      />
      <MobileNav user={user} alerts={alerts} onLogout={onLogout} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar user={user} title={title} alerts={alerts} />
        <main
          className={cn(
            "flex-1 overflow-y-auto px-4 py-6 sm:px-6 sm:py-8",
            className,
          )}
        >
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}