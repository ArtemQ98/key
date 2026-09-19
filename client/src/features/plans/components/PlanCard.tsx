import { Check } from "lucide-react";
import { Badge, Button, Card, CardContent } from "@/components/ui";
import { cn } from "@/lib/cn";
import { money } from "@/lib/format";
import type { PlanMeta } from "../plans";

interface PlanCardProps {
  plan: PlanMeta;
  current?: boolean;
  onChoose?: () => void;
}

export function PlanCard({ plan, current, onChoose }: PlanCardProps) {
  return (
    <Card
      className={cn(
        "relative transition-shadow",
        plan.highlighted && "ring-1 ring-foreground/20 shadow-elevated",
      )}
    >
      {plan.highlighted && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-foreground px-3 py-0.5 text-[10px] font-semibold text-background">
          Популярный
        </span>
      )}

      <CardContent className="space-y-4 p-6 pt-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">{plan.name}</h3>
            {current && <Badge variant="success">Текущий</Badge>}
          </div>
          <div className="mt-2">
            <span className="text-2xl font-semibold">
              {plan.price === 0 ? "Бесплатно" : money(plan.price)}
            </span>
            {plan.price > 0 && (
              <span className="text-sm text-muted-foreground"> / мес</span>
            )}
          </div>
        </div>

        <ul className="space-y-2">
          {plan.features.map((f) => (
            <li
              key={f}
              className="flex items-start gap-2 text-sm text-muted-foreground"
            >
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--success))]" />
              {f}
            </li>
          ))}
        </ul>

        {!current && (
          <Button
            variant={plan.highlighted ? "primary" : "outline"}
            className="w-full"
            onClick={onChoose}
          >
            {plan.price === 0 ? "Остаться на Free" : `Перейти на ${plan.name}`}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}