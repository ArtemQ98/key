import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Check,
  Sparkles,
  CreditCard,
  RefreshCw,
  XCircle,
  Mail,
  Send,
  Phone,
} from "lucide-react";
import { Logo } from "@/components/layout";
import { Badge, Button, Card, CardContent, toast } from "@/components/ui";
import { PLANS } from "@/features/plans/plans";
import { money } from "@/lib/format";
import { cn } from "@/lib/cn";
import { api } from "@/api";
import { useAuthStore } from "@/stores/auth";
import { useState } from "react";

export function PricingPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [busyPlan, setBusyPlan] = useState<string | null>(null);

  const handleSelect = async (planId: string) => {
    if (busyPlan) return;
    // Free — ничего не делаем, это дефолт
    if (planId === "free") {
      if (!user) navigate("/app/register");
      return;
    }

    // Не залогинен — отправляем на регистрацию с выбранным тарифом
    if (!user) {
      navigate(`/app/register?plan=${planId}`);
      return;
    }

    // Залогинен — создаём платёж в ЮKassa
    setBusyPlan(planId);
    try {
      const { confirmation_url } = await api.post<{ confirmation_url: string }>(
        "/billing/subscribe",
        { plan_id: planId },
      );
      if (confirmation_url) {
        window.location.href = confirmation_url;
      } else {
        toast.error("Не удалось получить ссылку на оплату");
        setBusyPlan(null);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось создать платёж");
      setBusyPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            На главную
          </Link>
          <Logo size="md" />
          <div className="w-20" />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Тарифы KEY
          </span>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
            Платите за то, что используете
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground">
            Начните бесплатно с 3 машинами. Растите — переходите на Pro или
            Business. Подписка оформляется на месяц и продлевается
            автоматически. Отменить можно в любой момент — доступ сохранится до
            конца оплаченного периода.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
          {PLANS.map((plan) => {
            const priceLabel =
              plan.price === 0 ? "Бесплатно" : money(plan.price);
            const isPro = plan.id === "pro";
            const isCurrentPlan = user?.plan === plan.id;

            return (
              <Card
                key={plan.id}
                className={cn(
                  "relative flex flex-col",
                  isPro && "ring-1 ring-primary/30 shadow-elevated",
                )}
              >
                {isPro && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-[10px] font-semibold text-primary-foreground">
                    Популярный
                  </span>
                )}

                <CardContent className="flex flex-1 flex-col p-6 pt-8">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">{plan.name}</h3>
                    {plan.id === "free" && (
                      <Badge variant="success">Стартовый</Badge>
                    )}
                  </div>

                  <div className="mt-3">
                    <span className="text-3xl font-semibold tracking-tight">
                      {priceLabel}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-sm text-muted-foreground">
                        {" "}
                        / мес
                      </span>
                    )}
                  </div>

                  <div className="mt-1 text-xs text-muted-foreground">
                    до {plan.limit}{" "}
                    {plan.limit === 1 ? "машины" : "машин"}
                  </div>

                  <ul className="mt-6 space-y-2.5">
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

                  <div className="mt-auto pt-6">
                    <Button
                      variant={isPro ? "primary" : "outline"}
                      className="w-full"
                      disabled={isCurrentPlan || busyPlan !== null}
                      loading={busyPlan === plan.id}
                      onClick={() => handleSelect(plan.id)}
                    >
                      {isCurrentPlan
                        ? "Текущий тариф"
                        : plan.price === 0
                          ? "Начать бесплатно"
                          : `Выбрать ${plan.name}`}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Условия подписки */}
        <div className="mt-16 rounded-2xl border border-border bg-secondary/40 p-8">
          <h3 className="text-base font-semibold">Условия подписки</h3>
          <ul className="mt-4 grid grid-cols-1 gap-4 text-sm text-muted-foreground sm:grid-cols-3">
            <li className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background">
                <CreditCard className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="font-medium text-foreground">Оплата</div>
                Подписка оформляется на 1 месяц. Оплата проходит через
                ЮKassa — банковской картой или другим доступным способом.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background">
                <RefreshCw className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="font-medium text-foreground">Автопродление</div>
                Подписка продлевается автоматически в конце каждого периода.
                Списание — с привязанной карты.
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-background">
                <XCircle className="h-4 w-4 text-primary" />
              </div>
              <div>
                <div className="font-medium text-foreground">Отмена</div>
                Отменить можно в любой момент в личном кабинете. Доступ
                сохранится до конца оплаченного периода, возврат — за
                неиспользованную часть.
              </div>
            </li>
          </ul>
        </div>

        {/* Как получить доступ */}
        <div className="mt-6 rounded-2xl border border-border bg-secondary/40 p-8">
          <h3 className="text-base font-semibold">
            Как получить доступ после оплаты
          </h3>
          <p className="mt-3 text-sm text-muted-foreground">
            KEY — цифровой сервис, физическая доставка не требуется. После
            успешной оплаты доступ к выбранному тарифу активируется
            автоматически в течение нескольких минут. Уведомление придёт на
            email, указанный при регистрации. Войти в кабинет владельца можно
            с любого устройства в браузере.
          </p>
        </div>

        {/* Что входит во все тарифы */}
        <div className="mt-6 rounded-2xl border border-border bg-secondary/40 p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-blue-500 text-white">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold">
                Что входит во все тарифы
              </h3>
              <ul className="mt-3 grid grid-cols-1 gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--success))]" />
                  Витрина автопарка в каталоге KEY
                </li>
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--success))]" />
                  Управление арендами и клиентами
                </li>
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--success))]" />
                  Финансы по каждой машине
                </li>
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--success))]" />
                  Email-авторизация и уведомления
                </li>
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--success))]" />
                  Загрузка фото и документов
                </li>
                <li className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--success))]" />
                  Поддержка по email
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-16 border-t border-border pt-8 text-center text-xs text-muted-foreground">
          <p>Курочкин Артём Михайлович · ИНН 713500544320 · самозанятый</p>
          <p className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
            <a
              href="tel:+79991234567"
              className="inline-flex items-center gap-1.5 text-primary underline-offset-4 hover:underline"
            >
              <Phone className="h-3.5 w-3.5" />
              +7 999 123-45-67
            </a>
            <a
              href="mailto:ArtTeam71@yandex.ru"
              className="inline-flex items-center gap-1.5 text-primary underline-offset-4 hover:underline"
            >
              <Mail className="h-3.5 w-3.5" />
              ArtTeam71@yandex.ru
            </a>
            <a
              href="https://t.me/artteam71"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-primary underline-offset-4 hover:underline"
            >
              <Send className="h-3.5 w-3.5" />
              @artteam71
            </a>
          </p>
          <p className="mt-3">
            <Link
              to="/terms"
              className="text-primary underline-offset-4 hover:underline"
            >
              Пользовательское соглашение
            </Link>
            {" · "}
            <Link
              to="/privacy"
              className="text-primary underline-offset-4 hover:underline"
            >
              Политика конфиденциальности
            </Link>
            {" · "}
            <Link
              to="/contacts"
              className="text-primary underline-offset-4 hover:underline"
            >
              Контакты
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}