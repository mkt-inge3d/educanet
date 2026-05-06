import { AlertTriangle, CheckCircle2, Users, XCircle, Zap } from "lucide-react";

import { obtenerDiagnosticoCompleto } from "@/lib/admin/cobertura-puestos";
import { GlassCard } from "@/components/ui/primitives/GlassCard";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { BotonAsignarKpis } from "./BotonAsignarKpis";
import type { PuestoConDiagnostico, WorkflowConDiagnostico } from "@/lib/admin/cobertura-puestos";

export default async function PaginaCoberturaPuestos() {
  const diagnostico = await obtenerDiagnosticoCompleto();

  const totalErrores = diagnostico.puestos.reduce(
    (s, p) => s + p.alertas.filter((a) => a.severidad === "ERROR").length,
    0,
  );
  const totalAdvertencias = diagnostico.puestos.reduce(
    (s, p) => s + p.alertas.filter((a) => a.severidad === "WARNING").length,
    0,
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Cobertura de Puestos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Diagnóstico de asignación de KPIs, usuarios y workflows del sistema
        </p>
      </header>

      {/* Resumen */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <GlassCard className="flex items-center gap-4 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold">{diagnostico.puestos.length}</p>
            <p className="text-xs text-muted-foreground">Puestos en sistema</p>
          </div>
        </GlassCard>

        <GlassCard
          className={cn(
            "flex items-center gap-4 p-4",
            totalErrores > 0 && "border-destructive/40",
          )}
        >
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full",
              totalErrores > 0 ? "bg-destructive/10" : "bg-green-500/10",
            )}
          >
            <XCircle
              className={cn(
                "h-5 w-5",
                totalErrores > 0 ? "text-destructive" : "text-green-600",
              )}
            />
          </div>
          <div>
            <p className="text-2xl font-bold">{totalErrores}</p>
            <p className="text-xs text-muted-foreground">Errores críticos</p>
          </div>
        </GlassCard>

        <GlassCard className="flex items-center gap-4 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-warning/10">
            <AlertTriangle className="h-5 w-5 text-warning" />
          </div>
          <div>
            <p className="text-2xl font-bold">{totalAdvertencias}</p>
            <p className="text-xs text-muted-foreground">Advertencias</p>
          </div>
        </GlassCard>
      </div>

      {/* Tabla puestos */}
      <GlassCard className="p-6">
        <h2 className="mb-4 text-base font-semibold">Diagnóstico por puesto</h2>
        <div className="divide-y divide-border/40">
          {diagnostico.puestos.map((p) => (
            <PuestoRow key={p.puestoId} puesto={p} />
          ))}
        </div>
      </GlassCard>

      {/* Tabla workflows */}
      {diagnostico.workflows.length > 0 && (
        <GlassCard className="p-6">
          <h2 className="mb-4 text-base font-semibold">Plantillas de workflow activas</h2>
          <div className="divide-y divide-border/40">
            {diagnostico.workflows.map((w) => (
              <WorkflowRow key={w.plantillaId} workflow={w} />
            ))}
          </div>
        </GlassCard>
      )}

      {/* Acción manual */}
      <GlassCard className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-semibold">Asignación manual de KPIs</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              El cron automático corre el día 1 de cada mes a las 6am UTC. Usa este
              botón para ejecutarlo ahora sin esperar.
            </p>
            <div className="mt-4">
              <BotonAsignarKpis />
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

function PuestoRow({ puesto }: { puesto: PuestoConDiagnostico }) {
  const tieneError = puesto.alertas.some((a) => a.severidad === "ERROR");
  const tieneWarning = puesto.alertas.some((a) => a.severidad === "WARNING");

  return (
    <div className="flex flex-col gap-2 py-3 sm:flex-row sm:items-start">
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">{puesto.nombre}</span>
          <Badge variant="outline" className="text-[10px]">
            {puesto.area}
          </Badge>
          {tieneError && (
            <XCircle className="h-3.5 w-3.5 text-destructive" />
          )}
          {!tieneError && tieneWarning && (
            <AlertTriangle className="h-3.5 w-3.5 text-warning" />
          )}
          {!tieneError && !tieneWarning && (
            <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
          )}
        </div>
        <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span>
            {puesto.cantidadUsers === 0
              ? "Sin usuarios"
              : puesto.usuariosNombres.join(", ")}
          </span>
          <span>·</span>
          <span>{puesto.cantidadKpisDefinidos} KPIs</span>
        </div>
        {puesto.alertas.length > 0 && (
          <div className="mt-1.5 space-y-1">
            {puesto.alertas.map((a, i) => (
              <p
                key={i}
                className={cn(
                  "text-xs",
                  a.severidad === "ERROR"
                    ? "text-destructive"
                    : "text-warning-foreground",
                )}
              >
                {a.mensaje}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function WorkflowRow({ workflow }: { workflow: WorkflowConDiagnostico }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <div
        className={cn(
          "h-2 w-2 flex-shrink-0 rounded-full",
          workflow.estado === "OK"
            ? "bg-green-500"
            : workflow.estado === "WARNING"
              ? "bg-warning"
              : "bg-destructive",
        )}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{workflow.nombre}</p>
        <p className="text-xs text-muted-foreground">
          {workflow.totalTareas} tareas · {workflow.puestosRequeridos.join(", ")}
          {workflow.tareasSinAsignar > 0 && (
            <span className="ml-1 text-destructive">
              · {workflow.tareasSinAsignar} sin cobertura
            </span>
          )}
        </p>
      </div>
      <Badge
        variant="outline"
        className={cn(
          "text-[10px]",
          workflow.estado === "OK" && "border-green-500/30 text-green-700",
          workflow.estado === "WARNING" && "border-warning/30 text-warning",
          workflow.estado === "ERROR" && "border-destructive/30 text-destructive",
        )}
      >
        {workflow.estado}
      </Badge>
    </div>
  );
}
