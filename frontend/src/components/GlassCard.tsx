import { cn } from "@/lib/utils";
import { motion, type HTMLMotionProps } from "framer-motion";
import { forwardRef } from "react";

type Props = HTMLMotionProps<"div"> & {
  variant?: "default" | "strong";
  glow?: "none" | "primary" | "accent";
};

export const GlassCard = forwardRef<HTMLDivElement, Props>(
  ({ className, variant = "default", glow = "none", ...props }, ref) => (
    <motion.div
      ref={ref}
      className={cn(
        "rounded-2xl p-5",
        variant === "default" ? "glass" : "glass-strong",
        glow === "primary" && "glow-primary",
        glow === "accent" && "glow-accent",
        className
      )}
      {...props}
    />
  )
);
GlassCard.displayName = "GlassCard";
