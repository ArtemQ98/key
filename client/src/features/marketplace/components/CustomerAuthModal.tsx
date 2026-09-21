import { Modal, ModalBody } from "@/components/ui";
import { Logo } from "@/components/layout";
import { CustomerAuthForm } from "./CustomerAuthForm";

interface CustomerAuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CustomerAuthModal({ open, onOpenChange, onSuccess }: CustomerAuthModalProps) {
  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalBody className="pt-8">
        <div className="mb-6 flex justify-center">
          <Logo size="lg" />
        </div>
        <CustomerAuthForm onSuccess={onSuccess} compact />
      </ModalBody>
    </Modal>
  );
}