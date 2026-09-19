import { cn } from "@/lib/cn";
import { initials } from "@/lib/format";

interface AvatarProps {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = {
  sm: "h-7 w-7 text-xs",
  md: "h-9 w-9 text-sm",
  lg: "h-12 w-12 text-base",
};

export function Avatar({ name, size = "md", className }: AvatarProps) {
  return (
    <div
      className={cn(
        "inline-flex shrink-0 select-none items-center justify-center rounded-full bg-secondary font-semibold text-secondary-foreground",
        sizes[size],
        className,
      )}
    >
      {initials(name)}
    </div>
  );
}