import Link from "next/link";
import { ArrowLeft, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { requireAuth } from "@/lib/auth";
import { mesActual } from "@/lib/gamificacion/periodo";
import { obtenerHitosUsuario } from "@/lib/kpis/hitos-queries";
import { VelocimetroPuntos } from "@/components/kpis/hitos/VelocimetroPuntos";
import { ListaHitos } from "@/components/kpis/hitos/ListaHitos";

export const metadata = { title: "Mis hitos KPI" };

export default async function MisHitosKpiPage() {
  const user = await requireAuth();
  const { mes, anio } = mesActual();
  const progreso = await obtenerHitosUsuario(user.id, mes, anio);

  const sinHitos =
    progreso.semanales.length === 0 && progreso.mensuales.length === 0;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <Link
          href="/mi-progreso"
          className="mb-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3 w-3" />
          Volver a Mi progreso
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Mis hitos del mes</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {user.puesto?.nombre ?? "Sin puesto"} · Semana ISO {progreso.periodo.semana}
        </p>
      </div>

      {sinHitos ? (
        <div className="rounded-xl border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Aun no tienes hitos KPI configurados para tu puesto. Tu jefe o RRHH
            los activaran al iniciar el periodo.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[auto_1fr]">
            <div className="flex justify-center rounded-2xl border bg-card p-4">
              <VelocimetroPuntos
                puntos={progreso.puntosAcumulados}
                tope={progreso.puntosTope}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <ResumenCard
                icono={<CheckCircle2 className="h-4 w-4" />}
                color="text-success"
                label="Aprobados"
                valor={progreso.cantidadPorEstado.aprobado}
              />
              <ResumenCard
                icono={<Clock className="h-4 w-4" />}
                color="text-warning"
                label="En revision"
                valor={progreso.cantidadPorEstado.enRevision}
              />
              <ResumenCard
                icono={<AlertCircle className="h-4 w-4" />}
                color="text-muted-foreground"
                label="Pendientes"
                valor={progreso.cantidadPorEstado.pendiente}
              />
              <ResumenCard
                icono={<Clock className="h-4 w-4" />}
                color="text-destructive"
                label="Rechazados"
                valor={progreso.cantidadPorEstado.rechazado}
              />
            </div>
          </div>

          <ListaHitos
            titulo="Hitos semanales"
            subtitulo={`Esta semana (${progreso.periodo.semana}) — se cierran cada domingo`}
            hitos={progreso.semanales}
            semanaActual={progreso.periodo.semana}
          />
          <ListaHitos
            titulo="Hitos mensuales"
            subtitulo="Se cierran al final del mes"
            hitos={progreso.mensuales}
            semanaActual={progreso.periodo.semana}
          />
        </>
      )}
    </div>
  );
}

function ResumenCard({
  icono,
  color,
  label,
  valor,
}: {
  icono: React.ReactNode;
  color: string;
  label: string;
  valor: number;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card p-3">
      <div className={`shrink-0 ${color}`}>{icono}</div>
      <div className="min-w-0">
        <p className="text-2xl font-semibold tabular-nums leading-none">
          {valor}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
