"use client";

import { forwardRef, useRef, useState } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const glassVariants = cva(
  "relative overflow-hidden transition-all duration-300 rounded-[var(--radius)]",
  {
    variants: {
      intensity: {
        subtle: "glass-subtle",
        standard: "glass",
        strong: "glass-strong",
      },
      interactive: {
        true: "hover:scale-[1.005] hover:-translate-y-0.5",
        false: "",
      },
    },
    defaultVariants: {
      intensity: "standard",
      interactive: false,
    },
  },
);

export interface GlassCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof glassVariants> {
  withPointerGlow?: boolean;
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  (
    {
      className,
      intensity,
      interactive,
      withPointerGlow = true,
      children,
      ...props
    },
    ref,
  ) => {
    const localRef = useRef<HTMLDivElement | null>(null);
    const [pos, setPos] = useState({ x: -200, y: -200 });
    const [glowOpacity, setGlowOpacity] = useState(0);

    const setRefs = (node: HTMLDivElement | null) => {
      localRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!withPointerGlow) return;
      const rect = localRef.current?.getBoundingClientRect();
      if (!rect) return;
      setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    return (
      <div
        ref={setRefs}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setGlowOpacity(withPointerGlow ? 1 : 0)}
        onMouseLeave={() => setGlowOpacity(0)}
        className={cn(glassVariants({ intensity, interactive }), className)}
        {...props}
      >
        {withPointerGlow && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -inset-px transition-opacity duration-300"
            style={{
              opacity: glowOpacity * 0.6,
              background: `radial-gradient(500px circle at ${pos.x}px ${pos.y}px, hsl(var(--primary) / 0.15), transparent 40%)`,
            }}
          />
        )}
        <div className="relative h-full">{children}</div>
      </div>
    );
  },
);

GlassCard.displayName = "GlassCard";
