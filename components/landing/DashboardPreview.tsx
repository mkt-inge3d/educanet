"use client";

import { motion } from "framer-motion";

import { GlassCard } from "@/components/ui/primitives/GlassCard";

export function DashboardPreview() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40, filter: "blur(20px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 1, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative"
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 rounded-full bg-primary/20 blur-3xl scale-90"
      />

      <GlassCard
        intensity="strong"
        className="aspect-[16/10] overflow-hidden"
        withPointerGlow={false}
      >
        <div className="flex items-center gap-2 border-b border-border/40 px-4 py-3">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-red-500/80" />
            <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
            <div className="h-3 w-3 rounded-full bg-green-500/80" />
          </div>
          <div className="ml-4 font-mono text-xs text-muted-foreground">
            educanet.app/inicio
          </div>
        </div>

        <div className="bg-background/40 p-6">
          <MockDashboard />
        </div>
      </GlassCard>
    </motion.div>
  );
}

function MockDashboard() {
  return (
    <div className="bento-grid">
      <div className="bento-3x2 glass rounded-xl p-6">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">
          Tu rango del mes
        </div>
        <div className="mt-2 text-4xl font-semibold text-shimmer-2026">
          Plata
        </div>
        <div className="mt-4 text-xs text-muted-foreground">
          1,240 / 1,400 pts para Oro
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
          <div className="h-full w-[75%] bg-primary" />
        </div>
      </div>

      <div className="bento-2x1 glass rounded-xl p-4">
        <div className="text-xs text-muted-foreground">Cursos activos</div>
        <div className="mt-1 text-2xl font-semibold tabular-nums">12</div>
      </div>

      <div className="bento-1x1 glass rounded-xl p-4">
        <div className="text-xs text-muted-foreground">Racha</div>
        <div className="mt-1 text-2xl font-semibold tabular-nums">5d</div>
      </div>

      <div className="bento-2x1 glass rounded-xl p-4">
        <div className="text-xs text-muted-foreground">Cumplimiento KPI</div>
        <div className="mt-1 text-2xl font-semibold tabular-nums">86%</div>
      </div>
    </div>
  );
}
