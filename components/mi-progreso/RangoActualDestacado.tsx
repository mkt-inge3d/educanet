import { Medal, Award, Trophy, Gem } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TipoRango } from "@prisma/client";

const RANGO_VISUAL: Record<
  TipoRango,
  {
    icono: typeof Medal;
    label: string;
    gradiente: string;
    texto: string;
    iconoColor: string;
  }
> = {
  BRONCE: {
    icono: Medal,
    label: "Bronce",
    gradiente:
      "from-[#CD7F32]/40 via-[#B8732E]/25 to-amber-900/30 dark:from-[#CD7F32]/30 dark:via-[#8B5A2B]/25 dark:to-amber-950/40",
    texto: "text-amber-900 dark:text-amber-200",
    iconoColor: "text-[#CD7F32]",
  },
  PLATA: {
    icono: Award,
    label: "Plata",
    gradiente:
      "from-slate-300/50 via-slate-400/30 to-slate-500/20 dark:from-slate-400/30 dark:via-slate-500/25 dark:to-slate-700/40",
    texto: "text-slate-800 dark:text-slate-100",
    iconoColor: "text-slate-400 dark:text-slate-300",
  },
  ORO: {
    icono: Trophy,
    label: "Oro",
    gradiente:
      "from-[#FFD700]/40 via-amber-400/30 to-amber-600/25 dark:from-[#FFD700]/30 dark:via-amber-500/25 dark:to-amber-800/40",
    texto: "text-amber-900 dark:text-amber-100",
    iconoColor: "text-[#FFD700] drop-shadow-[0_0_8px_rgba(255,215,0,0.4)]",
  },
  DIAMANTE: {
    icono: Gem,
    label: "Diamante",
    gradiente:
      "from-cyan-200/50 via-sky-300/40 to-indigo-400/30 dark:from-cyan-400/30 dark:via-sky-500/25 dark:to-indigo-600/40",
    texto: "text-cyan-900 dark:text-cyan-100",
    iconoColor:
      "text-[#B9F2FF] drop-shadow-[0_0_10px_rgba(185,242,255,0.6)]",
  },
};

export function RangoActualDestacado({
  rango,
  puntos,
  siguienteRango,
  puntosParaSiguiente,
  porcentajeAlSiguiente,
  diasRestantes,
}: {
  rango: TipoRango;
  puntos: number;
  siguienteRango: TipoRango | null;
  puntosParaSiguiente: number;
  porcentajeAlSiguiente: number;
  diasRestantes: number;
}) {
  const visual = RANGO_VISUAL[rango];
  const Icono = visual.icono;
  const siguienteVisual = siguienteRango ? RANGO_VISUAL[siguienteRango] : null;

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl border p-6 sm:p-8",
        "bg-gradient-to-br",
        visual.gradiente
      )}
    >
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Icono className={cn("h-16 w-16 sm:h-20 sm:w-20", visual.iconoColor)} />
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Rango del mes
            </p>
            <h2
              className={cn(
                "text-3xl font-bold tracking-tight sm:text-4xl",
                rango === "DIAMANTE" ? "text-shimmer-2026" : visual.texto
              )}
            >
              {visual.label}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {puntos} puntos · {diasRestantes} dias restantes
            </p>
          </div>
        </div>

        {siguienteVisual && (
          <div className="flex min-w-0 flex-1 flex-col gap-2 sm:max-w-xs">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                Siguiente: {siguienteVisual.label}
              </span>
              <span className="font-medium">
                {Math.round(porcentajeAlSiguiente)}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-background/50">
              <div
                className="h-full rounded-full bg-primary transition-all duration-700"
                style={{ width: `${porcentajeAlSiguiente}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Te faltan {puntosParaSiguiente} puntos
            </p>
          </div>
        )}
      </div>

      <p className="mt-4 text-[11px] uppercase tracking-wider text-muted-foreground">
        Los puntos se reinician cada mes
      </p>
    </section>
  );
}
