import { cn } from "@/lib/cn";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  withWordmark?: boolean;
}

const sizeMap = {
  sm: { dot: "h-1.5 w-1.5", text: "text-base" },
  md: { dot: "h-2 w-2", text: "text-lg" },
  lg: { dot: "h-2.5 w-2.5", text: "text-2xl" },
};

export function Logo({
  className,
  size = "md",
  withWordmark = true,
}: LogoProps) {
  const s = sizeMap[size];
  return (
    <div className={cn("inline-flex items-center gap-1.5 select-none", className)}>
      {withWordmark && (
        <span className={cn("font-bold tracking-tight", s.text)}>KEY</span>
      )}
      <span className={cn("rounded-full bg-foreground", s.dot)} />
    </div>
  );
}