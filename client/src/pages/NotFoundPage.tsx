import { Link } from "react-router-dom";
import { buttonVariants } from "@/components/ui";
import { cn } from "@/lib/cn";

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="space-y-2">
        <div className="text-6xl font-bold tracking-tight">404</div>
        <p className="text-muted-foreground">Такой страницы нет.</p>
      </div>
      <Link to="/" className={cn(buttonVariants({ variant: "primary" }))}>
        На главную
      </Link>
    </div>
  );
}