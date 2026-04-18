"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

const MAX_DELAY_INDEX = 10;

export function TimelineItemReveal({
  index,
  children,
}: {
  index: number;
  children: ReactNode;
}) {
  const delay = Math.min(index, MAX_DELAY_INDEX) * 0.04;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.25, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
