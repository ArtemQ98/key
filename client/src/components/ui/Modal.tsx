import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  className?: string;
  /** Ширина модалки */
  size?: "sm" | "md" | "lg" | "xl";
  /** Скрыть кнопку закрытия */
  hideClose?: boolean;
}

const sizes = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

export function Modal({
  open,
  onOpenChange,
  children,
  className,
  size = "md",
  hideClose,
}: ModalProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
            "duration-200",
          )}
        />

        <DialogPrimitive.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 flex w-full -translate-x-1/2 -translate-y-1/2 flex-col",
            "max-h-[calc(100vh-2rem)] overflow-y-auto rounded-2xl border border-border bg-card shadow-elevated",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0",
            "data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95",
            "duration-200",
            sizes[size],
            className,
          )}
        >
          {!hideClose && (
            <DialogPrimitive.Close className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <X className="h-4 w-4" />
              <span className="sr-only">Закрыть</span>
            </DialogPrimitive.Close>
          )}
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export function ModalHeader({
  title,
  description,
  className,
}: {
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1 p-6 pb-4", className)}>
      <DialogPrimitive.Title className="text-lg font-semibold leading-tight">
        {title}
      </DialogPrimitive.Title>
      {description && (
        <DialogPrimitive.Description className="text-sm text-muted-foreground">
          {description}
        </DialogPrimitive.Description>
      )}
    </div>
  );
}

export function ModalBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("px-6 pb-6", className)} {...props} />;
}

export function ModalFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-center justify-end gap-3 border-t border-border p-4",
        className,
      )}
      {...props}
    />
  );
}