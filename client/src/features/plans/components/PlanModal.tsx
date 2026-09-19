import { Info } from "lucide-react";
import { Modal, ModalBody, ModalHeader } from "@/components/ui";
import { useAuthStore } from "@/stores/auth";
import { PLANS } from "../plans";
import { PlanCard } from "./PlanCard";
import { toast } from "sonner";

interface PlanModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PlanModal({ open, onOpenChange }: PlanModalProps) {
  const user = useAuthStore((s) => s.user);

  function handleChoose() {
    toast.info(
      "Онлайн-оплата появится в ближайшее время. Пока свяжитесь с нами.",
      { duration: 5000 },
    );
    onOpenChange(false);
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
              onChoose={handleChoose}
            />
          ))}
        </div>

        <div className="flex items-start gap-3 rounded-xl bg-secondary/40 p-4 text-xs text-muted-foreground">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Онлайн-оплата появится в ближайшее время. Пока вы можете управлять
            парком на текущем тарифе. Для перехода на Pro или Business —
            напишите нам.
          </span>
        </div>
      </ModalBody>
    </Modal>
  );
}