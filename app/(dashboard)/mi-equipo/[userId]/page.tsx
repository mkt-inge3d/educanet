import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { requireAuth } from "@/lib/auth";
import { esJefeDelArea, obtenerProyeccionMesUsuario } from "@/lib/tareas/helpers";
import { mesActual } from "@/lib/gamificacion/periodo";
import {
  obtenerAdHocsPendientesValidacion,
  obtenerCatalogoAsignableA,
  obtenerDatosMiembro,
  obtenerTareasDeMiembro,
} from "@/lib/tareas/queries-jefe";
import { Button } from "@/components/ui/button";
import { KanbanMiembro } from "@/components/tareas/jefe/KanbanMiembro";
import { PanelAdHocsValidacion } from "@/components/tareas/jefe/PanelAdHocsValidacion";
import { ModalAsignarTarea } from "@/components/tareas/jefe/ModalAsignarTarea";
import { VelocimetroMini } from "@/components/tareas/jefe/VelocimetroMini";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = { title: "Tareas del miembro" };

export default async function MiembroDetallePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const jefe = await requireAuth();

  const esAdmin = jefe.rol === "ADMIN" || jefe.rol === "RRHH";
  const esJefe = await esJefeDelArea(jefe.id, userId);
  if (!esAdmin && !esJefe) redirect("/unauthorized");

  const miembro = await obtenerDatosMiembro(userId);
  if (!miembro) notFound();

  const { mes, anio } = mesActual();

  const [tareas, adHocs, proyeccion, catalogoAsignable] = await Promise.all([
    obtenerTareasDeMiembro({ userId, mes, anio }),
    obtenerAdHocsPendientesValidacion(userId),
    obtenerProyeccionMesUsuario(userId),
    miembro.puestoId ? obtenerCatalogoAsignableA(miembro.puestoId) : [],
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Button variant="ghost" size="sm" render={<Link href="/mi-equipo" />}>
        <ArrowLeft />
        Volver a equipo
      </Button>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {miembro.nombre} {miembro.apellido}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {miembro.puesto?.nombre ?? "Sin puesto"}
            {miembro.area?.nombre ? ` · ${miembro.area.nombre}` : ""}
          </p>
        </div>
        <ModalAsignarTarea
          asignadoAId={miembro.id}
          asignadoANombre={`${miembro.nombre} ${miembro.apellido}`}
          catalogoAsignable={catalogoAsignable}
        />
      </header>

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-6 p-5">
          <VelocimetroMini
            puntos={proyeccion.puntosOtorgadosReales}
            tope={200}
          />
          <div className="flex-1 space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Puntos brutos acumulados</span>
              <span className="tabular-nums font-medium">
                {proyeccion.acumuladoBruto}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Pendientes proyectadas</span>
              <span className="tabular-nums font-medium">
                {proyeccion.proyectadoPendiente}
              </span>
            </div>
            <div className="flex justify-between gap-4 border-t pt-2">
              <span className="font-medium">Total proyectado del mes</span>
              <span className="tabular-nums font-semibold">
                {proyeccion.totalProyectado}
              </span>
            </div>
            {proyeccion.factor < 1 && (
              <div className="rounded-md bg-primary/10 p-2 text-xs text-primary">
                Prorrateo activo: las tareas se otorgan con factor{" "}
                <strong>× {proyeccion.factor.toFixed(2)}</strong> para no pasar
                el tope de 200 pts/mes.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {adHocs.length > 0 && (
        <PanelAdHocsValidacion tareas={adHocs} miembroNombre={miembro.nombre} />
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Tareas asignadas</h2>
        <KanbanMiembro tareas={tareas} jefeId={jefe.id} />
      </section>
    </div>
  );
}
