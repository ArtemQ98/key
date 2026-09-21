import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  CarFront,
  Check,
  ChevronRight,
  Fuel,
  Gauge,
  Heart,
  MapPin,
  Settings2,
  Shield,
  Users,
} from "lucide-react";
import { Logo } from "@/components/layout";
import { Button, Skeleton } from "@/components/ui";
import { useMarketplaceCars, usePublicCar } from "@/hooks/useMarketplace";
import { useCustomerAuthStore } from "@/stores/customerAuth";
import {
  BookingModal,
  CustomerAuthModal,
  MarketCarCard,
} from "@/features/marketplace";
import { money } from "@/lib/format";
import { cn } from "@/lib/cn";

export function CarDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const carId = id ? Number(id) : null;

  const carQuery = usePublicCar(carId);
  const customer = useCustomerAuthStore((s) => s.customer);

  const [bookingOpen, setBookingOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"specs" | "rules">("specs");
  const [mainPhoto, setMainPhoto] = useState(0);

  // Похожие машины — из того же автопарка
  const relatedQuery = useMarketplaceCars({
    city: carQuery.data?.fleet_city,
  });

  const related = useMemo(() => {
    if (!relatedQuery.data || !carQuery.data) return [];
    return relatedQuery.data
      .filter((c) => c.id !== carQuery.data.id)
      .slice(0, 3);
  }, [relatedQuery.data, carQuery.data]);

  // Моковые фото — если у машины нет своих, показываем заглушки
  const photos = useMemo(() => {
    if (!carQuery.data) return [];
    if (carQuery.data.image_url) {
      return [carQuery.data.image_url];
    }
    return [];
  }, [carQuery.data]);

  if (carQuery.isLoading) {
    return <DetailSkeleton />;
  }

  if (!carQuery.data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="text-6xl font-bold tracking-tight">404</div>
        <p className="text-muted-foreground">Автомобиль не найден.</p>
        <Button onClick={() => navigate("/")}>
          <ArrowLeft className="h-4 w-4" />В каталог
        </Button>
      </div>
    );
  }

  const car = carQuery.data;

  function handleBook() {
    if (!customer) {
      setAuthOpen(true);
      return;
    }
    setBookingOpen(true);
  }

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-0">
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

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Хлебные крошки */}
        <nav className="mb-4 flex items-center gap-2 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">
            Каталог
          </Link>
          <ChevronRight className="h-3 w-3" />
          <span className="hover:text-foreground">{car.fleet_title}</span>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground">
            {car.brand} {car.model}
          </span>
        </nav>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Левая колонка — галерея + инфо */}
          <div className="lg:col-span-2 space-y-6">
            {/* Галерея */}
            <div className="space-y-3">
              <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-border bg-secondary/40">
                {photos.length > 0 ? (
                  <motion.img
                    key={mainPhoto}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    src={photos[mainPhoto]}
                    alt={`${car.brand} ${car.model}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <CarFront
                      className="h-32 w-32 text-muted-foreground/20"
                      strokeWidth={1}
                    />
                  </div>
                )}

                <span className="absolute left-4 top-4 rounded-full bg-[hsl(var(--success))]/90 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
                  Доступно
                </span>

                <button
                  type="button"
                  className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-background/90 text-foreground backdrop-blur-sm transition-colors hover:bg-background"
                  aria-label="В избранное"
                >
                  <Heart className="h-4 w-4" />
                </button>
              </div>

              {/* Миниатюры — если больше одного фото */}
              {photos.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {photos.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => setMainPhoto(i)}
                      className={cn(
                        "aspect-[4/3] overflow-hidden rounded-lg border-2 transition-colors",
                        i === mainPhoto
                          ? "border-primary"
                          : "border-transparent opacity-60 hover:opacity-100",
                      )}
                    >
                      <img
                        src={p}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Заголовок */}
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {car.category || "Автомобиль"} · {car.year}
              </div>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
                {car.brand} {car.model}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {car.location}
                </span>
              </div>
            </div>

            {/* Вкладки */}
            <div className="border-b border-border">
              <div className="flex gap-1">
                <TabButton
                  active={activeTab === "specs"}
                  onClick={() => setActiveTab("specs")}
                >
                  Характеристики
                </TabButton>
                <TabButton
                  active={activeTab === "rules"}
                  onClick={() => setActiveTab("rules")}
                >
                  Условия
                </TabButton>
              </div>
            </div>

            {/* Контент вкладок */}
            {activeTab === "specs" && <SpecsTab car={car} />}
            {activeTab === "rules" && <RulesTab car={car} />}
          </div>

          {/* Правая колонка — sticky sidebar */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              {/* Карточка с ценой */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-semibold tracking-tight">
                    {money(car.daily_price)}
                  </span>
                  <span className="text-sm text-muted-foreground">/ сутки</span>
                </div>

                {car.deposit > 0 && (
                  <div className="mt-1 text-xs text-muted-foreground">
                    Депозит: {money(car.deposit)}
                  </div>
                )}

                <Button className="mt-5 w-full" size="lg" onClick={handleBook}>
                  Забронировать
                </Button>

                <div className="mt-4 flex items-center gap-2 rounded-lg bg-secondary/50 p-3 text-xs text-muted-foreground">
                  <Shield className="h-3.5 w-3.5 shrink-0" />
                  <span>
                    Оплата проходит лично с владельцем. После бронирования
                    владелец подтвердит и назначит встречу.
                  </span>
                </div>
              </div>

              {/* Автопарк */}
              <Link
                to={`/fleet/${car.fleet_slug}`}
                className="block rounded-2xl border border-border bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-elevated"
              >
                <div className="flex items-start gap-3">
                  {car.fleet_avatar_url ? (
                  <img
                    src={car.fleet_avatar_url}
                    alt={car.fleet_title}
                    className="h-10 w-10 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-foreground text-background text-base font-bold">
                    {car.fleet_title.slice(0, 1)}
                  </div>
                )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">
                      {car.fleet_title}
                    </div>
                    <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      {car.fleet_city}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </div>
              </Link>

              {/* Ключевые условия */}
              {/* <div className="rounded-2xl border border-border bg-card p-5">
                <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Кратко
                </div>
                <ul className="mt-3 space-y-2 text-sm">
                  <CheckRow>Свободный пробег 300 км/сутки</CheckRow>
                  <CheckRow>Возврат с тем же уровнем топлива</CheckRow>
                  <CheckRow>Возраст водителя от 23 лет</CheckRow>
                  <CheckRow>Стаж вождения от 3 лет</CheckRow>
                </ul>
              </div> */}
            </div>
          </aside>
        </div>

        {/* Похожие */}
        {related.length > 0 && (
          <section className="mt-16">
            <div className="mb-6 flex items-end justify-between">
              <div>
                <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Другие варианты
                </span>
                <h2 className="mt-1 text-2xl font-semibold">
                  Похожие автомобили
                </h2>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((c) => (
                <MarketCarCard
                  key={c.id}
                  car={c}
                  onClick={() => navigate(`/car/${c.id}`)}
                />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Мобильный sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-background/95 p-4 backdrop-blur-xl lg:hidden">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-lg font-semibold">
              {money(car.daily_price)}
            </div>
            <div className="text-xs text-muted-foreground">за сутки</div>
          </div>
          <Button onClick={handleBook} size="lg" className="flex-1">
            Забронировать
          </Button>
        </div>
      </div>

      {/* Модалки */}
      <CustomerAuthModal
        open={authOpen}
        onOpenChange={setAuthOpen}
        onSuccess={() => {
          setAuthOpen(false);
          setBookingOpen(true);
        }}
      />

      <BookingModal
        car={bookingOpen ? car : null}
        onOpenChange={(o) => !o && setBookingOpen(false)}
        onNeedAuth={() => {
          setBookingOpen(false);
          setAuthOpen(true);
        }}
        onBooked={() => {
          setBookingOpen(false);
          navigate("/account");
        }}
      />
    </div>
  );
}

// ============ Вкладка «Характеристики» ============

function SpecsTab({
  car,
}: {
  car: NonNullable<ReturnType<typeof usePublicCar>["data"]>;
}) {
  const specs = [
    { icon: Calendar, label: "Год выпуска", value: String(car.year) },
    { icon: Settings2, label: "Коробка", value: car.transmission || "—" },
    { icon: Users, label: "Мест", value: `${car.seats}` },
    { icon: Fuel, label: "Топливо", value: car.fuel || "—" },
    {
      icon: Gauge,
      label: "Пробег",
      value: `${car.mileage.toLocaleString("ru-RU")} км`,
    },
    { icon: CarFront, label: "Категория", value: car.category || "—" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {specs.map((s) => (
        <div
          key={s.label}
          className="rounded-xl border border-border bg-card p-4"
        >
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <s.icon className="h-3.5 w-3.5" />
            {s.label}
          </div>
          <div className="mt-1.5 text-sm font-medium">{s.value}</div>
        </div>
      ))}
    </div>
  );
}

// ============ Вкладка «Условия» ============

function RulesTab({
  car,
}: {
  car: NonNullable<ReturnType<typeof usePublicCar>["data"]>;
}) {
  const terms = car.rental_terms ?? [];

  // Если владелец задал условия — показываем их
  if (terms.length > 0) {
    return (
      <div className="space-y-4">
        {terms.map((section, i) => (
          <RuleSection key={i} title={section.title} items={section.items} />
        ))}
      </div>
    );
  }

  // Иначе — дефолтный набор с учётом депозита
  return (
    <div className="space-y-4">
      <RuleSection
        title="Аренда"
        items={[
          "Минимальный срок аренды — 1 сутки",
          car.deposit > 0
            ? `Депозит ${money(car.deposit)}, возвращается после сдачи`
            : "Депозит не требуется",
          "Свободный пробег 300 км / сутки",
          "Превышение пробега — 15 ₽ / км",
        ]}
      />
      <RuleSection
        title="Требования к водителю"
        items={[
          "Возраст от 23 лет",
          "Стаж вождения от 3 лет",
          "Паспорт РФ и водительское удостоверение",
        ]}
      />
      <RuleSection
        title="Топливо и мойка"
        items={[
          "Возврат с тем же уровнем топлива",
          "Машина должна быть чистой при возврате",
        ]}
      />
    </div>
  );
}

function RuleSection({ title, items }: { title: string; items: string[] }) {
  // Пропускаем пустые секции
  const nonEmpty = items.filter((i) => i.trim() !== "");
  if (!title.trim() && nonEmpty.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      {title && <h3 className="text-sm font-semibold">{title}</h3>}
      {nonEmpty.length > 0 && (
        <ul
          className={
            title
              ? "mt-3 space-y-2 text-sm text-muted-foreground"
              : "space-y-2 text-sm text-muted-foreground"
          }
        >
          {nonEmpty.map((item, i) => (
            <li key={i} className="flex items-start gap-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--success))]" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ============ Хелперы ============

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative px-4 py-3 text-sm font-medium transition-colors",
        active
          ? "text-foreground"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
      {active && (
        <motion.div
          layoutId="car-tab"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
        />
      )}
    </button>
  );
}

// function CheckRow({ children }: { children: React.ReactNode }) {
//   return (
//     <li className="flex items-start gap-2">
//       <Check className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--success))]" />
//       {children}
//     </li>
//   );
// }

function DetailSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Skeleton className="aspect-[16/10] w-full rounded-2xl" />
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-32 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-64 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
