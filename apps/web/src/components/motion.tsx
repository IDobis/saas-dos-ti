"use client";

import { motion, type HTMLMotionProps } from "motion/react";

/** Entrada suave (fade + subida) para blocos de página. */
export function FadeIn({ delay = 0, ...props }: HTMLMotionProps<"div"> & { delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      {...props}
    />
  );
}

export const listItem = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0 },
};
