import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/layout";
import { Button, RentalStatusBadge, Spinner } from "@/components/ui";
import {
  useCustomerBookingDetail,
  useCancelBooking,
} from "@/hooks/useCustomerBookings";
import { useCustomerAuthStore } from "@/stores/customerAuth";
import { ChatPanel } from "@/features/rentals/components/detail/ChatPanel";
import { RentalEventsTimeline } from "@/features/rentals/components/detail/RentalEventsTimeline";
import { money } from "@/lib/format";
import { formatDate, formatDateTime } from "@/lib/dates";
import { toast } from "sonner";

export function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const bookingId = id ? Number(id) : null;

  const customer = useCustomerAuthStore((s) => s.customer);
  const detail = useCustomerBookingDetail(bookingId);
  const cancelBooking = useCancelBooking();

  const [tab, setTab] = useState<"details" | "events" | "chat">("details");

  if (!customer) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  if (detail.isLoading || !detail.data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  const b = detail.data;

  function handleCancel() {
    if (!bookingId || !confirm("Отменить бронирование?")) return;
    cancelBooking.mutate(
      { id: bookingId },
      {
        onSuccess: () => toast.success("Бронь отменена"),
        onError: (e) => toast.error(e instanceof Error ? e.message : "Ошибка"),
      },
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
          <Link
            to="/account"
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Мои поездки
          </Link>
          <Logo size="md" />
          <div className="w-20" />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {b.booking_code}
            </div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              {b.car}
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {b.fleet} · {b.city}
            </p>
          </div>
          <RentalStatusBadge status={b.status} />
        </div>

        {/* Табы */}
        <div className="mb-5 inline-flex rounded-lg bg-secondary p-1">
          <TabBtn active={tab === "details"} onClick={() => setTab("details")}>
            Детали
          </TabBtn>
          <TabBtn active={tab === "events"} onClick={() => setTab("events")}>
            История
          </TabBtn>
          <TabBtn active={tab === "chat"} onClick={() => setTab("chat")}>
            Чат
          </TabBtn>
        </div>

        {tab === "details" && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <InfoRow
                  label="Даты"
                  value={`${formatDate(b.starts_at)} — ${formatDate(b.ends_at)}`}
                />
                <InfoRow label="Сумма" value={money(b.amount)} />
                <InfoRow label="Депозит" value={money(b.deposit)} />
                <InfoRow
                  label="Оплата"
                  value={b.payment_status === "paid" ? "Оплачено" : "Не оплачено"}
                />
                {b.pickup_meeting_at && (
                  <InfoRow
                    label="Получение"
                    value={`${formatDateTime(b.pickup_meeting_at)}${
                      b.pickup_meeting_location
                        ? ` · ${b.pickup_meeting_location}`
                        : ""
                    }`}
                  />
                )}
                {b.return_meeting_at && (
                  <InfoRow
                    label="Возврат"
                    value={`${formatDateTime(b.return_meeting_at)}${
                      b.return_meeting_location
                        ? ` · ${b.return_meeting_location}`
                        : ""
                    }`}
                  />
                )}
              </div>
            </div>

            {["hold", "pending", "confirmed"].includes(b.status) && (
              <Button
                variant="ghost"
                onClick={handleCancel}
                loading={cancelBooking.isPending}
              >
                Отменить бронь
              </Button>
            )}
          </div>
        )}

        {tab === "events" && <RentalEventsTimeline events={b.events ?? []} />}

        {tab === "chat" && (
            <ChatPanel rentalId={b.id} otherName="Владелец" as="customer" />
        )}
      </main>
    </div>
  );
}

function TabBtn({
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
      className={
        "rounded-md px-3 py-1.5 text-xs font-medium transition-colors " +
        (active
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground")
      }
    >
      {children}
    </button>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm font-medium">{value}</div>
    </div>
  );
}