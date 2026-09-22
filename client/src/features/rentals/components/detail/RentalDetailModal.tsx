import { useState } from "react";
import { ChevronRight, X } from "lucide-react";
import {
  Button,
  Modal,
  ModalBody,
  RentalStatusBadge,
  Spinner,
  toast,
} from "@/components/ui";
import { useRentalDetail, useUpdateRentalStatus } from "@/hooks/useRentals";
import type { RentalStatus } from "@/api/types";
import { RentalProgress } from "./RentalProgress";
import { RentalStats } from "./RentalStats";
import { RentalOpsPanel } from "./RentalOpsPanel";
import { RentalDataColumns } from "./RentalDataColumns";
import { RentalEventsTimeline } from "./RentalEventsTimeline";
import { AlertTriangle, Wallet } from "lucide-react";
import { useTogglePayment } from "@/hooks/useRentals";
import { ChatPanel } from "./ChatPanel";

const NEXT_STATUS: Partial<Record<RentalStatus, RentalStatus[]>> = {
  hold: ["confirmed", "rejected"],
  pending: ["review", "confirmed", "rejected"],
  review: ["confirmed", "rejected"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["active", "cancelled"],
  active: ["returned"],
  returned: ["completed"],
};

const ACTION_LABELS: Record<RentalStatus, string> = {
  hold: "Удержать",
  pending: "Вернуть в новые",
  review: "Отправить на проверку",
  confirmed: "Подтвердить",
  preparing: "Начать подготовку",
  active: "Выдать авто",
  returned: "Принять возврат",
  completed: "Закрыть",
  cancelled: "Отменить",
  expired: "Пометить истёкшей",
  rejected: "Отклонить",
};

interface RentalDetailModalProps {
  rentalId: number | null;
  onOpenChange: (open: boolean) => void;
}

export function RentalDetailModal({
  rentalId,
  onOpenChange,
}: RentalDetailModalProps) {
  const detailQuery = useRentalDetail(rentalId);
  const updateStatus = useUpdateRentalStatus();
  const [tab, setTab] = useState<"ops" | "data" | "events" | "chat">("ops");
  const togglePayment = useTogglePayment();

  function transition(status: RentalStatus) {
    console.log("🚀 transition called:", rentalId, status);
    if (!rentalId) {
        console.warn("🚫 rentalId is null");
        return;
    }
    updateStatus.mutate(
        { id: rentalId, status },
        {
        onSuccess: () => console.log("✅ status updated"),
        onError: (e) => console.error("❌ status update failed:", e),
        },
    );
    }

  return (
    <Modal
      open={rentalId !== null}
      onOpenChange={(o) => !o && onOpenChange(false)}
      size="xl"
      hideClose
    >
      {detailQuery.isLoading || !detailQuery.data ? (
        <div className="flex h-96 items-center justify-center">
          <Spinner className="h-6 w-6" />
        </div>
      ) : (
        <>
          <div className="border-b border-border p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {detailQuery.data.booking_code ||
                    `Аренда #${detailQuery.data.id}`}
                </div>
                <h2 className="mt-0.5 text-xl font-semibold">
                  {detailQuery.data.car}
                </h2>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {detailQuery.data.client}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <RentalStatusBadge status={detailQuery.data.status} />
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  aria-label="Закрыть"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <RentalProgress status={detailQuery.data.status} />

            {NEXT_STATUS[detailQuery.data.status] && (
            <div className="mt-5 space-y-3">
              <div className="flex flex-wrap gap-2">
                {NEXT_STATUS[detailQuery.data.status]?.map((s) => {
                  const needsPayment =
                    s === "completed" &&
                    detailQuery.data.payment_status !== "paid";

                  return (
                    <Button
                      key={s}
                      variant={
                        s === "cancelled" || s === "rejected" ? "danger" : "primary"
                      }
                      size="sm"
                      onClick={() => {
                        if (needsPayment) {
                          toast.warning(
                            "Сначала подтвердите оплату в панели операций ниже",
                            { duration: 4000 },
                          );
                          return;
                        }
                        transition(s);
                      }}
                      loading={updateStatus.isPending}
                    >
                      {ACTION_LABELS[s]}
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  );
                })}
              </div>

              {/* Явное предупреждение под кнопками */}
              {detailQuery.data.status === "returned" &&
                detailQuery.data.payment_status !== "paid" && (
                  <div className="flex items-start gap-3 rounded-xl border border-[hsl(var(--warning))]/30 bg-[hsl(var(--warning))]/10 p-3">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--warning))]" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="text-sm font-medium text-[hsl(var(--warning))]">
                        Сделка ещё не оплачена
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Подтвердите оплату в блоке «Операции» ниже, чтобы закрыть сделку.
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          togglePayment.mutate(
                            { id: detailQuery.data.id, paid: true },
                            {
                              onSuccess: () => {
                                toast.success("Оплата подтверждена");
                              },
                              onError: (e) =>
                                toast.error(
                                  e instanceof Error ? e.message : "Ошибка",
                                ),
                            },
                          );
                        }}
                        disabled={togglePayment.isPending}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[hsl(var(--warning))] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[hsl(var(--warning))]/90 disabled:opacity-50"
                      >
                        <Wallet className="h-3.5 w-3.5" />
                        {togglePayment.isPending
                          ? "Подтверждаем…"
                          : "Подтвердить оплату"}
                      </button>
                    </div>
                  </div>
                )}
            </div>
          )}
          </div>

          <ModalBody className="space-y-5">
            <RentalStats rental={detailQuery.data} />

            <div className="inline-flex rounded-lg bg-secondary p-1">
              <TabBtn active={tab === "ops"} onClick={() => setTab("ops")}>
                Операции
              </TabBtn>
              <TabBtn active={tab === "data"} onClick={() => setTab("data")}>
                Данные
              </TabBtn>
              <TabBtn
                active={tab === "events"}
                onClick={() => setTab("events")}
              >
                История
              </TabBtn>
              <TabBtn active={tab === "chat"} onClick={() => setTab("chat")}>
                Чат
              </TabBtn>
            </div>

            {tab === "ops" && <RentalOpsPanel rental={detailQuery.data} />}
            {tab === "data" && <RentalDataColumns rental={detailQuery.data} />}
            {tab === "events" && (
              <RentalEventsTimeline events={detailQuery.data.events} />
            )}
            {tab === "chat" && (
              <ChatPanel
                rentalId={detailQuery.data.id}
                otherName={detailQuery.data.client}
                as="owner"
              />
            )}
          </ModalBody>
        </>
      )}
    </Modal>
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
