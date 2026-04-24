"use client";

import { motion, useScroll, useTransform } from "framer-motion";

import { cn } from "@/lib/utils";

interface HaloBackgroundProps {
  variant?: "top" | "center";
  className?: string;
}

export function HaloBackground({
  variant = "top",
  className,
}: HaloBackgroundProps) {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 1000], [0, -200]);
  const opacity = useTransform(scrollY, [0, 500], [1, 0.3]);

  return (
    <motion.div
      aria-hidden="true"
      className={cn(
        "absolute inset-0 pointer-events-none",
        variant === "top" ? "bg-halo-top" : "bg-halo-center",
        className,
      )}
      style={{ y, opacity }}
    />
  );
}
