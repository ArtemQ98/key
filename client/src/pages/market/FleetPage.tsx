import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  CarFront,
  MapPin,
  TrendingDown,
  Users,
} from "lucide-react";
import { Logo } from "@/components/layout";
import { Button, Empty, Skeleton } from "@/components/ui";
import { usePublicFleet } from "@/hooks/useMarketplace";
import { MarketCarCard } from "@/features/marketplace";
import { money } from "@/lib/format";

export function FleetPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const fleetQuery = usePublicFleet(slug ?? null);

  if (fleetQuery.isLoading) {
    return <FleetSkeleton />;
  }

  if (!fleetQuery.data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="text-6xl font-bold tracking-tight">404</div>
        <p className="text-muted-foreground">Автопарк не найден.</p>
        <Button onClick={() => navigate("/")}>
          <ArrowLeft className="h-4 w-4" />
          В каталог
        </Button>
      </div>
    );
  }

  const fleet = fleetQuery.data;

  return (
    <div className="min-h-screen bg-background">
      {/* Шапка */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Каталог
          </Link>
          <Logo size="md" />
          <div className="w-20" />
        </div>
      </header>

      {/* Hero автопарка */}
      <section className="relative overflow-hidden border-b border-border">
        {/* Градиентные пятна */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 left-1/4 h-[400px] w-[400px] animate-pulse rounded-full bg-gradient-to-br from-indigo-500/15 to-blue-500/15 blur-3xl"
          style={{ animationDuration: "7s" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 right-1/4 h-[300px] w-[300px] animate-pulse rounded-full bg-gradient-to-br from-blue-500/10 to-cyan-500/10 blur-3xl"
          style={{ animationDuration: "9s", animationDelay: "1s" }}
        />

        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
            {/* Логотип автопарка */}
            <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="shrink-0"
            >
            {fleet.avatar_url ? (
                <img
                src={fleet.avatar_url}
                alt={fleet.title}
                className="h-20 w-20 rounded-2xl object-cover shadow-brand"
                />
            ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-500 text-3xl font-bold text-white shadow-brand">
                {fleet.title.slice(0, 1).toUpperCase()}
                </div>
            )}
            </motion.div>

            {/* Название + описание */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                  {fleet.title}
                </h1>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {fleet.city}
                </span>
                <span className="flex items-center gap-1">
                  <CarFront className="h-3.5 w-3.5" />
                  {fleet.cars_count}{" "}
                  {fleet.cars_count === 1 ? "машина" : "машин"}
                </span>
              </div>

              {fleet.description && (
                <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
                  {fleet.description}
                </p>
              )}
            </div>
          </div>

          {/* Метрики */}
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <FleetStat
              icon={CarFront}
              label="Всего машин"
              value={fleet.cars_count.toString()}
            />
            <FleetStat
              icon={Users}
              label="Доступно"
              value={fleet.available.toString()}
              tone="success"
            />
            <FleetStat
              icon={TrendingDown}
              label="От"
              value={`${money(fleet.min_price)}/сут`}
            />
          </div>
        </div>
      </section>

      {/* Каталог машин автопарка */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Автопарк
            </span>
            <h2 className="mt-1 text-2xl font-semibold sm:text-3xl">
              Доступные автомобили
            </h2>
          </div>
          <span className="text-sm text-muted-foreground">
            {fleet.cars.length} предложений
          </span>
        </div>

        {fleet.cars.length > 0 ? (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.05 } },
            }}
            className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {fleet.cars.map((c) => (
              <motion.div
                key={c.id}
                variants={{
                  hidden: { opacity: 0, y: 12 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                <MarketCarCard
                  car={c}
                  onClick={() => navigate(`/car/${c.id}`)}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <Empty
            icon={CarFront}
            title="Машин пока нет"
            description="Автопарк скоро добавит автомобили."
          />
        )}
      </section>
    </div>
  );
}

function FleetStat({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone?: "success" | "warning";
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div
        className={
          "mt-1.5 text-xl font-semibold tracking-tight " +
          (tone === "success"
            ? "text-[hsl(var(--success))]"
            : tone === "warning"
              ? "text-[hsl(var(--warning))]"
              : "")
        }
      >
        {value}
      </div>
    </div>
  );
}

function FleetSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="flex items-center gap-6">
            <Skeleton className="h-20 w-20 rounded-2xl" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-96" />
            </div>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-80 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}