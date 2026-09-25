import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Modal, ModalBody } from "@/components/ui";
import { Logo } from "@/components/layout";
import { CustomerAuthForm } from "./CustomerAuthForm";
import { useCustomerAuthStore } from "@/stores/customerAuth";

interface CustomerAuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CustomerAuthModal({
  open,
  onOpenChange,
  onSuccess,
}: CustomerAuthModalProps) {
  const navigate = useNavigate();
  const customer = useCustomerAuthStore((s) => s.customer);

  // Как только клиент залогинился — закрываем модалку и ведём
  // на welcome (если онбординг не пройден) или в /account
  useEffect(() => {
    if (!customer || !open) return;
    onOpenChange(false);
    onSuccess?.();
    navigate(customer.onboarded_at ? "/account" : "/account/welcome", {
      replace: true,
    });
  }, [customer, open, onOpenChange, onSuccess, navigate]);

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalBody className="pt-8">
        <div className="mb-6 flex justify-center">
          <Logo size="lg" />
        </div>
        <CustomerAuthForm onSuccess={() => {}} compact />
      </ModalBody>
    </Modal>
  );
}