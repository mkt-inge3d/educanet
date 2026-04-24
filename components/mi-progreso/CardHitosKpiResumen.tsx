import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock, AlertCircle } from "lucide-react";

import { VelocimetroPuntos } from "@/components/kpis/hitos/VelocimetroPuntos";
import { GlassCard } from "@/components/ui/primitives/GlassCard";
import { obtenerHitosUsuario } from "@/lib/kpis/hitos-queries";

type Props = {
  userId: string;
  mes: number;
  anio: number;
};

export async function CardHitosKpiResumen({ userId, mes, anio }: Props) {
  const progreso = await obtenerHitosUsuario(userId, mes, anio);
  const sinHitos =
    progreso.semanales.length === 0 && progreso.mensuales.length === 0;

  if (sinHitos) {
    return (
      <GlassCard intensity="standard" className="h-full p-5">
        <h3 className="text-sm font-semibold">Mis hitos KPI</h3>
        <p className="mt-2 text-xs text-muted-foreground">
          Aún no tienes hitos configurados este mes.
        </p>
      </GlassCard>
    );
  }

  const { pendiente, enRevision, aprobado, rechazado } =
    progreso.cantidadPorEstado;

  return (
    <GlassCard intensity="standard" className="group h-full" interactive>
      <Link
        href="/compromisos?tab=hitos"
        className="flex h-full flex-col items-stretch gap-4 p-5 sm:flex-row"
      >
        <div className="flex shrink-0 items-center justify-center">
          <VelocimetroPuntos
            puntos={progreso.puntosAcumulados}
            tope={progreso.puntosTope}
          />
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Cumplimiento
                </p>
                <h3 className="mt-0.5 text-base font-semibold">Mis hitos KPI</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {progreso.semanales.length + progreso.mensuales.length} hitos este mes
                  {" · "}semana {progreso.periodo.semana}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
              <Stat
                icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                color="text-success"
                label="Aprobados"
                value={aprobado}
              />
              <Stat
                icon={<Clock className="h-3.5 w-3.5" />}
                color="text-warning"
                label="En revisión"
                value={enRevision}
              />
              <Stat
                icon={<AlertCircle className="h-3.5 w-3.5" />}
                color="text-muted-foreground"
                label="Pendientes"
                value={pendiente}
              />
              <Stat
                icon={<Clock className="h-3.5 w-3.5" />}
                color="text-destructive"
                label="Rechazados"
                value={rechazado}
              />
            </div>
          </div>
          <p className="mt-4 text-xs text-primary">Ver y reportar hitos →</p>
        </div>
      </Link>
    </GlassCard>
  );
}

function Stat({
  icon,
  color,
  label,
  value,
}: {
  icon: React.ReactNode;
  color: string;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={color}>{icon}</span>
      <div className="min-w-0">
        <p className="text-sm font-semibold tabular-nums leading-none">
          {value}
        </p>
        <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
          {label}
        </p>
      </div>
    </div>
  );
}
