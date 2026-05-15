import { FolderKanban } from "lucide-react";
import { requireJefe } from "@/lib/equipo/jefe";
import {
  agregarResumenProyectos,
  obtenerProyectosDelEquipo,
} from "@/lib/proyectos/queries-jefe";
import { Card, CardContent } from "@/components/ui/card";
import { HaloBackground } from "@/components/ui/primitives/HaloBackground";
import { KineticTitle } from "@/components/ui/primitives/KineticTitle";
import { StatsProyectosEquipo } from "@/components/mi-equipo/proyectos/StatsProyectosEquipo";
import { CardProyectoSalud } from "@/components/mi-equipo/proyectos/CardProyectoSalud";

export const metadata = { title: "Proyectos del equipo" };

const ORDEN_SALUD = { ROJO: 0, AMARILLO: 1, SIN_DATOS: 2, VERDE: 3 } as const;

export default async function ProyectosEquipoPage() {
  const user = await requireJefe();
  const areaId = user.areaId!;

  const proyectos = await obtenerProyectosDelEquipo({
    areaId,
    jefeId: user.id,
  });
  const resumen = agregarResumenProyectos(proyectos);

  const ordenados = [...proyectos].sort(
    (a, b) =>
      ORDEN_SALUD[a.salud] - ORDEN_SALUD[b.salud] ||
      a.fechaHito.getTime() - b.fechaHito.getTime(),
  );

  return (
    <div className="relative mx-auto max-w-6xl space-y-6">
      <section className="relative mb-2 overflow-hidden pb-4 pt-2">
        <HaloBackground variant="top" />
        <div className="relative space-y-2">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            {user.area?.nombre ?? "Área"} · {proyectos.length}{" "}
            {proyectos.length === 1 ? "proyecto activo" : "proyectos activos"}
          </p>
          <KineticTitle
            text="Proyectos del equipo"
            as="h1"
            className="text-3xl font-semibold tracking-tighter sm:text-4xl"
          />
          <p className="max-w-2xl text-sm text-muted-foreground">
            Salud, avance y carga por miembro de cada workflow donde participa tu
            equipo. Los críticos se muestran primero.
          </p>
        </div>
      </section>

      <StatsProyectosEquipo
        total={resumen.total}
        saludables={resumen.saludables}
        enRiesgo={resumen.enRiesgo}
        criticos={resumen.criticos}
      />

      {ordenados.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <FolderKanban className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">No hay proyectos activos</p>
            <p className="max-w-sm text-xs text-muted-foreground">
              Cuando tu equipo tenga workflows en curso (estado ACTIVO o PAUSADO)
              vas a verlos acá con su semáforo y avance.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {ordenados.map((p) => (
            <CardProyectoSalud key={p.id} proyecto={p} />
          ))}
        </div>
      )}
    </div>
  );
}
