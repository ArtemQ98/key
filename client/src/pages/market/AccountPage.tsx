import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Bell, CarFront, Clock3, LogOut } from "lucide-react";
import { Logo } from "@/components/layout";
import {
  Button,
  Empty,
  RentalStatusBadge,
  Spinner,
  UnreadBadge,
} from "@/components/ui";
import { useCustomerAuthStore } from "@/stores/customerAuth";
import {
  useCancelBooking,
  useCustomerBookings,
} from "@/hooks/useCustomerBookings";
import { useUnreadCount } from "@/hooks/useMessages";
import { money } from "@/lib/format";
import { formatDate, formatDateTime } from "@/lib/dates";
import { toast } from "sonner";

export function AccountPage() {
  const navigate = useNavigate();
  const customer = useCustomerAuthStore((s) => s.customer);
  const fetchMe = useCustomerAuthStore((s) => s.fetchMe);
  const logout = useCustomerAuthStore((s) => s.logout);
  const bookingsQuery = useCustomerBookings();
  const cancelBooking = useCancelBooking();
  const { data: unread } = useUnreadCount("customer");
  const totalUnread = unread?.total ?? 0;
  const unreadByRental = unread?.by_rental ?? {};

  useEffect(() => {
    if (!customer) void fetchMe();
  }, [customer, fetchMe]);

  if (!customer) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  function handleCancel(id: number) {
    if (!confirm("Отменить бронирование?")) return;
    cancelBooking.mutate(
      { id },
      {
        onSuccess: () => toast.success("Бронь отменена"),
        onError: (e) =>
          toast.error(e instanceof Error ? e.message : "Ошибка"),
      },
    );
  }

  const bookings = bookingsQuery.data ?? [];

  return (
    <div className="min-h-screen bg-background">
      {/* Шапка */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Каталог
          </Link>

          <Logo size="md" />

          <div className="flex items-center gap-3">
            <div className="relative">
              <Bell className="h-5 w-5 text-muted-foreground" />
              {totalUnread > 0 && (
                <UnreadBadge
                  count={totalUnread}
                  className="absolute -right-2 -top-2"
                />
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                logout();
                navigate("/");
              }}
            >
              <LogOut className="h-4 w-4" />
              Выйти
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <div className="mb-8">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Мой KEY
          </span>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">
            Привет, {customer.name?.split(" ")[0]}.
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Здесь все ваши поездки и бронирования.
          </p>
        </div>

        <section className="rounded-2xl border border-border bg-card shadow-card">
          <div className="flex items-center justify-between border-b border-border p-5">
            <h2 className="text-base font-semibold">Мои поездки</h2>
            <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {bookings.length}
            </span>
          </div>

          {bookingsQuery.isLoading ? (
            <div className="flex justify-center py-12">
              <Spinner className="h-6 w-6" />
            </div>
          ) : bookings.length ? (
            <div className="divide-y divide-border">
              {bookings.map((b) => {
                const unreadForThis = unreadByRental[String(b.id)] ?? 0;
                return (
                  <div
                    key={b.id}
                    onClick={() => navigate(`/account/bookings/${b.id}`)}
                    className="flex cursor-pointer flex-col gap-4 p-5 transition-colors hover:bg-secondary/40 sm:flex-row sm:items-center"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary">
                      <CarFront className="h-5 w-5 text-muted-foreground" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold">{b.car}</div>
                      <div className="text-xs text-muted-foreground">
                        {b.fleet} · {b.city}
                      </div>

                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span>{b.booking_code}</span>
                        <span>·</span>
                        <span>
                          {formatDate(b.starts_at)} — {formatDate(b.ends_at)}
                        </span>
                        {unreadForThis > 0 && (
                          <UnreadBadge count={unreadForThis} />
                        )}
                      </div>

                      {b.pickup_meeting_at && (
                        <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock3 className="h-3 w-3" />
                          Получение: {formatDateTime(b.pickup_meeting_at)}
                          {b.pickup_meeting_location &&
                            ` · ${b.pickup_meeting_location}`}
                        </div>
                      )}
                      {b.return_meeting_at && (
                        <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock3 className="h-3 w-3" />
                          Возврат: {formatDateTime(b.return_meeting_at)}
                          {b.return_meeting_location &&
                            ` · ${b.return_meeting_location}`}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-start gap-2 sm:items-end">
                      <div className="text-base font-semibold">
                        {money(b.amount)}
                      </div>
                      <RentalStatusBadge status={b.status} />
                      {["hold", "pending", "confirmed"].includes(b.status) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCancel(b.id);
                          }}
                          loading={cancelBooking.isPending}
                        >
                          Отменить
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8">
              <Empty
                icon={Clock3}
                title="Бронирований пока нет"
                description="Выберите автомобиль в каталоге — он появится здесь."
                action={
                  <Link to="/">
                    <Button>Перейти к автомобилям</Button>
                  </Link>
                }
              />
            </div>
          )}
        </section>
      </main>
    </div>
  );
}