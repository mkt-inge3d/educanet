"use client";

import { motion, useScroll, useTransform } from "framer-motion";

import { cn } from "@/lib/utils";

interface GlassNavbarProps {
  children: React.ReactNode;
  className?: string;
  alwaysVisible?: boolean;
}

export function GlassNavbar({
  children,
  className,
  alwaysVisible = false,
}: GlassNavbarProps) {
  const { scrollY } = useScroll();
  const opacity = useTransform(
    scrollY,
    [0, 100],
    alwaysVisible ? [1, 1] : [0, 1],
  );
  const blur = useTransform(
    scrollY,
    [0, 100],
    alwaysVisible ? [20, 20] : [0, 20],
  );
  const backdrop = useTransform(blur, (v) => `blur(${v}px) saturate(180%)`);
  const bg = useTransform(opacity, (o) => `hsl(var(--background) / ${o * 0.7})`);
  const borderOpacity = useTransform(opacity, (o) => o * 0.5);

  return (
    <header className={cn("fixed top-0 inset-x-0 z-50", className)}>
      <motion.div
        aria-hidden="true"
        className="absolute inset-0 border-b"
        style={{
          opacity,
          backdropFilter: backdrop,
          WebkitBackdropFilter: backdrop,
          backgroundColor: bg,
          borderColor: useTransform(
            borderOpacity,
            (o) => `hsl(var(--border) / ${o})`,
          ),
        }}
      />
      <div className="relative">{children}</div>
    </header>
  );
}
