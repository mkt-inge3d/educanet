"use client";

import { motion, type Variants } from "framer-motion";

import { cn } from "@/lib/utils";

interface KineticTitleProps {
  text: string;
  className?: string;
  as?: "h1" | "h2" | "h3";
  shimmer?: boolean;
  stagger?: number;
}

const container: Variants = {
  hidden: { opacity: 0 },
  visible: (stagger: number) => ({
    opacity: 1,
    transition: { staggerChildren: stagger, delayChildren: 0.1 },
  }),
};

const wordVariant: Variants = {
  hidden: { opacity: 0, y: 20, filter: "blur(12px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

export function KineticTitle({
  text,
  className,
  as = "h1",
  shimmer = false,
  stagger = 0.03,
}: KineticTitleProps) {
  const words = text.split(" ");
  const MotionTag = motion[as];

  return (
    <MotionTag
      className={cn("text-kinetic", shimmer && "text-shimmer-2026", className)}
      variants={container}
      custom={stagger}
      initial="hidden"
      animate="visible"
    >
      {words.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          variants={wordVariant}
          className="inline-block mr-[0.25em]"
        >
          {word}
        </motion.span>
      ))}
    </MotionTag>
  );
}
