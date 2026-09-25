import { useState } from "react";
import { Info } from "lucide-react";
import { Modal, ModalBody, ModalHeader, toast } from "@/components/ui";
import { useAuthStore } from "@/stores/auth";
import { api } from "@/api";
import { PLANS } from "../plans";
import { PlanCard } from "./PlanCard";

interface PlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PlanModal({ open, onOpenChange }: PlanModalProps) {
  const user = useAuthStore((s) => s.user);
  const [busyPlan, setBusyPlan] = useState<string | null>(null);

  async function handleChoose(planId: string) {
    if (busyPlan) return;

    // Уже на этом тарифе — ничего не делаем
    if (user?.plan === planId) return;

    // Понижение до Free — пока через поддержку
    if (planId === "free") {
      toast.info("Понижение тарифа — обратитесь в поддержку", {
        duration: 5000,
      });
      return;
    }

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
      toast.error(
        e instanceof Error ? e.message : "Не удалось создать платёж",
      );
      setBusyPlan(null);
    }
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} size="xl">
      <ModalHeader
        title="Тарифы KEY"
        description="Выберите план под размер вашего автопарка."
      />
      <ModalBody className="space-y-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {PLANS.map((p) => (
            <PlanCard
              key={p.id}
              plan={p}
              current={user?.plan === p.id}
              onChoose={() => handleChoose(p.id)}
            />
          ))}
        </div>

        <div className="flex items-start gap-3 rounded-xl bg-secondary/40 p-4 text-xs text-muted-foreground">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Оплата проходит через ЮKassa. Подписка оформляется на 1 месяц и
            продлевается автоматически. Отменить можно в любой момент — доступ
            сохранится до конца оплаченного периода.
          </span>
        </div>
      </ModalBody>
    </Modal>
  );
}