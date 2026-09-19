import * as DialogPrimitive from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import type { Variants } from "framer-motion";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { overlay } from "@/components/animations/variants";



interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: ReactNode;
  side?: "left" | "right" | "bottom";
  className?: string;
}

const sideClasses: Record<NonNullable<DrawerProps["side"]>, string> = {
  left: "left-0 top-0 h-full w-full max-w-md",
  right: "right-0 top-0 h-full w-full max-w-md",
  bottom: "bottom-0 left-0 w-full max-h-[85vh] rounded-t-2xl",
};

const sideMotion: Record<NonNullable<DrawerProps["side"]>, Variants> = {
  left: {
    hidden: { x: "-100%" },
    visible: { x: 0 },
    exit: { x: "-100%" },
  },
  right: {
    hidden: { x: "100%" },
    visible: { x: 0 },
    exit: { x: "100%" },
  },
  bottom: {
    hidden: { y: "100%" },
    visible: { y: 0 },
    exit: { y: "100%" },
  },
};

export function Drawer({
  open,
  onOpenChange,
  children,
  side = "right",
  className,
}: DrawerProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <DialogPrimitive.Portal forceMount>
            <DialogPrimitive.Overlay asChild forceMount>
              <motion.div
                variants={overlay}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
              />
            </DialogPrimitive.Overlay>

            <DialogPrimitive.Content asChild forceMount>
              <motion.div
                variants={sideMotion[side]}
                initial="hidden"
                animate="visible"
                exit="exit"
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className={cn(
                  "fixed z-50 overflow-y-auto border-border bg-card shadow-elevated",
                  side !== "bottom" && "border-l",
                  side === "bottom" && "border-t",
                  sideClasses[side],
                  className,
                )}
              >
                <DialogPrimitive.Close className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                  <X className="h-4 w-4" />
                  <span className="sr-only">Закрыть</span>
                </DialogPrimitive.Close>
                {children}
              </motion.div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  );
}