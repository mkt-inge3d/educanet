"use client";

import { cn } from "@/lib/utils";

interface LiquidRippleProps {
  trigger: boolean;
  color?: "primary" | "success";
  className?: string;
}

export function LiquidRipple({
  trigger,
  color = "primary",
  className,
}: LiquidRippleProps) {
  if (!trigger) return null;

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 rounded-[inherit] liquid-ripple",
        className,
      )}
      style={{
        background:
          color === "primary"
            ? "radial-gradient(circle, hsl(var(--primary) / 0.3) 0%, transparent 70%)"
            : "radial-gradient(circle, hsl(var(--success) / 0.35) 0%, transparent 70%)",
      }}
    />
  );
}
