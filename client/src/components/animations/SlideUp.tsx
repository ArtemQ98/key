import { motion, type HTMLMotionProps } from "framer-motion";
import { slideUp } from "./variants";
import { cn } from "@/lib/cn";

interface SlideUpProps extends HTMLMotionProps<"div"> {
  delay?: number;
  className?: string;
}

export function SlideUp({ delay = 0, className, ...props }: SlideUpProps) {
  return (
    <motion.div
      variants={slideUp}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={{ delay }}
      className={cn(className)}
      {...props}
    />
  );
}