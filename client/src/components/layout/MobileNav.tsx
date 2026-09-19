import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { Button } from "@/components/ui";
import { useUIStore } from "@/stores/ui";
import { Sidebar } from "./Sidebar";
import type { User } from "@/api/types";

interface MobileNavProps {
  user: User;
  alerts?: number;
  onLogout: () => void;
}

export function MobileNav({ user, onLogout }: MobileNavProps) {
  const open = useUIStore((s) => s.mobileNavOpen);
  const setOpen = useUIStore((s) => s.setMobileNavOpen);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={() => setOpen(false)}
          />
          <motion.div
            key="drawer"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed left-0 top-0 z-50 h-full lg:hidden"
          >
            <div className="relative h-full">
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-4 z-10"
                onClick={() => setOpen(false)}
                aria-label="Закрыть меню"
              >
                <X className="h-5 w-5" />
              </Button>
              <Sidebar
                user={user}
                onLogout={() => {
                  setOpen(false);
                  onLogout();
                }}
                className="bg-card"
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}