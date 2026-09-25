import { CarFront, ClipboardCheck, Gauge, Wrench } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PageHead } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { useAuthStore } from "@/stores/auth";
import { useCars } from "@/hooks/useCars";
import { useDashboard, useNotifications } from "@/hooks/useDashboard";
import { useRentals } from "@/hooks/useRentals";
import {
  AlertStrip,
  FleetMini,
  MetricCard,
  RecentRentals,
  RevenueChart,
  TodoList,
} from "@/features/dashboard";
import { OnboardingChecklist } from "@/features/dashboard/components/OnboardingChecklist";

export function OverviewPage() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  const { data: dashboard, isLoading: dLoading } = useDashboard();
  const { data: notifications = [] } = useNotifications();
  const { data: rentals = [], isLoading: rLoading } = useRentals();
  const { data: cars = [] } = useCars();

  const firstName = (user?.name || "Алексей").split(" ")[0];

  const today = new Date().toLocaleDateString("ru-RU", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  

  return (
    <>
      <PageHead
        eyebrow={today}
        title={`Добрый день, ${firstName}.`}
        description="Вот что происходит с вашим бизнесом сегодня."
      />

      <AlertStrip items={notifications} />

      <OnboardingChecklist />

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          icon={ClipboardCheck}
          label="Сделки"
          value={rentals.length}
          tone="blue"
          loading={rLoading}
          sub={`${rentals.filter((r) => ["pending", "confirmed", "active"].includes(r.status)).length} сейчас в работе`}
        />
        <MetricCard
          icon={CarFront}
          label="Автомобили"
          value={dashboard?.fleet ?? 0}
          tone="purple"
          loading={dLoading}
          sub={`${dashboard?.rented ?? 0} в аренде · ${dashboard?.available ?? 0} свободно`}
        />
        <MetricCard
          icon={Gauge}
          label="Загрузка"
          value={dashboard?.utilization ?? 0}
          tone="green"
          format={(n) => `${Math.round(n)}%`}
          loading={dLoading}
          sub={
            (dashboard?.utilization ?? 0) >= 70
              ? "парк работает эффективно"
              : "есть резерв по загрузке"
          }
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Последние аренды</CardTitle>
            <button
              onClick={() => navigate("/app/rentals")}
              className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Все аренды →
            </button>
          </CardHeader>
          <CardContent>
            <RecentRentals rentals={rentals} loading={rLoading} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Что важно</CardTitle>
          </CardHeader>
          <CardContent>
            <TodoList
              items={[
                {
                  icon: ClipboardCheck,
                  title: "Заявки",
                  text: `${dashboard?.applications ?? 0} требуют решения`,
                  done: !dashboard?.applications,
                  onClick: () => navigate("/app/rentals"),
                },
                {
                  icon: Wrench,
                  title: "Сервис",
                  text: `${dashboard?.maintenance ?? 0} авто на обслуживании`,
                  done: !dashboard?.maintenance,
                  onClick: () => navigate("/app/cars"),
                },
              ]}
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>Автопарк</CardTitle>
            <button
              onClick={() => navigate("/app/cars")}
              className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Открыть →
            </button>
          </CardHeader>
          <CardContent>
            <FleetMini cars={cars} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Выручка за месяц</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueChart />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
