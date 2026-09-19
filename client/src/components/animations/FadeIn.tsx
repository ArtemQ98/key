import { motion, type HTMLMotionProps } from "framer-motion";
import { fadeIn } from "./variants";
import { cn } from "@/lib/cn";

interface FadeInProps extends HTMLMotionProps<"div"> {
  delay?: number;
  className?: string;
}

export function FadeIn({ delay = 0, className, ...props }: FadeInProps) {
  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={{ delay }}
      className={cn(className)}
      {...props}
    />
  );
}