import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface PageHeadProps {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function PageHead({
  eyebrow,
  title,
  description,
  action,
  className,
}: PageHeadProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 pb-6 sm:flex-row sm:items-start sm:justify-between sm:gap-6",
        className,
      )}
    >
      <div className="min-w-0 flex-1 space-y-1.5">
        {eyebrow && (
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {eyebrow}
          </span>
        )}
        <h1 className="text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="max-w-2xl text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  );
}