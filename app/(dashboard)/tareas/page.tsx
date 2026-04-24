import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clock, Lock, Sparkles } from "lucide-react";

import { requireAuth } from "@/lib/auth";
import { mesActual } from "@/lib/gamificacion/periodo";
import {
  obtenerTareasUsuario,
  obtenerEstadisticasTareasUsuario,
} from "@/lib/tareas/queries";
import { obtenerProyeccionMesUsuario } from "@/lib/tareas/helpers";
import { Card, CardContent } from "@/components/ui/card";
import { KanbanTareas } from "@/components/tareas/KanbanTareas";
import { ModalNuevaAdHoc } from "@/components/tareas/ModalNuevaAdHoc";
import { VelocimetroPuntos } from "@/components/kpis/hitos/VelocimetroPuntos";

export const metadata = { title: "Mis tareas" };

export default async function TareasPage() {
  const user = await requireAuth();

  let tareas: Awaited<ReturnType<typeof obtenerTareasUsuario>> = [];
  let stats: Awaited<ReturnType<typeof obtenerEstadisticasTareasUsuario>> | null = null;
  let proyeccion: Awaited<ReturnType<typeof obtenerProyeccionMesUsuario>> | null = null;

  try {
    const { mes, anio } = mesActual();
    [tareas, stats, proyeccion] = await Promise.all([
      obtenerTareasUsuario(user.id),
      obtenerEstadisticasTareasUsuario({ userId: user.id, mes, anio }),
      obtenerProyeccionMesUsuario(user.id),
    ]);
  } catch (error) {
    console.warn(
      "[tareas] Schema Prompt 18 no aplicado aún:",
      error instanceof Error ? error.message : error,
    );
    return (
      <div className="mx-auto max-w-2xl space-y-4 py-12 text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-warning/15">
          <Lock className="h-6 w-6 text-warning" />
        </div>
        <h1 className="text-xl font-semibold">Sistema de tareas no disponible</h1>
        <p className="text-sm text-muted-foreground">
          El módulo de tareas operativas aún no está habilitado. Tu
          administrador debe aplicar el schema y los seeds.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Header + Velocímetro */}
      <Card>
        <CardContent className="grid gap-6 p-5 md:grid-cols-[1fr_auto]">
          <div className="flex flex-col justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Mis tareas
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Workflows, tareas asignadas y ad-hoc.{" "}
                <Link
                  href="/mi-progreso"
                  className="underline underline-offset-4 hover:text-foreground"
                >
                  Ver progreso del mes
                </Link>
              </p>
            </div>

            {/* Stats reorganizados */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatMini
                icon={<Sparkles className="h-3.5 w-3.5 text-primary" />}
                label="Puntos del mes"
                value={`${proyeccion?.puntosOtorgadosReales ?? 0} / 200`}
              />
              <StatMini
                icon={<CheckCircle2 className="h-3.5 w-3.5 text-success" />}
                label="Completadas"
                value={`${stats?.totalCompletadas ?? 0}`}
              />
              <StatMini
                icon={<Clock className="h-3.5 w-3.5 text-primary" />}
                label="A tiempo"
                value={`${Math.round(stats?.tasaATiempo ?? 0)}%`}
              />
              <StatMini
                icon={<AlertTriangle className="h-3.5 w-3.5 text-warning" />}
                label="Bloqueos"
                value={`${stats?.bloqueosActivos ?? 0}`}
                hint={
                  stats && stats.bloqueosReportados > stats.bloqueosActivos
                    ? `${stats.bloqueosReportados} en el mes`
                    : undefined
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <ModalNuevaAdHoc />
            </div>
          </div>

          {/* Velocímetro a la derecha */}
          <div className="flex items-start justify-center md:justify-end">
            <VelocimetroPuntos
              puntos={proyeccion?.puntosOtorgadosReales ?? 0}
              tope={200}
            />
          </div>
        </CardContent>
      </Card>

      {/* Banner de prorrateo si aplica */}
      {proyeccion && proyeccion.factor < 1 && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-xs">
          <p className="font-medium text-primary">Prorrateo activo este mes</p>
          <p className="mt-0.5 text-muted-foreground">
            Tu proyección es {proyeccion.totalProyectado} pts (brutos) y el tope
            mensual es 200. Cada tarea completada se otorga con factor{" "}
            <strong className="text-foreground">
              × {proyeccion.factor.toFixed(2)}
            </strong>{" "}
            para que el total final no exceda el tope.
          </p>
        </div>
      )}

      <KanbanTareas tareas={tareas} userId={user.id} />
    </div>
  );
}

function StatMini({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-background/50 p-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-1 text-xl font-semibold tabular-nums">{value}</p>
      {hint && (
        <p className="mt-0.5 text-[10px] text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}
