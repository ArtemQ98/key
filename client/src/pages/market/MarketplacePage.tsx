import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CarFront, Search, SearchCheck } from "lucide-react";
import { Button, Empty, Field, Input, Skeleton } from "@/components/ui";
import { useMarketplaceCars, useMarketplaceFleets } from "@/hooks/useMarketplace";
import { useCustomerAuthStore } from "@/stores/customerAuth";
import {
  FleetCard,
  MarketCarCard,
  MarketplaceHeader,
} from "@/features/marketplace";
import { addDaysISO, todayISO } from "@/lib/dates";
import { CustomerAuthModal } from "@/features/marketplace";
import { BookingModal } from "@/features/marketplace";
import type { PublicCar } from "@/api/types";
import { motion } from "framer-motion";

export function MarketplacePage() {
  const navigate = useNavigate();
  const customer = useCustomerAuthStore((s) => s.customer);
  const fetchMe = useCustomerAuthStore((s) => s.fetchMe);

  const [city, setCity] = useState("");
  const [q, setQ] = useState("");
  const [from, setFrom] = useState(todayISO());
  const [to, setTo] = useState(addDaysISO(3));
  const [searchTrigger, setSearchTrigger] = useState(0);

  const [selectedCar, setSelectedCar] = useState<PublicCar | null>(null);
  const [authOpen, setAuthOpen] = useState(false);

  const params = useMemo(
    () => ({
      city: city || undefined,
      q: q || undefined,
      from: searchTrigger > 0 ? from : undefined,
      to: searchTrigger > 0 ? to : undefined,
    }),
    [city, q, from, to, searchTrigger],
  );

  const carsQuery = useMarketplaceCars(params);
  const fleetsQuery = useMarketplaceFleets({ city: city || undefined, q: q || undefined });

  // Восстанавливаем сессию клиента
  useState(() => {
    if (!customer) void fetchMe();
  });

  const cars = carsQuery.data ?? [];
  const fleets = fleetsQuery.data ?? [];

  return (
    <div className="min-h-screen bg-background">
      <MarketplaceHeader
        customer={customer}
        onLogin={() => setAuthOpen(true)}
        onAccount={() => navigate("/account")}
      />

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-border">
        {/* Градиентные пятна */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 left-1/4 h-[500px] w-[500px] animate-pulse rounded-full bg-gradient-to-br from-indigo-500/20 to-blue-500/20 blur-3xl"
          style={{ animationDuration: "6s" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 right-1/4 h-[400px] w-[400px] animate-pulse rounded-full bg-gradient-to-br from-blue-500/15 to-cyan-500/15 blur-3xl"
          style={{ animationDuration: "8s", animationDelay: "1s" }}
        />

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              KEY marketplace
            </span>
            <motion.h1
              className="mt-3 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl md:text-6xl"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
              }}
            >
              <motion.span
                className="inline-block"
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
                  },
                }}
              >
                Арендуй машину
              </motion.span>
              <br />
              <motion.span
                className="inline-block text-gradient"
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
                  },
                }}
              >
                без лишнего.
              </motion.span>
            </motion.h1>
            <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground">
              Автомобили от локальных автопарков. Реальная доступность,
              понятная цена и бронь за несколько минут.
            </p>
          </div>

          {/* Поиск */}
          <div className="mx-auto mt-10 max-w-4xl rounded-2xl border border-border bg-card p-5 shadow-elevated">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <Field label="Город">
                <Input
                  placeholder="Санкт-Петербург"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </Field>
              <Field label="Получение">
                <Input
                  type="date"
                  value={from}
                  min={todayISO()}
                  onChange={(e) => setFrom(e.target.value)}
                />
              </Field>
              <Field label="Возврат">
                <Input
                  type="date"
                  value={to}
                  min={from}
                  onChange={(e) => setTo(e.target.value)}
                />
              </Field>
              <Field label="Что ищете?">
                <Input
                  placeholder="Kia, BMW…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
              </Field>
              <div className="flex items-end">
                <Button
                  className="w-full"
                  onClick={() => setSearchTrigger((n) => n + 1)}
                >
                  <Search className="h-4 w-4" />
                  Найти
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Каталог */}
      <section id="cars" className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Каталог
            </span>
            <h2 className="mt-1 text-2xl font-semibold sm:text-3xl">
              Доступные автомобили
            </h2>
          </div>
          <span className="text-sm text-muted-foreground">
            {carsQuery.isLoading ? "…" : `${cars.length} предложений`}
          </span>
        </div>

        {carsQuery.isLoading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-80 w-full rounded-2xl" />
            ))}
          </div>
        ) : cars.length ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {cars.map((c) => (
              <MarketCarCard
                key={c.id}
                car={c}
                onClick={() => setSelectedCar(c)}
              />
            ))}
          </div>
        ) : (
          <Empty
            icon={SearchCheck}
            title="Ничего не нашли"
            description="Попробуйте другой город, модель или даты."
          />
        )}
      </section>

      {/* Автопарки */}
      {fleets.length > 0 && (
        <section
          id="fleets"
          className="border-y border-border bg-secondary/30 py-16"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="mb-8">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Партнёры KEY
              </span>
              <h2 className="mt-1 text-2xl font-semibold sm:text-3xl">
                Автопарки
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {fleets.map((f) => (
                <FleetCard key={f.id} fleet={f} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Как это работает */}
      <section id="how" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="mb-12 max-w-2xl">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Просто
          </span>
          <h2 className="mt-1 text-2xl font-semibold sm:text-3xl">
            От поиска до ключей в одном потоке.
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <Step n="01" title="Выберите" text="Город, даты и автомобиль от проверенного автопарка." />
          <Step n="02" title="Забронируйте" text="Свободные даты видите сразу. Оплата — лично с владельцем." />
          <Step n="03" title="Получите" text="Детали брони и контакты автопарка — в вашем аккаунте." />
        </div>
      </section>

      {/* Футер */}
      <footer className="border-t border-border py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row sm:px-6">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <CarFront className="h-4 w-4" />
            KEY · marketplace
          </div>
          <button
            onClick={() => {
              window.history.pushState({}, "", "/app");
              window.dispatchEvent(new PopStateEvent("popstate"));
            }}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Владельцам автопарков →
          </button>
        </div>
      </footer>

      {/* Модалка авторизации */}
      <CustomerAuthModal
        open={authOpen}
        onOpenChange={setAuthOpen}
        onSuccess={() => {
          setAuthOpen(false);
        }}
      />

      {/* Модалка бронирования */}
      <BookingModal
        car={selectedCar}
        onOpenChange={(o) => !o && setSelectedCar(null)}
        onNeedAuth={() => {
          setSelectedCar(null);
          setAuthOpen(true);
        }}
      />
    </div>
  );
}

function Step({
  n,
  title,
  text,
}: {
  n: string;
  title: string;
  text: string;
}) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold text-muted-foreground">{n}</div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}