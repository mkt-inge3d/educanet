"use client";

import { motion } from "framer-motion";

type Props = {
  puntos: number;
  tope: number;
};

/**
 * Devuelve el color según el % de cumplimiento, usando los tokens de la
 * paleta 2026 (HSL-components envueltos en hsl()).
 */
function colorPorPorcentaje(pct: number): string {
  if (pct < 0.3) return "hsl(var(--destructive))";
  if (pct < 0.7) return "hsl(var(--warning))";
  return "hsl(var(--success))";
}

export function VelocimetroPuntos({ puntos, tope }: Props) {
  const pct = Math.max(0, Math.min(1, puntos / tope));
  const startAngle = 135;
  const endAngle = 405;
  const sweepTotal = endAngle - startAngle;
  const sweepActual = sweepTotal * pct;

  const radio = 90;
  const cx = 110;
  const cy = 110;
  const grosor = 16;

  const arc = (anguloFin: number) => {
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (anguloFin * Math.PI) / 180;
    const x1 = cx + radio * Math.cos(startRad);
    const y1 = cy + radio * Math.sin(startRad);
    const x2 = cx + radio * Math.cos(endRad);
    const y2 = cy + radio * Math.sin(endRad);
    const largeArc = anguloFin - startAngle > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${radio} ${radio} 0 ${largeArc} 1 ${x2} ${y2}`;
  };

  const fill = colorPorPorcentaje(pct);
  const filterId = "velocimetro-glow";

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg
          width={220}
          height={180}
          viewBox="0 0 220 180"
          className="overflow-visible"
        >
          <defs>
            {/* Glow sutil para el arco de progreso — estilo liquid glass */}
            <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Track de fondo — tinte sutil */}
          <path
            d={arc(endAngle)}
            stroke="hsl(var(--foreground) / 0.08)"
            strokeWidth={grosor}
            fill="none"
            strokeLinecap="round"
          />

          {/* Progreso con glow */}
          {pct > 0 && (
            <motion.path
              d={arc(startAngle + sweepActual)}
              stroke={fill}
              strokeWidth={grosor}
              fill="none"
              strokeLinecap="round"
              filter={`url(#${filterId})`}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            />
          )}

          {/* Marcas (0, 250, 500, 750, 1000) */}
          {[0, 0.25, 0.5, 0.75, 1].map((m) => {
            const angulo = startAngle + sweepTotal * m;
            const rad = (angulo * Math.PI) / 180;
            const r1 = radio + grosor / 2 + 2;
            const r2 = r1 + 6;
            return (
              <line
                key={m}
                x1={cx + r1 * Math.cos(rad)}
                y1={cy + r1 * Math.sin(rad)}
                x2={cx + r2 * Math.cos(rad)}
                y2={cy + r2 * Math.sin(rad)}
                stroke="hsl(var(--muted-foreground) / 0.5)"
                strokeWidth={1.5}
              />
            );
          })}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pt-4">
          <motion.span
            className="text-4xl font-semibold tabular-nums tracking-tight"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {puntos}
          </motion.span>
          <span className="text-xs text-muted-foreground">de {tope} pts</span>
        </div>
      </div>
      <div className="mt-2 flex w-full max-w-[220px] justify-between px-2 text-[10px] text-muted-foreground">
        <span>0</span>
        <span>{Math.round(tope / 2)}</span>
        <span>{tope}</span>
      </div>
    </div>
  );
}
