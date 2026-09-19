import { useState } from "react";
import { ChevronRight } from "lucide-react";
import {
  Button,
  Modal,
  ModalBody,
  RentalStatusBadge,
  Spinner,
} from "@/components/ui";
import { useRentalDetail, useUpdateRentalStatus } from "@/hooks/useRentals";
import type { RentalStatus } from "@/api/types";
import { RentalProgress } from "./RentalProgress";
import { RentalStats } from "./RentalStats";
import { RentalOpsPanel } from "./RentalOpsPanel";
import { RentalDataColumns } from "./RentalDataColumns";
import { RentalEventsTimeline } from "./RentalEventsTimeline";

const NEXT_STATUS: Partial<Record<RentalStatus, RentalStatus[]>> = {
  hold: ["confirmed", "rejected"],
  pending: ["review", "confirmed", "rejected"],
  review: ["confirmed", "rejected"],
  confirmed: ["preparing", "cancelled"],
  preparing: ["active", "cancelled"],
  active: ["returned"],
  returned: ["completed"],
};

const STATUS_LABELS: Record<RentalStatus, string> = {
  hold: "Подтвердить",
  pending: "Подтвердить",
  review: "Одобрить",
  confirmed: "Подготовить",
  preparing: "Выдать авто",
  active: "Принять возврат",
  returned: "Закрыть",
  completed: "Завершена",
  cancelled: "Отменить",
  expired: "Истекла",
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
  const [tab, setTab] = useState<"ops" | "data" | "events">("ops");

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
              <RentalStatusBadge status={detailQuery.data.status} />
            </div>

            <RentalProgress status={detailQuery.data.status} />

            {NEXT_STATUS[detailQuery.data.status] && (
              <div className="mt-5 flex flex-wrap gap-2">
                {NEXT_STATUS[detailQuery.data.status]?.map((s) => (
                  <Button
                    key={s}
                    variant={
                      s === "cancelled" || s === "rejected"
                        ? "danger"
                        : "primary"
                    }
                    size="sm"
                    onClick={() => transition(s)}
                    loading={updateStatus.isPending}
                  >
                    {STATUS_LABELS[s]}
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                ))}
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
            </div>

            {tab === "ops" && <RentalOpsPanel rental={detailQuery.data} />}
            {tab === "data" && <RentalDataColumns rental={detailQuery.data} />}
            {tab === "events" && (
              <RentalEventsTimeline events={detailQuery.data.events} />
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
