import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { slideUp } from "./variants";

export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      variants={slideUp}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="h-full"
    >
      {children}
    </motion.div>
  );
}