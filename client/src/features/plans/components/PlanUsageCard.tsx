import { ArrowUpRight, Sparkles } from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import { useAuthStore } from "@/stores/auth";
import { useCars } from "@/hooks/useCars";
import { planLabel } from "../plans";
import { cn } from "@/lib/cn";

interface PlanUsageCardProps {
  onUpgrade: () => void;
}

export function PlanUsageCard({ onUpgrade }: PlanUsageCardProps) {
  const user = useAuthStore((s) => s.user);
  const carsQuery = useCars();
  const count = carsQuery.data?.length ?? 0;
  const limit = user?.cars_limit ?? 3;
  const usage = Math.min(100, Math.round((count / limit) * 100));
  const near = usage >= 80;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-muted-foreground" />
          Тариф
        </CardTitle>
        <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {planLabel[user?.plan ?? "free"]}
        </span>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-muted-foreground">Использовано</span>
            <span className="font-medium">
              {count} / {limit}
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                near ? "bg-[hsl(var(--warning))]" : "bg-foreground",
              )}
              style={{ width: `${usage}%` }}
            />
          </div>
        </div>

        {near ? (
          <p className="text-xs text-[hsl(var(--warning))]">
            Почти достигнут лимит машин. Обновите тариф, чтобы добавить ещё.
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            На тарифе {planLabel[user?.plan ?? "free"]} можно добавить до{" "}
            {limit} машин.
          </p>
        )}

        <Button variant="outline" className="w-full" onClick={onUpgrade}>
          <ArrowUpRight className="h-4 w-4" />
          Улучшить тариф
        </Button>
      </CardContent>
    </Card>
  );
}