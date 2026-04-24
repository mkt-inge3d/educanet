import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertTriangle, CheckCircle2, ChevronRight, Lock } from "lucide-react";

import { requireAuth } from "@/lib/auth";
import { mesActual } from "@/lib/gamificacion/periodo";
import { obtenerPilotoContextoPorArea } from "@/lib/piloto/queries";
import { obtenerDashboardJefe } from "@/lib/jefe/queries";
import {
  obtenerWorkflowsActivos,
  obtenerPlantillasActivas,
} from "@/lib/tareas/queries";
import { obtenerPanelEquipoJefe } from "@/lib/tareas/queries-jefe";
import { AvisoAnonimizado } from "@/components/jefe/AvisoAnonimizado";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { HaloBackground } from "@/components/ui/primitives/HaloBackground";
import { KineticTitle } from "@/components/ui/primitives/KineticTitle";
import { VelocimetroMini } from "@/components/tareas/jefe/VelocimetroMini";
import { ModalProgramarWorkflow } from "@/components/tareas/jefe/ModalProgramarWorkflow";

export const metadata = { title: "Mi equipo" };

const TONO_SEMAFORO: Record<string, { label: string; className: string }> = {
  verde: { label: "OK", className: "bg-success/15 text-success" },
  amarillo: { label: "Atención", className: "bg-warning/15 text-warning" },
  rojo: { label: "Alerta", className: "bg-destructive/15 text-destructive" },
};

export default async function MiEquipoPage() {
  const user = await requireAuth();
  const esJefe = user.puesto?.nombre?.startsWith("Jefe") ?? false;
  const esAdmin = user.rol === "ADMIN" || user.rol === "RRHH";
  if (!esJefe && !esAdmin) redirect("/unauthorized");
  if (!user.areaId) redirect("/mi-progreso");

  const { mes, anio } = mesActual();

  // Data del equipo
  let miembros: Awaited<ReturnType<typeof obtenerPanelEquipoJefe>> = [];
  let workflows: Awaited<ReturnType<typeof obtenerWorkflowsActivos>> = [];
  let plantillas: Awaited<ReturnType<typeof obtenerPlantillasActivas>> = [];
  let dashboard: Awaited<ReturnType<typeof obtenerDashboardJefe>>;
  let ctxPiloto: Awaited<ReturnType<typeof obtenerPilotoContextoPorArea>>;

  try {
    [miembros, workflows, plantillas, dashboard, ctxPiloto] = await Promise.all([
      obtenerPanelEquipoJefe({ areaId: user.areaId, jefeId: user.id, mes, anio }),
      obtenerWorkflowsActivos(user.areaId),
      obtenerPlantillasActivas(),
      obtenerDashboardJefe({ jefeId: user.id, mes, anio }),
      obtenerPilotoContextoPorArea(user.areaId),
    ]);
  } catch (error) {
    console.warn(
      "[mi-equipo] Error cargando panel del equipo:",
      error instanceof Error ? error.message : error,
    );
    return (
      <div className="mx-auto max-w-2xl space-y-4 py-12 text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-warning/15">
          <Lock className="h-6 w-6 text-warning" />
        </div>
        <h1 className="text-xl font-semibold">Panel del equipo no disponible</h1>
        <p className="text-sm text-muted-foreground">
          Hubo un problema cargando la información del equipo. Contactá a tu
          administrador.
        </p>
      </div>
    );
  }

  const totalAdHocValidar = miembros.reduce((s, m) => s + m.adHocPorValidar, 0);

  return (
    <div className="relative mx-auto max-w-6xl space-y-6">
      <section className="relative mb-2 overflow-hidden pb-4 pt-2">
        <HaloBackground variant="top" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              {user.area?.nombre ?? "Área"} · {miembros.length} personas
            </p>
            <KineticTitle
              text="Mi equipo"
              as="h1"
              className="mt-1 text-3xl font-semibold tracking-tighter sm:text-4xl"
            />
            <p className="mt-2 text-sm text-muted-foreground">
              Cada card es una persona: velocímetro mensual, semáforo de salud
              y drill-down de sus tareas.
            </p>
          </div>
          <ModalProgramarWorkflow
            plantillas={plantillas}
            currentUserId={user.id}
            areaId={user.areaId}
          />
        </div>
      </section>

      {dashboard.enModoAnonimizado && (
        <AvisoAnonimizado
          fechaFin={ctxPiloto.config?.fechaFinAnonimizacion ?? null}
        />
      )}

      {totalAdHocValidar > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/5 p-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-warning" />
          <div className="flex-1 text-sm">
            <p className="font-medium">
              Tenés {totalAdHocValidar}{" "}
              {totalAdHocValidar === 1 ? "tarea" : "tareas"} ad-hoc por validar
            </p>
            <p className="text-muted-foreground">
              Tu equipo registró tareas por fuera del catálogo. Validalas para
              que reciban los puntos.
            </p>
          </div>
        </div>
      )}

      {/* Grid de cards por miembro — protagonista */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Tu equipo</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {miembros.length === 0 && (
            <Card>
              <CardContent className="p-6 text-center text-sm text-muted-foreground">
                No hay miembros en el área.
              </CardContent>
            </Card>
          )}
          {miembros.map((m) => {
            const semaforo = TONO_SEMAFORO[m.semaforo];
            return (
              <Link key={m.id} href={`/mi-equipo/${m.id}`} className="group">
                <Card className="h-full transition-colors hover:border-primary/40">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-base line-clamp-1">
                          {m.nombre} {m.apellido}
                        </CardTitle>
                        <CardDescription className="line-clamp-1">
                          {m.puestoNombre}
                        </CardDescription>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${semaforo.className}`}
                      >
                        {semaforo.label}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <VelocimetroMini
                      puntos={m.puntosOtorgadosReales}
                      tope={m.topePuntos}
                      rango={m.rangoActual}
                    />

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <Stat label="Tareas" value={`${m.completadas}/${m.totalTareas}`} />
                      <Stat
                        label="KPI cumpl."
                        value={
                          m.cumplimientoKpis != null
                            ? `${Math.round(m.cumplimientoKpis)}%`
                            : "—"
                        }
                      />
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {m.adHocPorValidar > 0 && (
                        <Badge variant="outline" className="border-warning/50 text-warning text-[10px]">
                          {m.adHocPorValidar} por validar
                        </Badge>
                      )}
                      {m.bloqueadas > 0 && (
                        <Badge variant="outline" className="text-[10px]">
                          {m.bloqueadas} bloq.
                        </Badge>
                      )}
                      {m.vencidas > 0 && (
                        <Badge variant="destructive" className="text-[10px]">
                          {m.vencidas} vencidas
                        </Badge>
                      )}
                    </div>

                    {m.factorProrrateo < 1 && (
                      <p className="text-[11px] text-muted-foreground">
                        Prorrateo: × {m.factorProrrateo.toFixed(2)} (proyección{" "}
                        {m.totalProyectado} → tope)
                      </p>
                    )}

                    <p className="flex items-center justify-end text-xs text-primary">
                      Ver tareas{" "}
                      <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Workflows activos (compacto) */}
      {workflows.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Workflows activos</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {workflows.map((w) => (
              <Card key={w.id}>
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground">
                        {w.contextoMarca ?? w.plantillaCodigo} · hito{" "}
                        {w.fechaHito.toLocaleDateString("es")}
                      </p>
                      <p className="line-clamp-1 text-sm font-medium">{w.nombre}</p>
                    </div>
                    {w.progreso === 100 ? (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    ) : null}
                  </div>
                  <Progress value={w.progreso} className="h-1.5" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {w.completadas}/{w.totalTareas} tareas
                    </span>
                    <span className="flex gap-2">
                      {w.bloqueadas > 0 && (
                        <span className="text-warning">{w.bloqueadas} bloq.</span>
                      )}
                      {w.vencidas > 0 && (
                        <span className="text-destructive">{w.vencidas} venc.</span>
                      )}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/50 bg-background/50 p-2">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold tabular-nums">{value}</p>
    </div>
  );
}
